// Ajustes globales. Los tiempos están en segundos (null = sin límite).
export const LEVELS = [
  { id: 'sudoku', icon: 'sudoku', name: 'Sudoku', tagline: 'Números y pura lógica', seconds: 10 * 60 },
  { id: 'crossword', icon: 'crossword', name: 'Crucigrama', tagline: 'Pistas sobre nosotros', seconds: 6 * 60 },
  { id: 'pool', icon: 'pool', name: 'Billar', tagline: 'Duelo contra el Quiz', seconds: null },
  { id: 'craft', icon: 'craft', name: 'Maincra', tagline: 'Sobrevive y construye', seconds: null }, // sin límite de tiempo (por ahora)
  { id: 'gym', icon: 'gym', name: 'Gym', tagline: 'Sentadillas, dominadas y curl', seconds: 3 * 60 },
];

// SOLO PRUEBAS: true deja abiertos todos los niveles desde el mapa.
// Volver a poner false antes de entregar el juego.
// (con ?locked en la URL se prueba el modo real, con niveles bloqueados)
export const UNLOCK_ALL = true && !(typeof location !== 'undefined' && location.search.includes('locked'));

export const STORAGE_KEY = 'juego-especial:v1';
