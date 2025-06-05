import React from 'react';
import { PlayerColor, PieceType } from '../types';
import { PIECE_UNICODE } from '../constants';

interface GameInfoPanelProps {
  currentPlayer: PlayerColor;
  currentTurnMoves: PieceType[];
  currentMoveInTurnIndex: number;
  message: string;
  gameStatus: string;
  onResetGame: () => void;
  onSkipSubTurn?: () => void; // Optional: for manual skip if auto-skip isn't enough
  canSkip: boolean;
}

const GameInfoPanel: React.FC<GameInfoPanelProps> = ({
  currentPlayer,
  currentTurnMoves,
  currentMoveInTurnIndex,
  message,
  gameStatus,
  onResetGame,
  onSkipSubTurn,
  canSkip
}) => {
  const getPlayerColorClass = (player: PlayerColor) => {
    return player === PlayerColor.RED ? 'text-red-600' : 'text-black';
  };

  return (
    <div className="game-info-panel p-6 w-full md:w-96 flex flex-col space-y-6">
      <h2 className="text-3xl font-bold text-center text-amber-900 mb-2">CỜ TƯỚNG NGẪU NHIÊN</h2>
      <p className="text-center text-sm text-amber-700 font-medium">Chế độ thử thách: đi quân theo thứ tự ngẫu nhiên</p>

      <div className="turn-indicator text-center">
        <p className="text-lg font-semibold text-amber-800 mb-2">Lượt chơi hiện tại</p>
        <div className={`text-2xl font-bold ${getPlayerColorClass(currentPlayer)} bg-white px-4 py-2 rounded-lg shadow-inner`}>
          {currentPlayer === PlayerColor.RED ? 'Đỏ' : 'Đen'}
        </div>
      </div>

      {gameStatus === 'ongoing' || gameStatus === 'check' ? (
        <div className="piece-sequence">
          <h3 className="text-lg font-semibold text-purple-800 mb-3 text-center">Thứ tự quân cờ phải đi</h3>
          <p className="text-sm text-purple-600 text-center mb-3">(Đi lần lượt từ trái sang phải)</p>
          <div className="flex justify-around items-center">
            {currentTurnMoves.map((pieceType, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`xiangqi-piece ${currentPlayer === PlayerColor.RED ? 'red' : 'black'} ${index === currentMoveInTurnIndex ? 'active-piece' : 'opacity-50'}`}
                  style={{
                    width: '50px',
                    height: '50px',
                    fontSize: '24px',
                    margin: '4px'
                  }}
                  title={pieceType}
                >
                  {PIECE_UNICODE[currentPlayer][pieceType] || '?'}
                </div>
                <span className="text-xs mt-1 text-purple-600 font-medium">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400 rounded-lg p-4 min-h-[80px] flex items-center justify-center shadow-inner">
        <p className={`text-center font-medium leading-relaxed ${message.includes("thắng") || message.includes("Chiến thắng")
            ? 'text-green-700 text-lg font-bold'
            : message.includes("Chiếu!")
              ? 'text-red-700 font-bold animate-pulse text-lg'
              : 'text-amber-800'
          }`}>
          {message || "Sẵn sàng bắt đầu ván mới..."}
        </p>
      </div>

      {onSkipSubTurn && gameStatus !== 'red_wins' && gameStatus !== 'black_wins' && gameStatus !== 'draw_stalemate' && (
        <button
          onClick={onSkipSubTurn}
          disabled={!canSkip}
          className={`btn w-full py-3 rounded-lg font-semibold transition-all duration-200 ${canSkip
              ? 'btn-warning hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
          Bỏ qua quân này
        </button>
      )}

      <button
        onClick={onResetGame}
        className="btn btn-primary w-full py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
      >
        Chơi lại
      </button>

      <div className="text-center text-xs text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
        <p className="mb-1">💡 Bấm vào quân sáng để chọn, bấm vào ô xanh để di chuyển</p>
        <p>Chỉ được đi đúng loại quân theo thứ tự bên trên!</p>
      </div>
    </div>
  );
};

export default GameInfoPanel;
