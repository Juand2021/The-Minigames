// Iconos ilustrados propios (SVG). Cada uno es un dibujo con volumen: degradados, brillos y contorno.
// Uso: icon('trophy') devuelve un <svg> que hereda el tamaño del texto (1em). Los de flecha usan currentColor.

const O = 'stroke="#1d0f2e" stroke-opacity=".55" stroke-width="2" stroke-linejoin="round"';
const G = 'xmlns="http://www.w3.org/2000/svg"';

// Degradados compartidos (se definen una sola vez en el sprite)
const DEFS = `
<linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3a8"/><stop offset=".45" stop-color="#ffd166"/><stop offset="1" stop-color="#e09a1a"/></linearGradient>
<linearGradient id="gPink" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc2e0"/><stop offset=".5" stop-color="#ff5fa2"/><stop offset="1" stop-color="#c92a78"/></linearGradient>
<linearGradient id="gPurple" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dcc4ff"/><stop offset=".5" stop-color="#9b6bff"/><stop offset="1" stop-color="#5b34c7"/></linearGradient>
<linearGradient id="gRed" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffa3ab"/><stop offset=".5" stop-color="#ff4d6d"/><stop offset="1" stop-color="#b3122f"/></linearGradient>
<linearGradient id="gBlue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c2e6ff"/><stop offset=".5" stop-color="#4aa3ff"/><stop offset="1" stop-color="#1d5fc4"/></linearGradient>
<linearGradient id="gCyan" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8fffb"/><stop offset=".5" stop-color="#4de3d6"/><stop offset="1" stop-color="#128c92"/></linearGradient>
<linearGradient id="gGreen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c4f7d6"/><stop offset=".5" stop-color="#4ade80"/><stop offset="1" stop-color="#1b9a52"/></linearGradient>
<linearGradient id="gSteel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#bcc2d9"/><stop offset="1" stop-color="#6b7190"/></linearGradient>
<linearGradient id="gDark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6c6990"/><stop offset=".5" stop-color="#2b2840"/><stop offset="1" stop-color="#110f1c"/></linearGradient>
<linearGradient id="gWood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eebb82"/><stop offset=".5" stop-color="#b5763a"/><stop offset="1" stop-color="#6b3d1c"/></linearGradient>
<linearGradient id="gPaper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#f3ecd9"/><stop offset="1" stop-color="#cdbf9f"/></linearGradient>
<linearGradient id="gOrange" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd29a"/><stop offset=".5" stop-color="#ff8a3d"/><stop offset="1" stop-color="#d9480f"/></linearGradient>
<linearGradient id="gBrick" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffa485"/><stop offset=".5" stop-color="#d9553a"/><stop offset="1" stop-color="#8f2a18"/></linearGradient>
<linearGradient id="gSkin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe7d2"/><stop offset=".6" stop-color="#f3c6a2"/><stop offset="1" stop-color="#d99a74"/></linearGradient>
<linearGradient id="gGrass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a6ef6a"/><stop offset="1" stop-color="#3f9d2c"/></linearGradient>
<linearGradient id="gDirt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b98353"/><stop offset="1" stop-color="#6d4526"/></linearGradient>
<linearGradient id="gDirtD" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8f5f38"/><stop offset="1" stop-color="#4a2d17"/></linearGradient>
`;

const pencil = (t = '') => `
<g ${t}>
  <path d="M2 32L13 24V40Z" fill="url(#gWood)" ${O}/>
  <path d="M2 32L6 29V35Z" fill="#2b2840"/>
  <rect x="13" y="24" width="33" height="16" fill="url(#gGold)" ${O}/>
  <path d="M13 28H46M13 36H46" stroke="#b36b00" stroke-opacity=".45" stroke-width="1.5"/>
  <rect x="15" y="25.5" width="30" height="3" fill="#fff" fill-opacity=".5"/>
  <rect x="46" y="24" width="6" height="16" fill="url(#gSteel)" ${O}/>
  <rect x="52" y="24" width="10" height="16" rx="4" fill="url(#gPink)" ${O}/>
</g>`;

const dumbbellG = (t = '') => `
<g ${t}>
  <rect x="14" y="27" width="36" height="10" rx="4" fill="url(#gSteel)" ${O}/>
  <path d="M14 30H50" stroke="#6b7190" stroke-opacity=".55" stroke-width="1.5"/>
  <rect x="4" y="12" width="9" height="40" rx="3.5" fill="url(#gDark)" ${O}/>
  <rect x="11" y="18" width="7" height="28" rx="3" fill="url(#gRed)" ${O}/>
  <rect x="51" y="12" width="9" height="40" rx="3.5" fill="url(#gDark)" ${O}/>
  <rect x="46" y="18" width="7" height="28" rx="3" fill="url(#gRed)" ${O}/>
  <rect x="5.5" y="15" width="2" height="30" rx="1" fill="#fff" fill-opacity=".35"/>
  <rect x="52.5" y="15" width="2" height="30" rx="1" fill="#fff" fill-opacity=".35"/>
</g>`;

const ICONS = {
  /* ---------- niveles ---------- */
  sudoku: `
    <rect x="5" y="5" width="54" height="54" rx="10" fill="url(#gBlue)" ${O}/>
    <rect x="10" y="10" width="44" height="44" rx="5" fill="url(#gPaper)" stroke="#1d0f2e" stroke-opacity=".4" stroke-width="1.5"/>
    <path d="M24.7 10V54M39.3 10V54M10 24.7H54M10 39.3H54" stroke="#1d0f2e" stroke-opacity=".5" stroke-width="2"/>
    <path d="M17.3 10V54M32 10V54M46.7 10V54M10 17.3H54M10 32H54M10 46.7H54" stroke="#1d0f2e" stroke-opacity=".18" stroke-width="1"/>
    <g font-family="Nunito,system-ui,sans-serif" font-weight="900" text-anchor="middle" font-size="11">
      <text x="17.3" y="22" fill="#1d5fc4">5</text><text x="46.7" y="22" fill="#c92a78">3</text>
      <text x="32" y="36.5" fill="#1b9a52">7</text><text x="17.3" y="51" fill="#c92a78">9</text><text x="46.7" y="51" fill="#1d5fc4">2</text>
    </g>
    <path d="M12 8C22 6 36 6 50 8" stroke="#fff" stroke-opacity=".55" stroke-width="2.5" stroke-linecap="round" fill="none"/>`,

  crossword: `
    <rect x="3" y="7" width="48" height="48" rx="8" fill="url(#gPaper)" ${O}/>
    <path d="M15 7V55M27 7V55M39 7V55M3 19H51M3 31H51M3 43H51" stroke="#1d0f2e" stroke-opacity=".4" stroke-width="1.5"/>
    <rect x="3" y="7" width="12" height="12" rx="6" fill="#1d0f2e" fill-opacity=".85"/>
    <rect x="27" y="19" width="12" height="12" fill="#1d0f2e" fill-opacity=".85"/><rect x="39" y="43" width="12" height="12" rx="6" fill="#1d0f2e" fill-opacity=".85"/>
    <g font-family="Nunito,system-ui,sans-serif" font-weight="900" text-anchor="middle" font-size="10" fill="#c92a78">
      <text x="21" y="16">L</text><text x="33" y="16">U</text><text x="45" y="16">A</text><text x="21" y="28">A</text><text x="21" y="40">U</text>
    </g>
    ${pencil('transform="translate(30 30) scale(.58) rotate(-45 32 32) translate(0 -2)"')}`,

  pool: `
    <circle cx="32" cy="32" r="28" fill="url(#gDark)" ${O}/>
    <circle cx="32" cy="29" r="13" fill="#fff" stroke="#1d0f2e" stroke-opacity=".3" stroke-width="1.5"/>
    <text x="32" y="35.5" font-family="Nunito,system-ui,sans-serif" font-weight="900" font-size="19" text-anchor="middle" fill="#1d0f2e">8</text>
    <ellipse cx="21" cy="16" rx="10" ry="6" fill="#fff" fill-opacity=".5" transform="rotate(-38 21 16)"/>
    <path d="M9 40C12 53 23 60 34 60C47 60 57 51 59 38" stroke="#000" stroke-opacity=".28" stroke-width="6" fill="none" stroke-linecap="round"/>`,

  craft: `
    <path d="M32 4L59 18.5L32 33L5 18.5Z" fill="url(#gGrass)" ${O}/>
    <path d="M5 18.5L32 33V61L5 46Z" fill="url(#gDirt)" ${O}/>
    <path d="M59 18.5L32 33V61L59 46Z" fill="url(#gDirtD)" ${O}/>
    <path d="M5 18.5L32 33V40L27 37L23 42L19 36L14 39L10 33L5 31Z" fill="#46b932"/>
    <path d="M59 18.5L32 33V40L37 37L42 43L46 36L51 40L55 34L59 31Z" fill="#2f8f25"/>
    <g fill="#2f8f25" fill-opacity=".55"><rect x="24" y="12" width="5" height="4" transform="skewY(27) translate(0 -14)"/><rect x="35" y="14" width="5" height="4" transform="skewY(27) translate(0 -14)"/></g>
    <g fill="#4a2d17" fill-opacity=".5"><rect x="9" y="42" width="4" height="4"/><rect x="18" y="50" width="4" height="4"/><rect x="24" y="44" width="3" height="3"/></g>
    <g fill="#2f1b0d" fill-opacity=".45"><rect x="38" y="48" width="4" height="4"/><rect x="48" y="43" width="4" height="4"/><rect x="43" y="55" width="3" height="3"/></g>
    <path d="M8 19.5L31 32" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>`,

  gym: dumbbellG('transform="rotate(-30 32 32)"'),

  /* ---------- ejercicios ---------- */
  barbell: `
    <rect x="2" y="29" width="60" height="6" rx="3" fill="url(#gSteel)" ${O}/>
    <rect x="7" y="9" width="8" height="46" rx="3.5" fill="url(#gDark)" ${O}/><rect x="49" y="9" width="8" height="46" rx="3.5" fill="url(#gDark)" ${O}/>
    <rect x="15" y="15" width="7" height="34" rx="3" fill="url(#gRed)" ${O}/><rect x="42" y="15" width="7" height="34" rx="3" fill="url(#gRed)" ${O}/>
    <rect x="22" y="21" width="5" height="22" rx="2.5" fill="url(#gBlue)" ${O}/><rect x="37" y="21" width="5" height="22" rx="2.5" fill="url(#gBlue)" ${O}/>
    <rect x="8.5" y="12" width="2" height="34" rx="1" fill="#fff" fill-opacity=".35"/><rect x="50.5" y="12" width="2" height="34" rx="1" fill="#fff" fill-opacity=".35"/>`,

  pullbar: `
    <rect x="4" y="6" width="8" height="54" rx="3" fill="url(#gDark)" ${O}/><rect x="52" y="6" width="8" height="54" rx="3" fill="url(#gDark)" ${O}/>
    <rect x="2" y="12" width="60" height="8" rx="4" fill="url(#gSteel)" ${O}/>
    <rect x="6" y="13.5" width="52" height="2.2" rx="1" fill="#fff" fill-opacity=".7"/>
    <g ${O}>
      <path d="M17 18C17 14 20 12 24 12H30C33 12 34 14 34 17V32C34 36 31 38 27 38H22C18 38 17 35 17 32Z" fill="url(#gSkin)"/>
      <path d="M34 18C34 14 37 12 41 12H47C50 12 51 14 51 17V32C51 36 48 38 44 38H39C35 38 34 35 34 32Z" fill="url(#gSkin)" transform="translate(-1 0)"/>
    </g>
    <path d="M20 22H31M20 27H31M37 22H48M37 27H48" stroke="#b9724b" stroke-opacity=".6" stroke-width="1.8" stroke-linecap="round"/>
    <rect x="17" y="30" width="15" height="6" rx="3" fill="url(#gPink)" opacity=".9"/><rect x="34" y="30" width="15" height="6" rx="3" fill="url(#gPink)" opacity=".9"/>`,

  curl: `${dumbbellG('transform="translate(0 6) scale(.82) translate(5.8 4)"')}
    <path d="M10 22C14 8 30 3 44 9" fill="none" stroke="url(#gGold)" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M38 -1L52 10L36 17Z" fill="url(#gGold)" ${O} transform="translate(0 1)"/>`,

  /* ---------- corazones y trofeos ---------- */
  heart: `
    <path d="M32 58C10 42 4 30 4 20C4 11 11 5 19 5C25 5 29.500 8 32 13C34.500 8 39 5 45 5C53 5 60 11 60 20C60 30 54 42 32 58Z" fill="url(#gRed)" ${O}/>
    <path d="M13 19C13 14 17 11 21 11" stroke="#fff" stroke-opacity=".8" stroke-width="4.5" stroke-linecap="round" fill="none"/>
    <ellipse cx="47" cy="15" rx="3.2" ry="2" fill="#fff" fill-opacity=".4"/>
    <path d="M16 38C22 47 27 51 32 54" stroke="#7a0b1f" stroke-opacity=".3" stroke-width="3" stroke-linecap="round" fill="none"/>`,

  'heart-violet': `
    <path d="M32 58C10 42 4 30 4 20C4 11 11 5 19 5C25 5 29.500 8 32 13C34.500 8 39 5 45 5C53 5 60 11 60 20C60 30 54 42 32 58Z" fill="url(#gPurple)" ${O}/>
    <path d="M13 19C13 14 17 11 21 11" stroke="#fff" stroke-opacity=".85" stroke-width="4.5" stroke-linecap="round" fill="none"/>
    <ellipse cx="47" cy="15" rx="3.2" ry="2" fill="#fff" fill-opacity=".45"/>
    <path d="M16 38C22 47 27 51 32 54" stroke="#2b1478" stroke-opacity=".35" stroke-width="3" stroke-linecap="round" fill="none"/>`,

  'broken-heart': `
    <path d="M30 58C10 42 4 30 4 20C4 11 11 5 19 5C25 5 29 8 32 13L27 23L36 32L26 41L30 58Z" fill="url(#gRed)" ${O} transform="translate(-2 0)"/>
    <path d="M34 58L28 41L38 32L29 23L34 13C37 8 40 5 46 5C54 5 61 11 61 20C61 30 55 42 34 58Z" fill="url(#gRed)" ${O} transform="translate(3 2) rotate(5 40 30)"/>
    <path d="M12 18C12 13 16 10 20 10" stroke="#fff" stroke-opacity=".7" stroke-width="4" stroke-linecap="round" fill="none"/>`,

  trophy: `
    <path d="M17 16H8C7 29 13 36 22 37" fill="none" stroke="url(#gGold)" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M47 16H56C57 29 51 36 42 37" fill="none" stroke="url(#gGold)" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M16 7H48V26C48 37 41 44 32 44C23 44 16 37 16 26Z" fill="url(#gGold)" ${O}/>
    <rect x="28" y="44" width="8" height="9" fill="url(#gGold)" ${O}/>
    <rect x="17" y="52" width="30" height="9" rx="3" fill="url(#gDark)" ${O}/>
    <rect x="21" y="54.500" width="22" height="3" rx="1.500" fill="#ffd166"/>
    <path d="M32 13L35.200 19.500L42.300 20.500L37.100 25.500L38.400 32.600L32 29.200L25.600 32.600L26.900 25.500L21.700 20.500L28.800 19.500Z" fill="#fff8d6" stroke="#b36b00" stroke-opacity=".5" stroke-width="1.200"/>
    <path d="M21 12V27C21 33 24 38 29 40" stroke="#fff" stroke-opacity=".6" stroke-width="3.500" stroke-linecap="round" fill="none"/>`,

  medal: `
    <path d="M14 2H27L34 27H21Z" fill="url(#gBlue)" ${O}/><path d="M50 2H37L30 27H43Z" fill="url(#gRed)" ${O}/>
    <circle cx="32" cy="42" r="19" fill="url(#gGold)" ${O}/>
    <circle cx="32" cy="42" r="13.500" fill="none" stroke="#b36b00" stroke-opacity=".5" stroke-width="2"/>
    <path d="M32 33L34.600 38.600L40.700 39.300L36.200 43.400L37.500 49.400L32 46.300L26.500 49.400L27.800 43.400L23.300 39.300L29.400 38.600Z" fill="#fff6c0" stroke="#b36b00" stroke-opacity=".5" stroke-width="1"/>
    <path d="M18 36C20 30 25 26 31 25" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round" fill="none"/>`,

  party: `
    <path d="M5 59L17 21L43 47Z" fill="url(#gGold)" ${O}/>
    <path d="M10 45L25 30M14 33L23 24" stroke="url(#gPink)" stroke-width="4.500" stroke-linecap="round"/>
    <path d="M30 56L40 46" stroke="url(#gPurple)" stroke-width="4.500" stroke-linecap="round"/>
    <path d="M27 24C35 8 42 22 52 8" stroke="url(#gPink)" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M38 36C48 28 50 38 60 30" stroke="url(#gBlue)" stroke-width="3" fill="none" stroke-linecap="round"/>
    <rect x="42" y="4" width="5" height="11" rx="1.500" fill="url(#gBlue)" transform="rotate(25 44 9)"/>
    <rect x="56" y="18" width="5" height="10" rx="1.500" fill="url(#gGreen)" transform="rotate(-30 58 23)"/>
    <circle cx="24" cy="10" r="3.500" fill="url(#gPink)"/><circle cx="55" cy="46" r="3" fill="url(#gGold)"/><circle cx="46" cy="22" r="2.500" fill="url(#gPurple)"/>
    <path d="M12 8L14.200 13L19 14L14.200 15.500L12 20L9.800 15.500L5 14L9.800 13Z" fill="#fff" stroke="#ffd166" stroke-width=".8"/>`,

  /* ---------- interfaz ---------- */
  lock: `
    <path d="M20 28V19C20 6 44 6 44 19V28" fill="none" stroke="#1d0f2e" stroke-opacity=".45" stroke-width="10.500" stroke-linecap="round"/>
    <path d="M20 28V19C20 6 44 6 44 19V28" fill="none" stroke="url(#gSteel)" stroke-width="7.500" stroke-linecap="round"/>
    <rect x="11" y="27" width="42" height="32" rx="8" fill="url(#gPurple)" ${O}/>
    <rect x="15" y="30.500" width="34" height="5.500" rx="2.700" fill="#fff" fill-opacity=".38"/>
    <circle cx="32" cy="42" r="5" fill="#1d0f2e"/><rect x="29.800" y="44" width="4.400" height="9.500" rx="2.200" fill="#1d0f2e"/>`,

  check: `
    <circle cx="32" cy="32" r="27" fill="url(#gGreen)" ${O}/>
    <ellipse cx="25" cy="17" rx="14" ry="7" fill="#fff" fill-opacity=".38"/>
    <path d="M18 34L28 44L47 22" fill="none" stroke="#0b5a2c" stroke-opacity=".35" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 2)"/>
    <path d="M18 34L28 44L47 22" fill="none" stroke="#fff" stroke-width="7.500" stroke-linecap="round" stroke-linejoin="round"/>`,

  timer: `
    <rect x="26" y="2" width="12" height="7" rx="2.500" fill="url(#gSteel)" ${O}/>
    <path d="M47 14L53 8" stroke="url(#gSteel)" stroke-width="6" stroke-linecap="round"/>
    <circle cx="32" cy="36" r="25" fill="url(#gSteel)" ${O}/>
    <circle cx="32" cy="36" r="20" fill="url(#gPaper)" stroke="#1d0f2e" stroke-opacity=".4" stroke-width="1.500"/>
    <path d="M32 19.500V23M32 49V52.500M15.500 36H19M45 36H48.500M20.500 24.500L23 27M43.500 47.500L41 45M43.500 24.500L41 27M20.500 47.500L23 45" stroke="#2b2840" stroke-width="2.200" stroke-linecap="round"/>
    <path d="M32 36V25" stroke="#c92a78" stroke-width="3.200" stroke-linecap="round"/>
    <path d="M32 36L40 41" stroke="#1d0f2e" stroke-width="3.200" stroke-linecap="round"/>
    <circle cx="32" cy="36" r="3.400" fill="#c92a78" stroke="#1d0f2e" stroke-opacity=".5" stroke-width="1"/>
    <path d="M17 29C19 23 24 19 30 18" stroke="#fff" stroke-opacity=".75" stroke-width="3.500" stroke-linecap="round" fill="none"/>`,

  alarm: `
    <circle cx="13" cy="15" r="10" fill="url(#gRed)" ${O}/><circle cx="51" cy="15" r="10" fill="url(#gRed)" ${O}/>
    <path d="M15 56L9 62M49 56L55 62" stroke="url(#gSteel)" stroke-width="4.500" stroke-linecap="round"/>
    <circle cx="32" cy="37" r="23" fill="url(#gRed)" ${O}/>
    <circle cx="32" cy="37" r="17.500" fill="url(#gPaper)" stroke="#1d0f2e" stroke-opacity=".4" stroke-width="1.500"/>
    <path d="M32 37V26M32 37L40 42" stroke="#1d0f2e" stroke-width="3.200" stroke-linecap="round"/><circle cx="32" cy="37" r="2.800" fill="#c92a78"/>
    <path d="M32 21.500V24M32 50V52.500M16.500 37H19M45 37H47.500" stroke="#2b2840" stroke-width="2" stroke-linecap="round"/>
    <path d="M18 28C20 22 25 18 31 17" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round" fill="none"/>`,

  target: `
    <circle cx="30" cy="34" r="26" fill="url(#gRed)" ${O}/><circle cx="30" cy="34" r="19.500" fill="#fff"/>
    <circle cx="30" cy="34" r="13.500" fill="url(#gRed)"/><circle cx="30" cy="34" r="7.500" fill="#fff"/><circle cx="30" cy="34" r="3.800" fill="url(#gRed)"/>
    <path d="M31 33L52 12" stroke="#1d0f2e" stroke-opacity=".7" stroke-width="5" stroke-linecap="round"/>
    <path d="M31 33L52 12" stroke="url(#gGold)" stroke-width="3" stroke-linecap="round"/>
    <path d="M50 14L54 4L62 8L58 12L62 18L52 20Z" fill="url(#gPink)" ${O}/>`,

  'speaker-on': `
    <path d="M6 25H17L31 12V52L17 39H6Z" fill="url(#gSteel)" ${O}/><path d="M9 28H18L28 19" stroke="#fff" stroke-opacity=".7" stroke-width="2.500" stroke-linecap="round" fill="none"/>
    <path d="M40 23C45 29 45 35 40 41" stroke="url(#gGold)" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M47 15C57 25 57 39 47 49" stroke="url(#gPink)" stroke-width="5" stroke-linecap="round" fill="none"/>`,

  'speaker-off': `
    <path d="M6 25H17L31 12V52L17 39H6Z" fill="url(#gSteel)" ${O}/><path d="M9 28H18L28 19" stroke="#fff" stroke-opacity=".7" stroke-width="2.500" stroke-linecap="round" fill="none"/>
    <path d="M41 24L58 41M58 24L41 41" stroke="#1d0f2e" stroke-opacity=".4" stroke-width="8" stroke-linecap="round"/>
    <path d="M41 24L58 41M58 24L41 41" stroke="url(#gRed)" stroke-width="5.500" stroke-linecap="round"/>`,

  bulb: `
    <path d="M4 14L10 17M60 14L54 17M2 30H9M55 30H62" stroke="#ffd166" stroke-width="3.500" stroke-linecap="round"/>
    <path d="M32 3C20 3 12 12 12 23C12 31 17 36 20 41V45H44V41C47 36 52 31 52 23C52 12 44 3 32 3Z" fill="url(#gGold)" ${O}/>
    <ellipse cx="23" cy="15" rx="5.500" ry="9" fill="#fff" fill-opacity=".55" transform="rotate(25 23 15)"/>
    <path d="M26 34L28 24L32 30L36 24L38 34" stroke="#b36b00" stroke-width="2.500" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <rect x="20" y="45" width="24" height="5.500" rx="2.500" fill="url(#gSteel)" ${O}/><rect x="22" y="51" width="20" height="5.500" rx="2.500" fill="url(#gSteel)" ${O}/>
    <path d="M27 57H37C37 60.500 35 63 32 63C29 63 27 60.500 27 57Z" fill="url(#gDark)"/>`,

  undo: `
    <path d="M14 29H39C49 29 56 35 56 43C56 51 49 57 39 57H24" fill="none" stroke="#1d0f2e" stroke-opacity=".45" stroke-width="12" stroke-linecap="round"/>
    <path d="M14 29H39C49 29 56 35 56 43C56 51 49 57 39 57H24" fill="none" stroke="url(#gPurple)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M26 10L6 29L26 48Z" fill="url(#gPurple)" ${O}/>
    <path d="M24 16L12 28" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>`,

  eraser: `
    <g transform="rotate(-35 32 32)">
      <rect x="6" y="19" width="52" height="28" rx="6" fill="url(#gPink)" ${O}/>
      <rect x="6" y="19" width="20" height="28" rx="6" fill="url(#gBlue)" ${O}/>
      <rect x="26" y="19" width="3" height="28" fill="#1d0f2e" fill-opacity=".3"/>
      <rect x="9" y="22" width="46" height="4.500" rx="2.200" fill="#fff" fill-opacity=".42"/>
    </g>
    <path d="M12 60H52" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>`,

  pencil: pencil('transform="rotate(-45 32 32) translate(0 0)"'),

  'pencil-notes': `${pencil('transform="translate(3 3) rotate(-45 32 32) scale(.92)"')}
    <path d="M44 7L46.200 12L51 13L46.200 14.500L44 19.500L41.800 14.500L37 13L41.800 12Z" fill="#fff" stroke="#ffd166" stroke-width=".8"/>`,

  clipboard: `
    <rect x="9" y="8" width="46" height="54" rx="7" fill="url(#gWood)" ${O}/>
    <rect x="14" y="14" width="36" height="43" rx="3.500" fill="url(#gPaper)" ${O}/>
    <path d="M20 26H44M20 34H44M20 42H34" stroke="#8d7fb3" stroke-width="3" stroke-linecap="round"/>
    <path d="M18 22.500L20 24.500L24 20.500" stroke="#1b9a52" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0"/>
    <rect x="21" y="2" width="22" height="13" rx="5" fill="url(#gSteel)" ${O}/><circle cx="32" cy="8.500" r="2.500" fill="#1d0f2e" fill-opacity=".55"/>`,

  eye: `
    <path d="M2 32C11 16 22 10 32 10C42 10 53 16 62 32C53 48 42 54 32 54C22 54 11 48 2 32Z" fill="url(#gPaper)" ${O}/>
    <circle cx="32" cy="32" r="15" fill="url(#gBlue)" ${O}/><circle cx="32" cy="32" r="7.500" fill="#1d0f2e"/>
    <circle cx="26.500" cy="26" r="4.500" fill="#fff"/><circle cx="37" cy="38" r="2.200" fill="#fff" fill-opacity=".75"/>
    <path d="M8 29C16 18 24 14.500 32 14.500" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round" fill="none"/>`,

  flag: `
    <rect x="8" y="5" width="6" height="57" rx="3" fill="url(#gSteel)" ${O}/><circle cx="11" cy="5" r="4" fill="url(#gGold)" ${O}/>
    <clipPath id="clipFlag"><path d="M14 10C24 4 32 14 43 9C49 6.500 54 6.500 58 9V36C54 33.500 49 33.500 43 36C32 41 24 31 14 37Z"/></clipPath>
    <path d="M14 10C24 4 32 14 43 9C49 6.500 54 6.500 58 9V36C54 33.500 49 33.500 43 36C32 41 24 31 14 37Z" fill="#fff"/>
    <g clip-path="url(#clipFlag)" fill="#1d0f2e">
      <rect x="14" y="4" width="11" height="11"/><rect x="36" y="4" width="11" height="11"/><rect x="25" y="15" width="11" height="11"/><rect x="47" y="15" width="11" height="11"/>
      <rect x="14" y="26" width="11" height="11"/><rect x="36" y="26" width="11" height="11"/>
    </g>
    <path d="M14 10C24 4 32 14 43 9C49 6.500 54 6.500 58 9V36C54 33.500 49 33.500 43 36C32 41 24 31 14 37Z" fill="none" ${O}/>`,

  sword: `
    <g transform="translate(32 32) rotate(45) scale(.8) translate(-32 -32)">
      <path d="M32 0L40 10V42H24V10Z" fill="url(#gCyan)" ${O}/>
      <path d="M32 3V42" stroke="#fff" stroke-opacity=".7" stroke-width="2.500"/>
      <path d="M32 4L37 10V40H32Z" fill="#128c92" fill-opacity=".35"/>
      <rect x="14" y="42" width="36" height="8" rx="3" fill="url(#gWood)" ${O}/>
      <rect x="28" y="50" width="8" height="11" rx="2" fill="url(#gDirtD)" ${O}/>
      <circle cx="32" cy="63" r="4.500" fill="url(#gGold)" ${O}/>
      <path d="M14 44H50" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
    </g>`,

  sun: `
    <path d="M32 3V11M32 53V61M3 32H11M53 32H61M11.500 11.500L17 17M47 47L52.500 52.500M52.500 11.500L47 17M17 47L11.500 52.500" stroke="url(#gGold)" stroke-width="5.500" stroke-linecap="round"/>
    <circle cx="32" cy="32" r="16.500" fill="url(#gGold)" ${O}/>
    <ellipse cx="26" cy="25" rx="7" ry="4.500" fill="#fff" fill-opacity=".55" transform="rotate(-30 26 25)"/>`,

  moon: `
    <path d="M42 4A28 28 0 1 0 60 44A23 23 0 0 1 42 4Z" fill="url(#gGold)" ${O}/>
    <path d="M14 22C16 14 22 9 29 7" stroke="#fff" stroke-opacity=".65" stroke-width="3.500" stroke-linecap="round" fill="none"/>
    <circle cx="20" cy="40" r="3.500" fill="#b36b00" fill-opacity=".3"/><circle cx="30" cy="50" r="2.500" fill="#b36b00" fill-opacity=".3"/>
    <path d="M52 8L54 13L59 14L54 15.500L52 21L50 15.500L45 14L50 13Z" fill="#fff" stroke="#ffd166" stroke-width=".8"/>`,

  sunrise: `
    <path d="M32 4V13M9 15L15 21M55 15L49 21M2 38H10M54 38H62" stroke="url(#gGold)" stroke-width="4.500" stroke-linecap="round"/>
    <path d="M14 42A18 18 0 0 1 50 42Z" fill="url(#gGold)" ${O}/>
    <rect x="0" y="42" width="64" height="20" fill="url(#gBlue)"/><path d="M0 42H64" stroke="#1d0f2e" stroke-opacity=".5" stroke-width="2"/>
    <path d="M18 49H46M24 55H40" stroke="#fff" stroke-opacity=".6" stroke-width="2.500" stroke-linecap="round"/>`,

  flame: `
    <path d="M32 2C35 14 48 20 48 37C48 51 40 62 32 62C22 62 15 52 15 41C15 31 21 26 24 19C26 26 29 29 31 30C30 21 28 11 32 2Z" fill="url(#gOrange)" ${O}/>
    <path d="M32 27C35 33 41 37 41 45C41 54 37 60 32 60C26 60 22 54 22 48C22 42 27 39 28.500 33C30 36 31 37 32 37C32 33 31 30 32 27Z" fill="url(#gGold)"/>
    <path d="M32 44C34.500 47 36.500 49.500 36.500 53C36.500 56.500 34.500 59 32 59C29.500 59 27.500 56.500 27.500 53C27.500 49.500 31 48.500 32 44Z" fill="#fff6c8"/>`,

  bolt: `
    <path d="M37 2L12 36H27L22 62L52 24H35Z" fill="url(#gGold)" ${O}/>
    <path d="M36 8L20 32" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>`,

  sparkle: `
    <path d="M30 2C32 18 38 26 58 31C38 36 32 44 30 60C28 44 22 36 2 31C22 26 28 18 30 2Z" fill="url(#gGold)" ${O}/>
    <path d="M51 5C51.800 11 53 12.500 59 14C53 15.500 51.800 17 51 23C50.200 17 49 15.500 43 14C49 12.500 50.200 11 51 5Z" fill="#fff" stroke="#ffd166" stroke-width=".8"/>
    <path d="M22 10C23 17 27 21 33 23" stroke="#fff" stroke-opacity=".6" stroke-width="2.500" stroke-linecap="round" fill="none"/>`,

  retry: `
    <path d="M52 33C52 44 43 53 32 53C21 53 12 44 12 33C12 22 21 13 32 13C38 13 43 15.500 47 19.500" fill="none" stroke="#1d0f2e" stroke-opacity=".45" stroke-width="12.500" stroke-linecap="round"/>
    <path d="M52 33C52 44 43 53 32 53C21 53 12 44 12 33C12 22 21 13 32 13C38 13 43 15.500 47 19.500" fill="none" stroke="url(#gBlue)" stroke-width="9" stroke-linecap="round"/>
    <path d="M57 4V26H35Z" fill="url(#gBlue)" ${O}/>`,

  door: `
    <rect x="11" y="3" width="42" height="58" rx="4" fill="url(#gWood)" ${O}/>
    <rect x="16" y="8" width="32" height="48" rx="2" fill="#6b3d1c" fill-opacity=".55"/>
    <rect x="19" y="12" width="12" height="18" rx="1.500" fill="url(#gWood)" stroke="#1d0f2e" stroke-opacity=".35"/><rect x="33" y="12" width="12" height="18" rx="1.500" fill="url(#gWood)" stroke="#1d0f2e" stroke-opacity=".35"/>
    <rect x="19" y="33" width="12" height="19" rx="1.500" fill="url(#gWood)" stroke="#1d0f2e" stroke-opacity=".35"/><rect x="33" y="33" width="12" height="19" rx="1.500" fill="url(#gWood)" stroke="#1d0f2e" stroke-opacity=".35"/>
    <circle cx="42" cy="33" r="3.400" fill="url(#gGold)" ${O}/>`,

  broom: `
    <g transform="rotate(35 32 32)">
      <rect x="29" y="1" width="6" height="34" rx="3" fill="url(#gWood)" ${O}/>
      <rect x="23" y="32" width="18" height="6" rx="2.500" fill="url(#gRed)" ${O}/>
      <path d="M21 38H43L48 62H16Z" fill="url(#gGold)" ${O}/>
      <path d="M26 40L24 61M32 40V61M38 40L40 61" stroke="#b36b00" stroke-opacity=".6" stroke-width="2"/>
    </g>`,

  question: `
    <circle cx="32" cy="32" r="28" fill="url(#gPurple)" ${O}/>
    <ellipse cx="24" cy="15" rx="14" ry="7" fill="#fff" fill-opacity=".35" transform="rotate(-12 24 15)"/>
    <path d="M22 24C22 17 27 13.500 33 13.500C39.500 13.500 44 17.500 44 23.500C44 32 33 32 33 40" fill="none" stroke="#2b1478" stroke-opacity=".35" stroke-width="8" stroke-linecap="round" transform="translate(0 2)"/>
    <path d="M22 24C22 17 27 13.500 33 13.500C39.500 13.500 44 17.500 44 23.500C44 32 33 32 33 40" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
    <circle cx="33" cy="50" r="4.600" fill="#fff"/>`,

  bricks: `
    <g ${O} stroke-width="1.800">
      <rect x="3" y="6" width="27" height="14" rx="2.500" fill="url(#gBrick)"/><rect x="33" y="6" width="28" height="14" rx="2.500" fill="url(#gBrick)"/>
      <rect x="3" y="23" width="14" height="14" rx="2.500" fill="url(#gBrick)"/><rect x="20" y="23" width="26" height="14" rx="2.500" fill="url(#gBrick)"/><rect x="49" y="23" width="12" height="14" rx="2.500" fill="url(#gBrick)"/>
      <rect x="3" y="40" width="27" height="14" rx="2.500" fill="url(#gBrick)"/><rect x="33" y="40" width="28" height="14" rx="2.500" fill="url(#gBrick)"/>
    </g>
    <g stroke="#fff" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"><path d="M6 9H26M36 9H57M6 26H14M23 26H42M6 43H26M36 43H57"/></g>
    <rect x="6" y="56" width="52" height="5" rx="2" fill="url(#gSteel)" ${O}/>`,

  skull: `
    <path d="M32 3C16 3 7 13 7 27C7 35 11 40 16 43V52H48V43C53 40 57 35 57 27C57 13 48 3 32 3Z" fill="url(#gPaper)" ${O}/>
    <ellipse cx="21" cy="28" rx="7" ry="8" fill="#1d0f2e"/><ellipse cx="43" cy="28" rx="7" ry="8" fill="#1d0f2e"/>
    <circle cx="23" cy="30" r="2" fill="#ff4d6d"/><circle cx="41" cy="30" r="2" fill="#ff4d6d"/>
    <path d="M32 34L27.500 43H36.500Z" fill="#1d0f2e"/>
    <rect x="17" y="52" width="30" height="9" rx="3" fill="url(#gPaper)" ${O}/>
    <path d="M24.500 52V61M32 52V61M39.500 52V61" stroke="#1d0f2e" stroke-opacity=".55" stroke-width="2"/>
    <path d="M14 18C17 11 23 7 30 6" stroke="#fff" stroke-opacity=".8" stroke-width="3.500" stroke-linecap="round" fill="none"/>`,

  quiz: `
    <path d="M11 3H43L56 16V61H11Z" fill="url(#gPaper)" ${O}/>
    <path d="M43 3V16H56Z" fill="#cdbf9f" ${O}/>
    <path d="M11 3H43V15H11Z" fill="url(#gRed)" ${O}/>
    <g font-family="Nunito,system-ui,sans-serif" font-weight="900" font-size="10" fill="#fff6ef" text-anchor="middle"><text x="27" y="12.500">QUIZ</text></g>
    <ellipse cx="23" cy="31" rx="6" ry="6.500" fill="#fff" stroke="#1d0f2e" stroke-opacity=".6" stroke-width="1.500"/><ellipse cx="44" cy="31" rx="6" ry="6.500" fill="#fff" stroke="#1d0f2e" stroke-opacity=".6" stroke-width="1.500"/>
    <circle cx="25" cy="32.500" r="3" fill="#d1342f"/><circle cx="42" cy="32.500" r="3" fill="#d1342f"/><circle cx="25.500" cy="33" r="1.200" fill="#1d0f2e"/><circle cx="41.500" cy="33" r="1.200" fill="#1d0f2e"/>
    <path d="M14 22L29 28M54 22L38 28" stroke="#1d0f2e" stroke-width="3.500" stroke-linecap="round"/>
    <path d="M17 44H50L46 55H21Z" fill="#1d0f2e"/>
    <path d="M21 44V48L24 44M27 44V49L30 44M33 44V49L36 44M39 44V49L42 44M45 44V48L48 44" fill="#fff" stroke="#fff" stroke-width="1" stroke-linejoin="round"/>
    <path d="M15 58H33" stroke="#d1342f" stroke-width="2.500" stroke-linecap="round"/>`,

  /* ---------- flechas y controles (usan el color del texto) ---------- */
  'chev-r': `<path d="M22 8L46 32L22 56" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
  'chev-l': `<path d="M42 8L18 32L42 56" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
  'arrow-up': `<path d="M32 56V10M11 30L32 9L53 30" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
  'arrow-down': `<path d="M32 8V54M11 34L32 55L53 34" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
  skip: `<path d="M9 10L29 32L9 54M33 10L53 32L33 54" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`,
  close: `<path d="M13 13L51 51M51 13L13 51" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round"/>`,
  'check-mark': `<path d="M10 34L26 50L55 15" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
  backspace: `
    <path d="M20 10H54C58 10 60 12 60 16V48C60 52 58 54 54 54H20L4 32Z" fill="url(#gSteel)" ${O}/>
    <path d="M28 22L46 42M46 22L28 42" stroke="#c92a78" stroke-width="6" stroke-linecap="round"/>`,
  play: `<path d="M16 8L56 32L16 56Z" fill="currentColor" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>`,
};

// Glifos de interfaz (24x24): trazo grueso en currentColor con relleno tenue. Se usan en botones, fichas y estados.
const S = 'stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';
const F = 'fill="currentColor" fill-opacity=".22"';
const GLYPHS = {
  timer: `<circle cx="12" cy="13.6" r="8" ${F} ${S}/><path d="M12 8.6V13.6L15.4 15.6" fill="none" ${S}/><path d="M9.4 2.9H14.6M18.6 5.4L20 4" fill="none" ${S}/>`,
  target: `<circle cx="12" cy="12" r="8.6" fill="none" ${S}/><circle cx="12" cy="12" r="4.4" ${F} ${S}/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><path d="M12 1.6V4.4M12 19.6V22.4M1.6 12H4.4M19.6 12H22.4" fill="none" ${S}/>`,
  lock: `<rect x="4.8" y="10.8" width="14.4" height="10.4" rx="2.8" ${F} ${S}/><path d="M8 10.8V8.2a4 4 0 0 1 8 0v2.6" fill="none" ${S}/><circle cx="12" cy="16" r="1.5" fill="currentColor"/>`,
  check: `<path d="M4.6 12.8L9.6 17.8L19.6 6.4" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  trophy: `<path d="M7.2 3.4H16.8V9.4a4.8 4.8 0 0 1-9.6 0Z" ${F} ${S}/><path d="M7.2 5.4H4.2C4.2 8.6 5.6 10.2 7.6 10.6M16.8 5.4H19.8C19.8 8.6 18.4 10.2 16.4 10.6" fill="none" ${S}/><path d="M12 14.4V18.2M8 20.6H16" fill="none" ${S}/>`,
  star: `<path d="M12 2.6L14.9 8.6L21.4 9.4L16.6 13.9L17.9 20.4L12 17.2L6.1 20.4L7.4 13.9L2.6 9.4L9.1 8.6Z" ${F} ${S}/>`,
  medal: `<circle cx="12" cy="14.4" r="6.2" ${F} ${S}/><path d="M8 2.8L10.6 8.6M16 2.8L13.4 8.6" fill="none" ${S}/><path d="M12 11.6L12.9 13.4L14.8 13.6L13.4 14.9L13.8 16.8L12 15.9L10.2 16.8L10.6 14.9L9.2 13.6L11.1 13.4Z" fill="currentColor"/>`,
  retry: `<path d="M20.2 12A8.2 8.2 0 1 1 17.8 6.2" fill="none" ${S}/><path d="M20.6 2.8V8.4H15" fill="none" ${S}/>`,
  bolt: `<path d="M13.4 2.4L5 13.4H11.2L10.2 21.6L19 10.2H12.6Z" ${F} ${S}/>`,
  flag: `<path d="M5.6 21.4V3.2" fill="none" ${S}/><path d="M5.6 4.4C9 2.2 11.6 6.6 15 4.8C16.6 4 17.8 4 19 4.4V13C17.8 12.6 16.6 12.6 15 13.4C11.6 15.2 9 10.8 5.6 13Z" ${F} ${S}/>`,
  play: `<path d="M7 3.8L19.6 12L7 20.2Z" ${F} ${S}/>`,
  close: `<path d="M5.4 5.4L18.6 18.6M18.6 5.4L5.4 18.6" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>`,
};

export const ICON_NAMES = Object.keys(ICONS);
export const GLYPH_NAMES = Object.keys(GLYPHS);

let mounted = false;
export function mountIcons() {
  if (mounted || typeof document === 'undefined') return;
  mounted = true;
  const symbols =
    Object.entries(ICONS)
      .map(([name, body]) => `<symbol id="ic-${name}" viewBox="0 0 64 64">${body}</symbol>`)
      .join('') +
    Object.entries(GLYPHS)
      .map(([name, body]) => `<symbol id="gl-${name}" viewBox="0 0 24 24">${body}</symbol>`)
      .join('');
  const wrap = document.createElement('div');
  wrap.setAttribute('aria-hidden', 'true');
  wrap.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  wrap.innerHTML = `<svg ${G} width="0" height="0"><defs>${DEFS}</defs>${symbols}</svg>`;
  document.body.prepend(wrap);
}

// Devuelve el SVG listo para meter en HTML. Hereda el tamaño del texto (1em).
export function icon(name, cls = '') {
  if (!ICONS[name]) console.warn('icono desconocido:', name);
  return `<svg class="ic ic-${name} ${cls}" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><use href="#ic-${name}"/></svg>`;
}

// Glifo de interfaz (monocromo, hereda el color del texto).
export function glyph(name, cls = '') {
  if (!GLYPHS[name]) console.warn('glifo desconocido:', name);
  return `<svg class="gl gl-${name} ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#gl-${name}"/></svg>`;
}
