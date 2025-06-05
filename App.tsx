import React, { useState, useEffect, useCallback } from 'react';
import { PlayerColor, PieceType, Coordinates, GameState, Piece, BoardState } from './types';
import { getInitialBoardState, ALL_PIECE_TYPES, PIECE_UNICODE } from './constants';
import Board from './components/Board';
import GameInfoPanel from './components/GameInfoPanel';
import OnlineRoom from './components/OnlineRoom';
import {
  getPossibleMovesForPiece,
  isKingInCheck,
  isMoveLegal,
  getAllLegalMovesForPiece,
  generateRandomPieceOrder,
  canPlayerMovePieceType,
  isCheckmate,
  isStalemate,
} from './utils/xiangqiGameLogic';

const App: React.FC = () => {
  const [mode, setMode] = useState<'menu' | 'offline' | 'online'>('menu');
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialPlayer = PlayerColor.RED;
    const initialTurnMoves = generateRandomPieceOrder();
    return {
      boardState: getInitialBoardState(),
      currentPlayer: initialPlayer,
      currentTurnMoves: initialTurnMoves,
      currentMoveInTurnIndex: 0,
      selectedPiece: null,
      validMoves: [],
      gameStatus: 'ongoing',
      message: `${initialPlayer}'s turn. Move a ${initialTurnMoves[0]}.`,
      isCheckingKing: false,
    };
  });

  const resetGame = useCallback(() => {
    const initialPlayer = PlayerColor.RED;
    const initialTurnMoves = generateRandomPieceOrder();
    setGameState({
      boardState: getInitialBoardState(),
      currentPlayer: initialPlayer,
      currentTurnMoves: initialTurnMoves,
      currentMoveInTurnIndex: 0,
      selectedPiece: null,
      validMoves: [],
      gameStatus: 'ongoing',
      message: `${initialPlayer}'s turn. Move a ${initialTurnMoves[0]}.`,
      isCheckingKing: false,
    });
  }, []);

  const advanceToNextSubTurnOrPlayer = useCallback((boardAfterMove: BoardState, previousPlayer: PlayerColor) => {
    const kingInCheck = isKingInCheck(boardAfterMove, previousPlayer === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED);
    const checkmate = isCheckmate(boardAfterMove, previousPlayer === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED);
    const stalemate = isStalemate(boardAfterMove, previousPlayer === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED);

    if (checkmate) {
      setGameState(prev => ({
        ...prev,
        boardState: boardAfterMove,
        gameStatus: previousPlayer === PlayerColor.RED ? 'red_wins' : 'black_wins',
        message: `Chiến thắng! ${previousPlayer} đã thắng!`,
        selectedPiece: null,
        validMoves: [],
      }));
      return;
    }
    if (stalemate) {
      setGameState(prev => ({
        ...prev,
        boardState: boardAfterMove,
        gameStatus: previousPlayer === PlayerColor.RED ? 'black_wins' : 'red_wins', // Player who is stalemated loses
        message: `Hòa! ${previousPlayer === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED} đã thắng!`,
        selectedPiece: null,
        validMoves: [],
      }));
      return;
    }

    let nextMoveIndex = gameState.currentMoveInTurnIndex + 1;
    let nextPlayer = gameState.currentPlayer;
    let nextTurnMoves = gameState.currentTurnMoves;
    let newBoardState = boardAfterMove;

    if (nextMoveIndex >= 3) {
      nextPlayer = gameState.currentPlayer === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED;
      nextTurnMoves = generateRandomPieceOrder();
      nextMoveIndex = 0;
    }

    // Auto-skip logic
    let currentPieceTypeForTurn = nextTurnMoves[nextMoveIndex];
    let skippedCount = 0;
    while (skippedCount < 3 && !canPlayerMovePieceType(newBoardState, nextPlayer, currentPieceTypeForTurn)) {
      // This message will be overwritten if all 3 are skipped.
      // messageLog.push(`${nextPlayer} cannot move ${currentPieceTypeForTurn}. Skipped.`);
      nextMoveIndex++;
      skippedCount++;
      if (nextMoveIndex >= 3) {
        // All 3 moves for current player potentially skipped
        // If this was triggered by original player's last sub-move, switch player and re-evaluate
        if (nextPlayer === gameState.currentPlayer) { // Still same player, means all their moves were skippable
          // This can happen if previous moves made subsequent required pieces unmovable
        }

        // This means the current player has used up their 3 sub-turns (or they were skipped)
        nextPlayer = nextPlayer === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED;
        nextTurnMoves = generateRandomPieceOrder();
        nextMoveIndex = 0;
        currentPieceTypeForTurn = nextTurnMoves[nextMoveIndex]; // Reset for new player
        // Reset skippedCount as we are evaluating for the new player
        skippedCount = 0; // Re-check for the new player from their first piece type
      } else {
        currentPieceTypeForTurn = nextTurnMoves[nextMoveIndex];
      }
    }

    const isNextPlayerKingInCheck = isKingInCheck(newBoardState, nextPlayer);
    let newMessage = `${nextPlayer}'s turn. Move a ${nextTurnMoves[nextMoveIndex]}.`;
    if (isNextPlayerKingInCheck) newMessage = `Chiếu! ${newMessage}`;


    setGameState(prev => ({
      ...prev,
      boardState: newBoardState,
      currentPlayer: nextPlayer,
      currentTurnMoves: nextTurnMoves,
      currentMoveInTurnIndex: nextMoveIndex,
      selectedPiece: null,
      validMoves: [],
      gameStatus: isNextPlayerKingInCheck ? 'check' : 'ongoing',
      message: newMessage,
      isCheckingKing: isNextPlayerKingInCheck,
    }));

  }, [gameState.currentPlayer, gameState.currentMoveInTurnIndex, gameState.currentTurnMoves]);


  const handleSquareClick = (row: number, col: number) => {
    if (gameState.gameStatus !== 'ongoing' && gameState.gameStatus !== 'check') return;

    const piece = gameState.boardState[row][col];
    const currentActivePieceType = gameState.currentTurnMoves[gameState.currentMoveInTurnIndex];

    if (gameState.selectedPiece) {
      const { piece: selected, coords: fromCoords } = gameState.selectedPiece;
      // Attempt to move
      if (gameState.validMoves.some(m => m.row === row && m.col === col)) {
        if (isMoveLegal(gameState.boardState, fromCoords, { row, col }, selected.color)) {
          const newBoardState = gameState.boardState.map(r => [...r]) as BoardState;
          newBoardState[row][col] = selected;
          newBoardState[fromCoords.row][fromCoords.col] = null;

          advanceToNextSubTurnOrPlayer(newBoardState, selected.color);

        } else {
          setGameState(prev => ({ ...prev, message: "Di chuyển không hợp lệ: đặt Vua của bạn vào thế chiếu.", selectedPiece: null, validMoves: [] }));
        }
      } else {
        // Clicked another square, or same square to deselect
        // If clicked another of own piece of correct type, select it
        if (piece && piece.color === gameState.currentPlayer && piece.type === currentActivePieceType) {
          const legalMoves = getAllLegalMovesForPiece(gameState.boardState, piece, row, col);
          setGameState(prev => ({
            ...prev,
            selectedPiece: { piece, coords: { row, col } },
            validMoves: legalMoves,
            message: legalMoves.length > 0 ? `Đã chọn ${piece.type}. Chọn điểm đến.` : `Đã chọn ${piece.type}. Không có nước đi hợp lệ.`
          }));
        } else { // Clicked empty or opponent, deselect
          setGameState(prev => ({ ...prev, selectedPiece: null, validMoves: [], message: `${prev.currentPlayer}'s turn. Move a ${currentActivePieceType}.` }));
        }
      }
    } else {
      // No piece selected, try to select one
      if (piece && piece.color === gameState.currentPlayer && piece.type === currentActivePieceType) {
        const legalMoves = getAllLegalMovesForPiece(gameState.boardState, piece, row, col);
        setGameState(prev => ({
          ...prev,
          selectedPiece: { piece, coords: { row, col } },
          validMoves: legalMoves,
          message: legalMoves.length > 0 ? `Đã chọn ${piece.type}. Chọn điểm đến.` : `Đã chọn ${piece.type}. Không có nước đi hợp lệ cho quân này.`
        }));
      }
    }
  };

  // Effect to auto-advance if current piece type cannot be moved by current player
  // This runs after player changes or sub-turn index changes
  useEffect(() => {
    if (gameState.gameStatus !== 'ongoing' && gameState.gameStatus !== 'check') return;

    const activePieceType = gameState.currentTurnMoves[gameState.currentMoveInTurnIndex];
    if (!canPlayerMovePieceType(gameState.boardState, gameState.currentPlayer, activePieceType)) {
      // console.log(`Auto-skipping: ${gameState.currentPlayer} cannot move ${activePieceType}`);
      // Create a "dummy" board state that is identical to current to pass to advance function
      // This ensures advanceToNextSubTurnOrPlayer uses the most current board
      const currentBoardStateCopy = gameState.boardState.map(r => [...r]) as BoardState;

      // Important: Pass the *current player* for whom the skip is happening
      advanceToNextSubTurnOrPlayer(currentBoardStateCopy, gameState.currentPlayer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentPlayer, gameState.currentMoveInTurnIndex, gameState.currentTurnMoves, gameState.boardState, gameState.gameStatus, advanceToNextSubTurnOrPlayer]);
  // Note: advanceToNextSubTurnOrPlayer is memoized with useCallback, so it's safe in deps.


  const handleSkipSubTurn = () => {
    if (gameState.gameStatus !== 'ongoing' && gameState.gameStatus !== 'check') return;
    // Manually skip the current sub-turn
    const currentBoardStateCopy = gameState.boardState.map(r => [...r]) as BoardState;
    advanceToNextSubTurnOrPlayer(currentBoardStateCopy, gameState.currentPlayer);
  };

  const canManuallySkip = (): boolean => {
    if (gameState.gameStatus !== 'ongoing' && gameState.gameStatus !== 'check') return false;
    // Allow manual skip if no piece is selected OR if selected piece has no valid moves
    if (!gameState.selectedPiece) return true;
    return gameState.validMoves.length === 0;
  }

  if (mode === 'menu') {
    return (
      <div className="xiangqi-main-wrapper flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-6">CỜ TƯỚNG NGẪU NHIÊN</h1>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button className="btn btn-primary" onClick={() => setMode('offline')}>Chơi trên cùng máy</button>
          <button className="btn btn-warning" onClick={() => setMode('online')}>Chơi online với bạn bè</button>
        </div>
        <div className="mt-8 text-xs text-gray-500">Bản quyền &copy; {new Date().getFullYear()} - luandz123</div>
      </div>
    );
  }
  if (mode === 'online') return <OnlineRoom onBackToMenu={() => setMode('menu')} />;

  return (
    <div className="xiangqi-main-wrapper">
      <div className="flex flex-col lg:flex-row gap-10 items-center justify-center w-full max-w-7xl mx-auto">
        <div className="flex-shrink-0">
          <Board
            boardState={gameState.boardState}
            selectedPieceInfo={gameState.selectedPiece}
            validMoves={gameState.validMoves}
            onSquareClick={handleSquareClick}
            currentPlayer={gameState.currentPlayer}
            currentActivePieceType={gameState.currentTurnMoves[gameState.currentMoveInTurnIndex]}
          />
        </div>
        <div className="flex-shrink-0 mt-8 lg:mt-0">
          <GameInfoPanel
            currentPlayer={gameState.currentPlayer}
            currentTurnMoves={gameState.currentTurnMoves}
            currentMoveInTurnIndex={gameState.currentMoveInTurnIndex}
            message={gameState.message}
            gameStatus={gameState.gameStatus}
            onResetGame={resetGame}
            onSkipSubTurn={handleSkipSubTurn}
            canSkip={canManuallySkip()}
          />
        </div>
      </div>
      <footer className="text-center text-amber-900 mt-8 max-w-4xl mx-auto">
        <div className="bg-white bg-opacity-60 rounded-lg p-4 shadow-md">
          <p className="text-base font-semibold mb-2">🎯 Cờ tướng ngẫu nhiên</p>
          <p className="text-xs opacity-90 mb-1">Luật: Mỗi lượt, 3 loại quân được chọn ngẫu nhiên, bạn phải đi đúng thứ tự đó. Không đi được thì tự động bỏ qua.</p>
          <p className="text-xs opacity-90 mb-1">Đỏ đi trước. Mỗi lượt, 3 loại quân được chọn ngẫu nhiên và phải đi theo đúng thứ tự.</p>
          <p className="text-xs opacity-75">Không thể đi sẽ tự động bỏ qua.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;

