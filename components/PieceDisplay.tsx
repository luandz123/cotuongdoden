import React from 'react';
import { Piece, PlayerColor } from '../types';
import { PIECE_UNICODE } from '../constants';

interface PieceDisplayProps {
  piece: Piece;
  isSelected: boolean;
}

const PieceDisplay: React.FC<PieceDisplayProps> = ({ piece, isSelected }) => {
  const pieceChar = PIECE_UNICODE[piece.color][piece.type];
  const colorClass = piece.color === PlayerColor.RED ? 'red' : 'black';
  const selectedClass = isSelected ? 'selected' : '';
  // Tooltip tiếng Việt cho từng loại quân
  const pieceNameVN: Record<string, string> = {
    'General': 'Tướng',
    'Advisor': 'Sĩ',
    'Elephant': 'Tượng',
    'Horse': 'Mã',
    'Chariot': 'Xe',
    'Cannon': 'Pháo',
    'Pawn': 'Tốt',
  };
  return (
    <div className={`xiangqi-piece ${colorClass} ${selectedClass}`} title={pieceNameVN[piece.type] || ''}>
      {pieceChar}
    </div>
  );
};

export default PieceDisplay;
