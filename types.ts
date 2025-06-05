
export enum PlayerColor {
  RED = 'RED',
  BLACK = 'BLACK',
}

export enum PieceType {
  GENERAL = 'General', // Shuai / Jiang
  ADVISOR = 'Advisor', // Shi
  ELEPHANT = 'Elephant', // Xiang
  HORSE = 'Horse', // Ma
  CHARIOT = 'Chariot', // Che
  CANNON = 'Cannon', // Pao
  PAWN = 'Pawn', // Bing / Zu
}

export interface Piece {
  type: PieceType;
  color: PlayerColor;
  id: string; // Unique ID for each piece instance, e.g., "r_chariot_1"
}

export interface Coordinates {
  row: number;
  col: number;
}

export type BoardState = (Piece | null)[][];

export interface GameState {
  boardState: BoardState;
  currentPlayer: PlayerColor;
  currentTurnMoves: PieceType[]; // The 3 random piece types for the current turn
  currentMoveInTurnIndex: number; // 0, 1, or 2, for which of the 3 random types is active
  selectedPiece: { piece: Piece; coords: Coordinates } | null;
  validMoves: Coordinates[];
  gameStatus: 'ongoing' | 'red_wins' | 'black_wins' | 'draw_stalemate' | 'check';
  message: string;
  isCheckingKing: boolean; // True if current player's king is in check
}
    