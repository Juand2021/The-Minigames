// Textos de la historia. Placeholders: reemplazar por humor/recuerdos propios.
export const cover = {
  eyebrow: 'Hecho con mucho cariño para ti',
  title: 'El Gran Desafío',
  subtitle: '5 pruebas. 1 premio. 0 excusas.',
  button: 'Empezar',
};

export const intros = {
  sudoku: 'Prueba 1: Sudoku. Sé que lo tuyo son los números. No me hagas quedar mal.',
  crossword: 'Prueba 2: Crucigrama. Ojo: las pistas hablan de nosotros. Si fallas, es sospechoso.',
  pool: 'Prueba 3: Billar. Aquí no vale culpar a la mesa.',
  gym: 'Prueba 5: Gym. Tres ejercicios, diez repeticiones cada uno y cero excusas. ¡Esa creatina no se toma sola!',
  craft: 'Prueba 4: Maincra. Sobrevive a la noche, protege los Four Lokos y a Juan… y luego ¡a construir!',
};

export const wins = {
  sudoku: '¡Sudoku resuelto! Obviamente.',
  crossword: '¡Crucigrama completo! Me conoces demasiado bien.',
  pool: '¡Mesa limpia! Eres peligrosa.',
  gym: '¡Tres ejercicios completados! Eres una máquina',
  craft: '¡Noche superada y Maincra construido! Juan está orgulloso',
};

// Mensajes cortos que aparecen durante el Sudoku (se elige uno al azar de cada lista).
export const sudokuToasts = {
  start: 'Concéntrate, que yo estoy mirando',
  pickFirst: 'Toca una casilla primero',
  error: [
    'Ups… ese número ya está por ahí',
    'Casi, pero no',
    'Eso no encaja, genia',
    'Respira. Otra vez',
  ],
  complete: ['¡Bloque completo!', '¡Qué manera de jugar!', 'Eso es talento', '¡Imparable!'],
  hint: ['Eso fue trampita… pero te la dejo', 'Una ayudita de tu fan #1', 'Shhh, no le digo a nadie'],
  win: '¡Sudoku resuelto! Eres increíble',
};

// Mensajes cortos del Crucigrama.
export const crosswordToasts = {
  start: 'Ojo: todas las pistas hablan de nosotros',
  pickFirst: 'Toca una casilla primero',
  word: ['¡Palabra completa!', '¡Esa la sabías!', '¡Me conoces demasiado bien!', '¡Imparable!'],
  wrong: ['Hay letras que no cuadran', 'Alguna falló… yo no digo cuál', 'Casi, casi'],
  allGood: 'Todo bien por ahora',
  hint: ['Te regalo una letra, pero me debes un abrazo', 'Trampita detectada', 'Solo por esta vez'],
  win: '¡Crucigrama completo! Me conoces mejor que nadie',
};

// Cinemática de inicio del billar. who: 'V' = el Quiz, 'P' = Laura. La última línea es de Laura y abre el botón "lista".
export const poolIntro = [
  { who: 'V', text: '¡JAJAJA! Por fin llegas… Soy el Quiz de Fenómenos de Transporte' },
  { who: 'P', text: 'Ay no… ¿tú otra vez? Si ya me arruinaste medio semestre' },
  { who: 'V', text: 'Reprobarte es mi pasión. Pero hoy no será con tinta… ¡será con taco y bolas!' },
  { who: 'P', text: '¿Un billar? Ahora sí te arrepentiste, hoja con patas' },
  { who: 'V', text: 'Si pierdes, me presentas mañana a las 7 a. m. Si ganas… me hago pedazos' },
  { who: 'P', text: 'Trato hecho. Voy a romper ese triángulo y a dejarte sin nota' },
];

// Billar: el rival es el Quiz de Fenómenos de Transporte. Cada lista se elige al azar.
export const poolLines = {
  intro: [
    '¡JAJAJA! Soy el Quiz de Fenómenos de Transporte. Si pierdes, ¡me presentas mañana!',
    'Te reto a un billar. Tú abres… ¡y no me quites el Cuatro Loko de la mesa!',
  ],
  yourTurn: ['Rompe el triángulo, genia', 'Tu turno. Respira y apunta', 'Dale con todo'],
  assigned: {
    solid: 'Te tocaron las LISAS (1-7). ¡Mételas todas y al final la 8!',
    stripe: 'Te tocaron las RAYADAS (9-15). ¡Mételas todas y al final la 8!',
  },
  vAssigned: 'Yo me quedo con las otras. ¡Prepárate para la entropía!',
  pPocket: ['¡NO! ¡Esa me daba la nota!', '¡Mi balance de masa!', 'Suerte de principiante…', '¡Me estás reprobando!'],
  pMiss: ['¡Jajaja! Esa ni el calor de transferencia la salva', 'Fallaste. Como en el parcial', 'Casi… pero no'],
  pFoul: ['¡FALTA! Como mi promedio de aprobación', 'Eso es falta. Bola en mano pa mí', '¡Falta! Reprobada'],
  vPocket: ['¡Ecuación resuelta!', 'Eso fue pura mecánica de fluidos', 'Fácil. Más fácil que el examen… para mí'],
  vMiss: ['Mmm… ¡fue el viscosímetro!', 'Esa no cuenta. Estaba distraído', '¡La mesa está inclinada!'],
  vFoul: ['¡¿FALTA?! ¡Eso es injusto!', 'Me equivoqué… ¡por culpa del coeficiente!', 'Uy… bola en mano para ti'],
  continueP: ['¡Sigues tú!', '¡Buen tiro! Otra vez', '¡Así se hace!'],
  eightEarlyP: 'Metiste la 8 antes de tiempo… ¡PERDISTE!',
  eightEarlyV: '¡NOOO! ¡Metí la 8 sin querer!',
  win: '¡NOOOO! ¡Me hiciste pedazos! …está bien, aprobaste.',
  lose: '¡JAJAJA! ¡Ganó el Quiz! ¡Nos vemos en el parcial!',
  loseReason: 'El Quiz de Fenómenos de Transporte te ganó esta vez. ¡Revancha!',
  eightEarlyLoseReason: 'Metiste la 8 antes de tiempo. ¡Revancha!',
};

// Gym: textos cortos durante los tres ejercicios.
export const gymLines = {
  go: ['¡Sentadillas! Toca, toca, toca', '¡A la barra! Desliza arriba y abajo', '¡Mancuernas! Alterna izquierda y derecha'],
  beast: ['¡MODO BESTIA!', '¡Así, fiera!', '¡Creatina activada!'],
  rep: ['¡Eso, Gym Rat!', '¡Cacorra estaría orgullosa!', '¡Ni el Four Loko te frena!', '¡Qué fuerza, mamacita!'],
  alternate: 'Alterna: ahora el otro brazo',
  exerciseDone: ['¡Sentadillas listas!', '¡Dominadas listas!', '¡Curl listo!'],
  low: ['¡MÁS RÁPIDO! Se te acaba la energía', '¡No pares! Que se te cae', '¡Dale, dale, dale!'],
  fail: {
    squat: ['¡La barra se le cayó encima!', '¡Aplastada por la barra!'],
    pullup: ['¡Se soltó de la barra!', '¡Cayó de espaldas!'],
    curl: ['¡Mancuerna en el pie!', '¡Se le cayó la pesa!'],
  },
  recover: ['¡Arriba, campeona! Pierdes 2 repeticiones', '¡Sacúdete y sigue! Pierdes 2 repeticiones'],
  out: '¡Sin vidas! Hoy el gym ganó',
  loseReason: 'Te lesionaste tres veces en el gym. ¡Menos pereza y más velocidad: revancha!',
};

// Cuando Laura pide una pista (Sudoku y Crucigrama) llega una de sus mascotas.
export const helperLines = {
  molly: [
    '¡Guau! Claro, Laura, ¡yo te ayudo!',
    '¡Guau, guau! Déjame olfatear la respuesta…',
    '¡Molly al rescate! Mira bien esta pista, Laura.',
    '¡Claro que sí, Laura! Te voy a ayudar, guau.',
  ],
  pirata: [
    'Arrr, claro Laura, este lobo de mar te ayuda.',
    'Miau-arrr… mi único ojo ya vio la respuesta.',
    '¡Por mi parche! Aquí está el tesoro, Laura.',
    'Claro, Laura, te voy a ayudar. ¡Miau, arrr!',
  ],
};

export const loses = [
  '¡Se acabó el tiempo! Pero no pasa nada, inténtalo otra vez.',
  'El reloj ganó esta ronda. La revancha es gratis.',
];
