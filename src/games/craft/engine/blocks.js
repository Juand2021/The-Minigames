// Registro de bloques de Maincra. hardness = segundos para romperlo (null = irrompible).

export const B = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  COBBLE: 4,
  LOG: 5,
  PLANKS: 6,
  LEAVES: 7,
  GLASS: 8,
  BRICK: 9,
  STONEBRICK: 10,
  SAND: 11,
  WATER: 12,
  BEDROCK: 13,
  COAL: 14,
  IRON: 15,
  TORCH: 16,
  DOOR: 17,
  FENCE: 18,
  CHEST: 19,
  TRUNK: 20, // tronco de árbol natural (de fondo, no sólido)
};

const def = (name, o) => ({ name, solid: true, hardness: 1, sound: 'stone', drop: null, light: 0, placeable: true, ...o });

export const BLOCKS = {
  [B.AIR]: def('Aire', { solid: false, hardness: null, placeable: false }),
  [B.GRASS]: def('Hierba', { hardness: 0.45, sound: 'grass', drop: B.DIRT, placeable: false }),
  [B.DIRT]: def('Tierra', { hardness: 0.4, sound: 'gravel' }),
  [B.STONE]: def('Piedra', { hardness: 1.1, drop: B.COBBLE }),
  [B.COBBLE]: def('Roca', { hardness: 1.2 }),
  [B.LOG]: def('Tronco', { hardness: 0.9, sound: 'wood' }),
  [B.PLANKS]: def('Tablones', { hardness: 0.8, sound: 'wood' }),
  [B.LEAVES]: def('Hojas', { solid: false, hardness: 0.2, sound: 'grass', drop: 'none', placeable: false }),
  [B.GLASS]: def('Vidrio', { hardness: 0.3, sound: 'glass' }),
  [B.BRICK]: def('Ladrillo', { hardness: 1.3 }),
  [B.STONEBRICK]: def('Ladrillo de piedra', { hardness: 1.3 }),
  [B.SAND]: def('Arena', { hardness: 0.4, sound: 'sand' }),
  [B.WATER]: def('Agua', { solid: false, hardness: null, placeable: false, sound: 'water' }),
  [B.BEDROCK]: def('Lecho de roca', { hardness: null, placeable: false }),
  [B.COAL]: def('Mena de carbón', { hardness: 1.3, drop: 'coal', placeable: false }),
  [B.IRON]: def('Mena de hierro', { hardness: 1.5, drop: 'iron', placeable: false }),
  [B.TORCH]: def('Antorcha', { solid: false, hardness: 0.05, sound: 'wood', light: 7 }),
  [B.DOOR]: def('Puerta', { solid: false, hardness: 0.7, sound: 'wood' }),
  [B.FENCE]: def('Valla', { hardness: 0.7, sound: 'wood' }),
  [B.CHEST]: def('Cofre', { hardness: null, sound: 'wood', placeable: false }),
  [B.TRUNK]: def('Tronco', { solid: false, hardness: 0.9, sound: 'wood', drop: B.LOG, placeable: false }),
};

export const isSolid = (id) => BLOCKS[id].solid;
export const dropOf = (id) => {
  const d = BLOCKS[id].drop;
  return d === null ? id : d;
};
