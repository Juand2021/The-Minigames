// Ajustes globales. Los tiempos están en segundos.
export const LEVELS = [
  { id: 'sudoku', icon: '🔢', name: 'Sudoku', seconds: 5 * 60 },
  { id: 'crossword', icon: '✏️', name: 'Crucigrama', seconds: 5 * 60 },
  { id: 'pool', icon: '🎱', name: 'Billar', seconds: 8 * 60 },
  { id: 'craft', icon: '⛏️', name: 'Minecraft', seconds: 8 * 60 },
];

// SOLO PRUEBAS: true deja abiertos todos los niveles desde el mapa.
// Volver a poner false antes de entregar el juego.
export const UNLOCK_ALL = true;

export const STORAGE_KEY = 'juego-especial:v1';
