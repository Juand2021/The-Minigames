// Generador de Sudoku con solución única. Tablero = array plano de 81 enteros (0 = vacío).

const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const rowOf = (i) => Math.floor(i / 9);
export const colOf = (i) => i % 9;
export const boxOf = (i) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);

export function canPlace(board, i, n) {
  const r = rowOf(i);
  const c = colOf(i);
  for (let k = 0; k < 9; k++) {
    if (board[r * 9 + k] === n && r * 9 + k !== i) return false;
    if (board[k * 9 + c] === n && k * 9 + c !== i) return false;
  }
  const br = r - (r % 3);
  const bc = c - (c % 3);
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      const j = (br + y) * 9 + bc + x;
      if (board[j] === n && j !== i) return false;
    }
  }
  return true;
}

// Cuenta soluciones hasta `limit` eligiendo siempre la celda con menos candidatos.
function countSolutions(board, limit = 2) {
  let best = -1;
  let bestCands = null;
  for (let i = 0; i < 81; i++) {
    if (board[i] !== 0) continue;
    const cands = [];
    for (let n = 1; n <= 9; n++) if (canPlace(board, i, n)) cands.push(n);
    if (cands.length === 0) return 0;
    if (!bestCands || cands.length < bestCands.length) {
      best = i;
      bestCands = cands;
      if (cands.length === 1) break;
    }
  }
  if (best === -1) return 1;
  let total = 0;
  for (const n of bestCands) {
    board[best] = n;
    total += countSolutions(board, limit - total);
    board[best] = 0;
    if (total >= limit) break;
  }
  return total;
}

function fillRandom(board) {
  const i = board.indexOf(0);
  if (i === -1) return true;
  for (const n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (canPlace(board, i, n)) {
      board[i] = n;
      if (fillRandom(board)) return true;
      board[i] = 0;
    }
  }
  return false;
}

// clues: número de pistas objetivo (fácil-medio ≈ 36–40).
export function generatePuzzle(clues = 38) {
  const solution = new Array(81).fill(0);
  fillRandom(solution);
  const puzzle = solution.slice();
  let filled = 81;
  for (const i of shuffle([...Array(81).keys()])) {
    if (filled <= clues) break;
    const keep = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions(puzzle.slice()) !== 1) puzzle[i] = keep;
    else filled--;
  }
  return { puzzle, solution, clues: filled };
}

export { countSolutions };
