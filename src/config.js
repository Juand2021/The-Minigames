// Ajustes globales. Los tiempos están en segundos (null = sin límite).
export const LEVELS = [
  { id: 'sudoku', icon: '🔢', name: 'Sudoku', tagline: 'Números y pura lógica', seconds: 5 * 60 },
  { id: 'crossword', icon: '✏️', name: 'Crucigrama', tagline: 'Pistas sobre nosotros', seconds: 5 * 60 },
  { id: 'pool', icon: '🎱', name: 'Billar', tagline: 'Duelo contra el Quiz', seconds: 8 * 60 },
  { id: 'craft', icon: '⛏️', name: 'Maincra', tagline: 'Sobrevive y construye', seconds: null }, // sin límite de tiempo (por ahora)
];

// SOLO PRUEBAS: true deja abiertos todos los niveles desde el mapa.
// Volver a poner false antes de entregar el juego.
export const UNLOCK_ALL = true;

export const STORAGE_KEY = 'juego-especial:v1';
