import { BoardState, Piece, PlayerColor, Coordinates, PieceType } from '../types';
import { BOARD_ROWS, BOARD_COLS } from '../constants';

// Helper to check if coordinates are within board boundaries
export function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS;
}

// Helper to check if a square is in the palace for a given player
export function isInPalace(row: number, col: number, player: PlayerColor): boolean {
  if (col < 3 || col > 5) return false;
  if (player === PlayerColor.RED) return row >= 0 && row <= 2;
  return row >= 7 && row <= 9; // BLACK
}

// Helper to check if a square is on the player's side of the river
export function isAcrossRiver(row: number, player: PlayerColor): boolean {
  if (player === PlayerColor.RED) return row > 4;
  return row < 5; // BLACK
}

function getPieceAt(board: BoardState, coords: Coordinates): Piece | null {
  if (!isInBounds(coords.row, coords.col)) return null;
  return board[coords.row][coords.col];
}

// --- Piece Specific Movement Logic ---

function getGeneralMoves(board: BoardState, piece: Piece, r: number, c: number): Coordinates[] {
  const moves: Coordinates[] = [];
  const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of deltas) {
    const nextR = r + dr;
    const nextC = c + dc;
    if (isInPalace(nextR, nextC, piece.color)) {
      const targetPiece = getPieceAt(board, { row: nextR, col: nextC });
      if (!targetPiece || targetPiece.color !== piece.color) {
        // Check if this move would cause Flying General
        const tempBoard = board.map(row => [...row]);
        tempBoard[nextR][nextC] = piece;
        tempBoard[r][c] = null;

        const opponentColor = piece.color === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED;
        const opponentGeneral = findKing(tempBoard, opponentColor);

        if (opponentGeneral && opponentGeneral.col === nextC) {
          let intervening = 0;
          const startRow = Math.min(nextR, opponentGeneral.row) + 1;
          const endRow = Math.max(nextR, opponentGeneral.row);
          for (let checkRow = startRow; checkRow < endRow; checkRow++) {
            if (tempBoard[checkRow][nextC]) intervening++;
          }
          if (intervening === 0) continue; // Would cause Flying General, skip this move
        }

        moves.push({ row: nextR, col: nextC });
      }
    }
  }
  return moves;
}

function getAdvisorMoves(board: BoardState, piece: Piece, r: number, c: number): Coordinates[] {
  const moves: Coordinates[] = [];
  const deltas = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [dr, dc] of deltas) {
    const nextR = r + dr;
    const nextC = c + dc;
    if (isInPalace(nextR, nextC, piece.color)) {
      const targetPiece = getPieceAt(board, { row: nextR, col: nextC });
      if (!targetPiece || targetPiece.color !== piece.color) {
        moves.push({ row: nextR, col: nextC });
      }
    }
  }
  return moves;
}

function getElephantMoves(board: BoardState, piece: Piece, r: number, c: number): Coordinates[] {
  const moves: Coordinates[] = [];
  const deltas = [[-2, -2], [-2, 2], [2, -2], [2, 2]];
  for (const [dr, dc] of deltas) {
    const nextR = r + dr;
    const nextC = c + dc;
    const blockR = r + dr / 2;
    const blockC = c + dc / 2;

    if (!isInBounds(nextR, nextC) || isAcrossRiver(nextR, piece.color)) continue;
    if (getPieceAt(board, { row: blockR, col: blockC })) continue; // Elephant eye blocked

    const targetPiece = getPieceAt(board, { row: nextR, col: nextC });
    if (!targetPiece || targetPiece.color !== piece.color) {
      moves.push({ row: nextR, col: nextC });
    }
  }
  return moves;
}

function getHorseMoves(board: BoardState, piece: Piece, r: number, c: number): Coordinates[] {
  const moves: Coordinates[] = [];
  const L_SHAPES = [
    // Up/Down L's
    [-2, -1], [-2, 1], [2, -1], [2, 1],
    // Left/Right L's
    [-1, -2], [-1, 2], [1, -2], [1, 2]
  ];

  for (const [dr, dc] of L_SHAPES) {
    const nextR = r + dr;
    const nextC = c + dc;
    if (!isInBounds(nextR, nextC)) continue;

    // Check for hobble
    let hobbleR = r, hobbleC = c;
    if (Math.abs(dr) === 2) hobbleR = r + dr / 2; // Moving 2 vertically, hobble is 1 vertical
    else hobbleC = c + dc / 2; // Moving 2 horizontally, hobble is 1 horizontal

    if (getPieceAt(board, { row: hobbleR, col: hobbleC })) continue; // Hobbled

    const targetPiece = getPieceAt(board, { row: nextR, col: nextC });
    if (!targetPiece || targetPiece.color !== piece.color) {
      moves.push({ row: nextR, col: nextC });
    }
  }
  return moves;
}

function getChariotMoves(board: BoardState, piece: Piece, r: number, c: number): Coordinates[] {
  const moves: Coordinates[] = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of directions) {
    for (let i = 1; ; i++) {
      const nextR = r + dr * i;
      const nextC = c + dc * i;
      if (!isInBounds(nextR, nextC)) break;
      const targetPiece = getPieceAt(board, { row: nextR, col: nextC });
      if (targetPiece) {
        if (targetPiece.color !== piece.color) moves.push({ row: nextR, col: nextC });
        break;
      }
      moves.push({ row: nextR, col: nextC });
    }
  }
  return moves;
}

function getCannonMoves(board: BoardState, piece: Piece, r: number, c: number): Coordinates[] {
  const moves: Coordinates[] = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (const [dr, dc] of directions) {
    let screenFound = false;

    for (let i = 1; ; i++) {
      const nextR = r + dr * i;
      const nextC = c + dc * i;

      if (!isInBounds(nextR, nextC)) break;

      const targetPiece = getPieceAt(board, { row: nextR, col: nextC });

      if (!targetPiece) {
        // Empty square
        if (!screenFound) {
          // Can move here if no screen found yet
          moves.push({ row: nextR, col: nextC });
        }
        // If screen found, continue looking for target to capture
      } else {
        // Found a piece
        if (!screenFound) {
          // This piece becomes the screen, cannot capture it
          screenFound = true;
        } else {
          // Already have a screen, can capture this piece if it's opponent's
          if (targetPiece.color !== piece.color) {
            moves.push({ row: nextR, col: nextC });
          }
          // Either way, stop searching in this direction
          break;
        }
      }
    }
  }
  return moves;
}

function getPawnMoves(board: BoardState, piece: Piece, r: number, c: number): Coordinates[] {
  const moves: Coordinates[] = [];
  const forwardDir = piece.color === PlayerColor.RED ? 1 : -1;

  // Forward move
  const nextRForward = r + forwardDir;
  if (isInBounds(nextRForward, c)) {
    const targetPiece = getPieceAt(board, { row: nextRForward, col: c });
    if (!targetPiece || targetPiece.color !== piece.color) {
      moves.push({ row: nextRForward, col: c });
    }
  }

  // Sideways moves (if across river)
  if (isAcrossRiver(r, piece.color)) {
    const sidewaysDeltas = [[0, -1], [0, 1]];
    for (const [dr, dc] of sidewaysDeltas) {
      const nextRSide = r + dr; // dr is 0 here
      const nextCSide = c + dc;
      if (isInBounds(nextRSide, nextCSide)) {
        const targetPiece = getPieceAt(board, { row: nextRSide, col: nextCSide });
        if (!targetPiece || targetPiece.color !== piece.color) {
          moves.push({ row: nextRSide, col: nextCSide });
        }
      }
    }
  }
  return moves;
}


export function getPossibleMovesForPiece(
  board: BoardState,
  piece: Piece,
  r: number,
  c: number
): Coordinates[] {
  switch (piece.type) {
    case PieceType.GENERAL: return getGeneralMoves(board, piece, r, c);
    case PieceType.ADVISOR: return getAdvisorMoves(board, piece, r, c);
    case PieceType.ELEPHANT: return getElephantMoves(board, piece, r, c);
    case PieceType.HORSE: return getHorseMoves(board, piece, r, c);
    case PieceType.CHARIOT: return getChariotMoves(board, piece, r, c);
    case PieceType.CANNON: return getCannonMoves(board, piece, r, c);
    case PieceType.PAWN: return getPawnMoves(board, piece, r, c);
    default: return [];
  }
}

export function findKing(board: BoardState, player: PlayerColor): Coordinates | null {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (piece && piece.type === PieceType.GENERAL && piece.color === player) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

// Check if the player's king is in check
export function isKingInCheck(board: BoardState, kingPlayer: PlayerColor): boolean {
  const kingPos = findKing(board, kingPlayer);
  if (!kingPos) return false; // Should not happen in a valid game

  const opponentColor = kingPlayer === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED;

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (piece && piece.color === opponentColor) {
        // Special check for "Flying General"
        if (piece.type === PieceType.GENERAL) {
          if (c === kingPos.col) { // Same column
            let interveningPieces = 0;
            const startRow = Math.min(r, kingPos.row) + 1;
            const endRow = Math.max(r, kingPos.row);
            for (let checkRow = startRow; checkRow < endRow; checkRow++) {
              if (board[checkRow][c]) interveningPieces++;
            }
            if (interveningPieces === 0) return true; // Generals are facing
          }
        } else {
          const possibleMoves = getPossibleMovesForPiece(board, piece, r, c);
          if (possibleMoves.some(move => move.row === kingPos.row && move.col === kingPos.col)) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

// Check if a move is legal (doesn't put own king in check)
export function isMoveLegal(
  board: BoardState,
  from: Coordinates,
  to: Coordinates,
  player: PlayerColor
): boolean {
  const pieceToMove = board[from.row][from.col];
  if (!pieceToMove || pieceToMove.color !== player) return false;

  // Create a temporary board to simulate the move
  const tempBoard: BoardState = board.map(row => [...row]);
  tempBoard[to.row][to.col] = pieceToMove;
  tempBoard[from.row][from.col] = null;

  // Check if this move results in the current player's king being in check
  if (isKingInCheck(tempBoard, player)) {
    return false;
  }

  // Additionally, check for "Flying General" rule specifically after any move
  const redKingPos = findKing(tempBoard, PlayerColor.RED);
  const blackKingPos = findKing(tempBoard, PlayerColor.BLACK);
  if (redKingPos && blackKingPos && redKingPos.col === blackKingPos.col) {
    let intervening = 0;
    for (let r = Math.min(redKingPos.row, blackKingPos.row) + 1; r < Math.max(redKingPos.row, blackKingPos.row); r++) {
      if (tempBoard[r][redKingPos.col]) intervening++;
    }
    if (intervening === 0) return false; // Move results in flying general
  }

  return true;
}

export function getAllLegalMovesForPiece(
  board: BoardState,
  piece: Piece,
  r: number,
  c: number
): Coordinates[] {
  const possibleMoves = getPossibleMovesForPiece(board, piece, r, c);
  return possibleMoves.filter(move => isMoveLegal(board, { row: r, col: c }, move, piece.color));
}


export function generateRandomPieceOrder(): PieceType[] {
  const order: PieceType[] = [];
  const availableTypes = [
    PieceType.GENERAL, PieceType.ADVISOR, PieceType.ELEPHANT,
    PieceType.HORSE, PieceType.CHARIOT, PieceType.CANNON, PieceType.PAWN
  ];
  for (let i = 0; i < 3; i++) {
    order.push(availableTypes[Math.floor(Math.random() * availableTypes.length)]);
  }
  return order;
}

export function canPlayerMovePieceType(
  board: BoardState,
  player: PlayerColor,
  pieceType: PieceType
): boolean {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (piece && piece.color === player && piece.type === pieceType) {
        const legalMoves = getAllLegalMovesForPiece(board, piece, r, c);
        if (legalMoves.length > 0) {
          return true;
        }
      }
    }
  }
  return false;
}

export function hasAnyLegalMoves(board: BoardState, player: PlayerColor): boolean {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (piece && piece.color === player) {
        if (getAllLegalMovesForPiece(board, piece, r, c).length > 0) {
          return true;
        }
      }
    }
  }
  return false;
}

export function isCheckmate(board: BoardState, playerInCheck: PlayerColor): boolean {
  return isKingInCheck(board, playerInCheck) && !hasAnyLegalMoves(board, playerInCheck);
}

export function isStalemate(board: BoardState, playerToCheck: PlayerColor): boolean {
  // In Xiangqi, stalemate is when a player has no legal moves but is NOT in check. This is a win for the other player.
  return !isKingInCheck(board, playerToCheck) && !hasAnyLegalMoves(board, playerToCheck);
}
