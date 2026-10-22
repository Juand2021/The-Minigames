import { createCraft } from './CraftGame.js';
import { makeBlockTextures, makeCracks, makeCharacterSprites } from './engine/textures.js';

// Prepara en segundo plano lo más pesado (texturas y personajes) para que el nivel abra al instante.
createCraft.prewarm = () => {
  makeBlockTextures();
  makeCracks();
  makeCharacterSprites();
};

export default createCraft;
