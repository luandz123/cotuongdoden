import React from 'react';
import { BoardState, Coordinates, Piece, PlayerColor, PieceType } from '../types';
import PieceDisplay from './PieceDisplay';
import { BOARD_ROWS, BOARD_COLS } from '../constants';

interface BoardProps {
  boardState: BoardState;
  selectedPieceInfo: { piece: Piece; coords: Coordinates } | null;
  validMoves: Coordinates[];
  onSquareClick: (row: number, col: number) => void;
  currentPlayer: PlayerColor;
  currentActivePieceType: PieceType | null; // The piece type player must move
}

const Board: React.FC<BoardProps> = ({
  boardState,
  selectedPieceInfo,
  validMoves,
  onSquareClick,
  currentPlayer,
  currentActivePieceType,
}) => {
  // Create an array for rows in reverse for typical Xiangqi display (Red at bottom)
  const displayRows = Array.from({ length: BOARD_ROWS }, (_, i) => BOARD_ROWS - 1 - i);

  const getSquareClasses = (row: number, col: number, piece: Piece | null): string => {
    let classes = ['board-square'];

    const isSelected = selectedPieceInfo?.coords.row === row && selectedPieceInfo?.coords.col === col;
    const isValidMove = validMoves.some((move: Coordinates) => move.row === row && move.col === col);
    const isSelectable = piece && piece.color === currentPlayer && piece.type === currentActivePieceType && !isSelected;

    if (isSelected) classes.push('selected');
    if (isValidMove) {
      classes.push('valid-move');
      if (piece) classes.push('capture');
    }
    if (isSelectable) classes.push('selectable');

    return classes.join(' ');
  };

  // Render palace diagonal lines
  const renderPalaceLines = () => {
    const lines = [];
    const squareSize = 100 / BOARD_COLS; // Percentage width of each square

    // Red palace (bottom) - rows 0-2, cols 3-5
    // Top-left to bottom-right diagonal
    lines.push(
      <div
        key="red-palace-1"
        className="palace-line"
        style={{
          left: `${3 * squareSize}%`,
          top: `${(BOARD_ROWS - 3) * (100 / BOARD_ROWS)}%`,
          width: `${2 * squareSize}%`,
          transform: 'rotate(45deg)',
          transformOrigin: 'left center',
        }}
      />
    );

    // Top-right to bottom-left diagonal
    lines.push(
      <div
        key="red-palace-2"
        className="palace-line"
        style={{
          left: `${5 * squareSize}%`,
          top: `${(BOARD_ROWS - 3) * (100 / BOARD_ROWS)}%`,
          width: `${2 * squareSize}%`,
          transform: 'rotate(-45deg)',
          transformOrigin: 'left center',
        }}
      />
    );

    // Black palace (top) - rows 7-9, cols 3-5
    lines.push(
      <div
        key="black-palace-1"
        className="palace-line"
        style={{
          left: `${3 * squareSize}%`,
          top: `${(BOARD_ROWS - 10) * (100 / BOARD_ROWS)}%`,
          width: `${2 * squareSize}%`,
          transform: 'rotate(45deg)',
          transformOrigin: 'left center',
        }}
      />
    );

    lines.push(
      <div
        key="black-palace-2"
        className="palace-line"
        style={{
          left: `${5 * squareSize}%`,
          top: `${(BOARD_ROWS - 10) * (100 / BOARD_ROWS)}%`,
          width: `${2 * squareSize}%`,
          transform: 'rotate(-45deg)',
          transformOrigin: 'left center',
        }}
      />
    );

    return lines;
  };

  return (
    <div className="xiangqi-board grid grid-cols-9 relative" style={{ aspectRatio: `${BOARD_COLS}/${BOARD_ROWS}` }}>
      {/* Đường chéo cung tướng */}
      {renderPalaceLines()}
      {/* Sông */}
      <div className="river-text">
        <span className="river-chu">楚河</span>
        <span className="river-han">漢界</span>
      </div>
      {/* Các ô trên bàn cờ */}
      {displayRows.map((row: number) =>
        boardState[row].map((piece: Piece | null, col: number) => (
          <div
            key={`${row}-${col}`}
            className={`w-full h-full relative flex items-center justify-center ${getSquareClasses(row, col, piece)}`}
            onClick={() => onSquareClick(row, col)}
          >
            {piece && (
              <PieceDisplay
                piece={piece}
                isSelected={selectedPieceInfo?.coords.row === row && selectedPieceInfo?.coords.col === col}
              />
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Board;
