import React, { useState, useEffect, useRef } from 'react';
import { createRoom, joinRoom, getRoomState, updateRoomState, subscribeRoomState } from '../onlineGameApi';
import { getInitialBoardState } from '../constants';
import { PlayerColor, GameState } from '../types';
import Board from './Board';
import GameInfoPanel from './GameInfoPanel';
import {
    getPossibleMovesForPiece,
    isKingInCheck,
    isMoveLegal,
    getAllLegalMovesForPiece,
    generateRandomPieceOrder,
    canPlayerMovePieceType,
    isCheckmate,
    isStalemate,
} from '../utils/xiangqiGameLogic';

const initialGameState: GameState = {
    boardState: getInitialBoardState(),
    currentPlayer: PlayerColor.RED,
    currentTurnMoves: generateRandomPieceOrder(),
    currentMoveInTurnIndex: 0,
    selectedPiece: null,
    validMoves: [],
    gameStatus: 'ongoing',
    message: 'Đỏ đi trước.',
    isCheckingKing: false,
};

const OnlineRoom: React.FC = () => {
    const [step, setStep] = useState<'input' | 'waiting' | 'playing'>('input');
    const [name, setName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [myColor, setMyColor] = useState<PlayerColor | null>(null);
    const [gameState, setGameState] = useState<GameState>(initialGameState);
    const [roomInfo, setRoomInfo] = useState<any>(null);
    const [error, setError] = useState('');
    const [copyMsg, setCopyMsg] = useState('');
    const subRef = useRef<any>(null);

    // Tạo phòng mới
    const handleCreateRoom = async () => {
        setError('');
        try {
            const code = await createRoom(name, initialGameState);
            setRoomCode(code);
            setMyColor(PlayerColor.RED);
            setStep('waiting');
        } catch (e) {
            setError('Không thể tạo phòng!');
        }
    };

    // Vào phòng bằng mã
    const handleJoinRoom = async () => {
        setError('');
        try {
            const info = await joinRoom(roomCode, name);
            if (!info) throw new Error();
            setRoomInfo(info);
            setMyColor(PlayerColor.BLACK);
            setStep('playing');
            const state = await getRoomState(roomCode);
            setGameState(state);
        } catch (e) {
            setError('Không tìm thấy phòng hoặc phòng đã đủ người!');
        }
    };

    // Khi chủ phòng chờ người vào, lắng nghe phòng
    useEffect(() => {
        if (step === 'waiting' && roomCode) {
            const interval = setInterval(async () => {
                const info = await getRoomState(roomCode).catch(() => null);
                if (info && info.currentPlayer) {
                    setStep('playing');
                }
            }, 1500);
            return () => clearInterval(interval);
        }
    }, [step, roomCode]);

    // Lắng nghe realtime khi đang chơi
    useEffect(() => {
        if (step === 'playing' && roomCode) {
            if (subRef.current) subRef.current.unsubscribe();
            subRef.current = subscribeRoomState(roomCode, (newState) => {
                setGameState(newState);
            });
            return () => { if (subRef.current) subRef.current.unsubscribe(); };
        }
    }, [step, roomCode]);

    // Khi đi nước, chỉ người đến lượt mới được đi
    const handleMove = (newState: GameState) => {
        if (gameState.currentPlayer !== myColor) return;
        updateRoomState(roomCode, newState);
    };

    // Copy mã phòng
    const handleCopy = () => {
        navigator.clipboard.writeText(roomCode);
        setCopyMsg('Đã sao chép!');
        setTimeout(() => setCopyMsg(''), 1500);
    };

    // Giao diện nhập tên, tạo/vào phòng
    if (step === 'input') return (
        <div className="flex flex-col items-center justify-center gap-4 p-6">
            <h2 className="text-2xl font-bold mb-2">Chơi Online</h2>
            <input className="border rounded px-3 py-2 text-lg" placeholder="Nhập tên của bạn" value={name} onChange={e => setName(e.target.value)} />
            <div className="flex gap-2 mt-2">
                <button className="btn btn-primary" disabled={!name} onClick={handleCreateRoom}>Tạo phòng mới</button>
                <input className="border rounded px-2 py-1 w-28" placeholder="Mã phòng" value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} />
                <button className="btn btn-warning" disabled={!name || !roomCode} onClick={handleJoinRoom}>Vào phòng</button>
            </div>
            {error && <div className="text-red-600 font-semibold mt-2">{error}</div>}
        </div>
    );

    // Giao diện chờ người vào phòng
    if (step === 'waiting') return (
        <div className="flex flex-col items-center justify-center gap-4 p-6">
            <h2 className="text-xl font-bold">Chờ bạn vào phòng...</h2>
            <div>Mã phòng: <span className="font-mono text-lg bg-yellow-100 px-2 py-1 rounded">{roomCode}</span> <button className="btn btn-primary ml-2" onClick={handleCopy}>Sao chép</button></div>
            {copyMsg && <div className="text-green-600">{copyMsg}</div>}
            <div className="mt-2">Gửi mã phòng cho bạn bè để cùng chơi!</div>
            <div className="mt-2 text-sm text-gray-500">(Khi có người vào phòng, ván cờ sẽ bắt đầu)</div>
        </div>
    );

    // Giao diện chơi cờ online
    return (
        <div className="w-full flex flex-col items-center">
            <div className="mb-2 flex flex-col items-center">
                <div className="mb-1">Phòng: <span className="font-mono bg-yellow-100 px-2 py-1 rounded">{roomCode}</span> <button className="btn btn-primary ml-2" onClick={handleCopy}>Sao chép</button></div>
                {copyMsg && <div className="text-green-600">{copyMsg}</div>}
                <div className="flex gap-4 mt-2">
                    <div className={myColor === PlayerColor.RED ? "font-bold text-red-600" : ""}>Đỏ: {myColor === PlayerColor.RED ? name : roomInfo?.player1 || '...'}</div>
                    <div className={myColor === PlayerColor.BLACK ? "font-bold text-black" : ""}>Đen: {myColor === PlayerColor.BLACK ? name : roomInfo?.player2 || '...'}</div>
                </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                <Board
                    boardState={gameState.boardState}
                    selectedPieceInfo={gameState.selectedPiece}
                    validMoves={gameState.validMoves}
                    onSquareClick={handleSquareClick}
                    currentPlayer={gameState.currentPlayer}
                    currentActivePieceType={gameState.currentTurnMoves[gameState.currentMoveInTurnIndex]}
                />
                <GameInfoPanel
                    currentPlayer={gameState.currentPlayer}
                    currentTurnMoves={gameState.currentTurnMoves}
                    currentMoveInTurnIndex={gameState.currentMoveInTurnIndex}
                    message={gameState.message}
                    gameStatus={gameState.gameStatus}
                    onResetGame={() => { }}
                    canSkip={false}
                />
            </div>
        </div>
    );
};

export default OnlineRoom;
