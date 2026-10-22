import { createPool } from './PoolGame.js';
import { makeBallSet, makeBallShadow, makeTable } from './sprites.js';
import { lauraPortrait } from '../craft/engine/textures.js';

// Prepara en segundo plano la mesa, las bolas y el retrato para que el nivel abra al instante.
createPool.prewarm = () => {
  makeTable();
  makeBallSet();
  makeBallShadow();
  lauraPortrait();
};

export default createPool;
