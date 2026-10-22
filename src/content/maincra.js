// Textos de Maincra (nivel 4). who: 'sofia' | 'juan' | 'zombie' | 'creeper'
// scene: 'chestScene' muestra el cofre abierto en lugar del retrato.

export const maincraIntro = [
  { who: 'sofia', scene: 'chestScene', text: '¡Mira, Juan! Llenamos el cofre con 5 Four Lokos para esta noche 🥫' },
  { who: 'sofia', scene: 'chestScene', text: 'Y también hay pastel, pan, manzanas y galletas… pero lo más valioso son los Four Lokos 🎂🍎' },
  { who: 'juan', text: '…*mastica pasto con su mandarina en la cabeza* 🍊🦫' },
  { who: 'zombie', text: 'Grrr… Fooour… Lookooos… 🧟' },
  { who: 'creeper', text: 'Ssssssss… 💚' },
  { who: 'sofia', text: '¡Ni lo sueñen! Juan, detrás de mí. Voy a defender ese cofre.' },
  { who: 'sofia', text: 'Tengo unos segundos antes de que oscurezca: muros, antorchas… ¡lo que sea!' },
];
export const maincraIntroButton = '¡A defender el cofre! ⚔️';

export const maincraTips = [
  'Joystick: moverte · ⤒ saltar · ⚔️ atacar',
  'Mantén el dedo sobre un bloque para picarlo · toca un hueco para poner el bloque elegido',
  'Los zombis vienen a robar Four Lokos. Si se llevan todos… ¡van por Juan!',
];

export const chat = {
  prep: 'Atardece… prepárate (o toca «¡Estoy lista!»)',
  wave: (n, total) => (n === total ? `¡Luna llena! Última oleada (${n}/${total}) 🌕` : `Oleada ${n}/${total}: ¡ahí vienen! 🌙`),
  stealLoko: (left) => `¡Un zombi se robó un Four Loko! Quedan ${left} 🥫😱`,
  stealBoom: (left) => `¡Un Four Loko explotó! Quedan ${left} 💥`,
  stealJuan: '¡¡SE ESTÁN LLEVANDO A JUAN!! ¡Rescátalo! 🦫😭',
  escapeLoko: 'Se escapó con un Four Loko… 😭',
  recover: (left) => `¡Recuperaste un Four Loko! (${left}) 🥫💜`,
  lokoDropped: '¡Soltó el Four Loko! Recógelo antes de que vuelvan 🥫',
  juanSaved: '¡Juan está a salvo! 🦫💜',
  ironSword: '¡Espada encantada! ⚔️✨ Ahora pegas más fuerte',
  dawn: '¡Amaneció! Los mobs arden con el sol ☀️🔥',
};

export const survivalWin = {
  title: '¡Sobreviviste a la noche!',
  line: (lokos, kills) => `Salvaste ${lokos} Four Loko${lokos === 1 ? '' : 's'}, a Juan y derrotaste ${kills} mobs. Ahora… ¡a construir! 🧱`,
  button: '¡A construir! 🧱',
};

export const survivalLose = {
  title: 'La noche ganó esta vez',
  button: 'Reintentar la noche 🌙',
};

// Antes de cada construcción
export const buildIntros = {
  house: [
    { who: 'juan', text: '*mira a Laura con ojitos* … Juan necesita una casita 🦫🏠' },
    { who: 'sofia', text: 'Una casa clásica: base de roca, columnas de tronco, tablones, ventanas de vidrio y puerta.' },
  ],
  bridge: [
    { who: 'sofia', text: 'Al otro lado del río hay más Four Lokos… ¡necesitamos un puente!' },
    { who: 'juan', text: '*Juan no sabe nadar… bueno, sí sabe, pero prefiere el puente* 🦫' },
  ],
  tadeo: [
    { who: 'sofia', text: 'Y para terminar… ¡el arco de la Tadeo! Ladrillo por ladrillo 🧱' },
    { who: 'juan', text: '*Juan se pone el casco de constructor* … 🦫👷' },
  ],
};

export const buildComments = {
  0: 'Mmm… a Juan le da miedo entrar ahí 😅',
  1: 'Se sostiene… más o menos 😬',
  2: '¡Muy bien! Casi perfecto ✨',
  3: '¡PERFECTO! Arquitecta certificada 🏆',
};

export const buildFinal = {
  title: '¡Maincra completado!',
  line: (score, stars) => `Puntaje total: ${score} · ${stars}/9 ⭐ — Juan, los Four Lokos y la Tadeo te lo agradecen 💜`,
  button: '¡Terminar Maincra! 🎉',
};
