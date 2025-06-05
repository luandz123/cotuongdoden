
import { PlayerColor, PieceType, Piece, BoardState } from './types';

export const BOARD_ROWS = 10;
export const BOARD_COLS = 9;

export const PIECE_UNICODE: Record<PlayerColor, Record<PieceType, string>> = {
  [PlayerColor.RED]: {
    [PieceType.GENERAL]: '帥',
    [PieceType.ADVISOR]: '仕',
    [PieceType.ELEPHANT]: '相',
    [PieceType.HORSE]: '傌',
    [PieceType.CHARIOT]: '俥',
    [PieceType.CANNON]: '炮',
    [PieceType.PAWN]: '兵',
  },
  [PlayerColor.BLACK]: {
    [PieceType.GENERAL]: '將',
    [PieceType.ADVISOR]: '士',
    [PieceType.ELEPHANT]: '象',
    [PieceType.HORSE]: '馬',
    [PieceType.CHARIOT]: '車',
    [PieceType.CANNON]: '砲',
    [PieceType.PAWN]: '卒',
  },
};

export const ALL_PIECE_TYPES: PieceType[] = [
  PieceType.GENERAL, PieceType.ADVISOR, PieceType.ELEPHANT,
  PieceType.HORSE, PieceType.CHARIOT, PieceType.CANNON, PieceType.PAWN
];

export function createPiece(type: PieceType, color: PlayerColor, instance: number): Piece {
  return { type, color, id: `${color.charAt(0).toLowerCase()}_${type.toLowerCase()}_${instance}` };
}

export const getInitialBoardState = (): BoardState => {
  const board: BoardState = Array(BOARD_ROWS)
    .fill(null)
    .map(() => Array(BOARD_COLS).fill(null));

  // Place Red pieces
  board[0][0] = createPiece(PieceType.CHARIOT, PlayerColor.RED, 1);
  board[0][1] = createPiece(PieceType.HORSE, PlayerColor.RED, 1);
  board[0][2] = createPiece(PieceType.ELEPHANT, PlayerColor.RED, 1);
  board[0][3] = createPiece(PieceType.ADVISOR, PlayerColor.RED, 1);
  board[0][4] = createPiece(PieceType.GENERAL, PlayerColor.RED, 1);
  board[0][5] = createPiece(PieceType.ADVISOR, PlayerColor.RED, 2);
  board[0][6] = createPiece(PieceType.ELEPHANT, PlayerColor.RED, 2);
  board[0][7] = createPiece(PieceType.HORSE, PlayerColor.RED, 2);
  board[0][8] = createPiece(PieceType.CHARIOT, PlayerColor.RED, 2);
  board[2][1] = createPiece(PieceType.CANNON, PlayerColor.RED, 1);
  board[2][7] = createPiece(PieceType.CANNON, PlayerColor.RED, 2);
  for (let i = 0; i < 5; i++) {
    board[3][i * 2] = createPiece(PieceType.PAWN, PlayerColor.RED, i + 1);
  }

  // Place Black pieces
  board[9][0] = createPiece(PieceType.CHARIOT, PlayerColor.BLACK, 1);
  board[9][1] = createPiece(PieceType.HORSE, PlayerColor.BLACK, 1);
  board[9][2] = createPiece(PieceType.ELEPHANT, PlayerColor.BLACK, 1);
  board[9][3] = createPiece(PieceType.ADVISOR, PlayerColor.BLACK, 1);
  board[9][4] = createPiece(PieceType.GENERAL, PlayerColor.BLACK, 1);
  board[9][5] = createPiece(PieceType.ADVISOR, PlayerColor.BLACK, 2);
  board[9][6] = createPiece(PieceType.ELEPHANT, PlayerColor.BLACK, 2);
  board[9][7] = createPiece(PieceType.HORSE, PlayerColor.BLACK, 2);
  board[9][8] = createPiece(PieceType.CHARIOT, PlayerColor.BLACK, 2);
  board[7][1] = createPiece(PieceType.CANNON, PlayerColor.BLACK, 1);
  board[7][7] = createPiece(PieceType.CANNON, PlayerColor.BLACK, 2);
  for (let i = 0; i < 5; i++) {
    board[6][i * 2] = createPiece(PieceType.PAWN, PlayerColor.BLACK, i + 1);
  }

  return board;
};
    