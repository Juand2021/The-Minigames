// Comprueba el generador: solución válida, unicidad, nº de pistas y tiempos.
import { generatePuzzle, countSolutions, canPlace } from '../src/games/sudoku/generator.js';

const N = 100;
let worst = 0;
let total = 0;
for (let t = 0; t < N; t++) {
  const t0 = performance.now();
  const { puzzle, solution, clues } = generatePuzzle(38);
  const ms = performance.now() - t0;
  worst = Math.max(worst, ms);
  total += ms;
  for (let i = 0; i < 81; i++) {
    if (!canPlace(solution, i, solution[i])) throw new Error('solución inválida');
    if (puzzle[i] && puzzle[i] !== solution[i]) throw new Error('puzzle no coincide');
  }
  if (countSolutions(puzzle.slice()) !== 1) throw new Error('no es única');
  if (clues < 36 || clues > 42) throw new Error(`pistas fuera de rango: ${clues}`);
}
console.log(`OK ${N} tableros · media ${(total / N).toFixed(1)} ms · peor ${worst.toFixed(1)} ms`);
