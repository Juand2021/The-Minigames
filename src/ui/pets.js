// Las mascotas de Laura en pixel-art: Molly (perrita blanca de orejas rosadas y ojeras café) y el Gato Pirata
// (negro y blanco, sin un ojo: parche, gorro de pirata y arete dorado).
// Cuerpos de lado (24x20, miran a la derecha) y retratos de frente (38x40) para los diálogos.

const OUT = [24, 15, 30];

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return [c, g];
}
const px = (g, x, y, w, h, c) => {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), w, h);
};
function ell(g, cx, cy, rx, ry, color) {
  g.fillStyle = color;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
      if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) g.fillRect(x, y, 1, 1);
}
function line(g, x0, y0, x1, y1, color, t = 1) {
  g.fillStyle = color;
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), t, t);
}
// contorno oscuro de 1 px alrededor de lo dibujado
function outline(c, rgb = OUT) {
  const g = c.getContext('2d');
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const solid = (x, y) => x >= 0 && y >= 0 && x < c.width && y < c.height && d[(y * c.width + x) * 4 + 3] > 0;
  const add = [];
  for (let y = 0; y < c.height; y++)
    for (let x = 0; x < c.width; x++)
      if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) add.push([x, y]);
  for (const [x, y] of add) d.set([...rgb, 255], (y * c.width + x) * 4);
  g.putImageData(img, 0, 0);
  return c;
}
const make = (w, h, fn) => {
  const [c, g] = canvas(w, h);
  fn(g);
  return outline(c);
};

/* ====================== MOLLY ====================== */
const M = {
  fur: '#fbf8f2',
  furSh: '#e4dccf',
  cream: '#f3dfbd',
  tan: '#c58a4a',
  tanDk: '#9a6431',
  pink: '#f59ab8',
  pinkLt: '#ffc6d8',
  pinkDk: '#d76890',
  nose: '#3b2f34',
  eye: '#1a1210',
  red: '#d93a3a',
  redDk: '#a22424',
  gold: '#f2c14e',
  blue: '#4aa3ff',
};

// Cuerpo de lado. frame: 0 parada · 1/2 caminando · 'sit' sentada
function mollyBody(g, frame = 0) {
  const sit = frame === 'sit';
  const f = sit ? 0 : frame;
  const wag = sit || f === 0 ? 0 : f;

  // cola peluda (sube y se mueve)
  const tx = 1 + (wag === 1 ? 0 : wag === 2 ? 1 : 0);
  ell(g, tx + 1.5, sit ? 12 : 8.5, 2, 3.5, M.fur);
  px(g, tx, sit ? 9 : 5, 2, 2, M.fur);
  px(g, tx + 1, sit ? 8 : 4, 2, 1, M.furSh);

  if (sit) {
    ell(g, 9.5, 13.5, 6.5, 5.5, M.fur); // cuerpo sentado
    ell(g, 8, 16, 4, 2.5, M.furSh);
    px(g, 12, 15, 3, 4, M.fur);
    px(g, 12, 18, 3, 1, M.furSh); // patita delantera
    px(g, 5, 17, 5, 2, M.fur);
  } else {
    ell(g, 10, 12, 8.5, 4.8, M.fur); // cuerpo
    ell(g, 9, 14.5, 7, 2.5, M.furSh); // sombra de la panza
    // flequitos de pelo
    px(g, 4, 15, 1, 1, M.fur);
    px(g, 8, 16, 1, 1, M.fur);
    px(g, 13, 16, 1, 1, M.fur);
    // patas
    const a = f === 1 ? 1 : 0;
    const b = f === 2 ? 1 : 0;
    px(g, 4, 15, 3, 4 - a, M.fur);
    px(g, 8, 16, 3, 3 - b, M.furSh);
    px(g, 12, 16, 3, 3 - a, M.fur);
    px(g, 15, 15, 3, 4 - b, M.fur);
    px(g, 4, 18 - a, 3, 1, M.furSh);
    px(g, 15, 18 - b, 3, 1, M.furSh);
  }

  // arnés rojo con cinta de colores
  px(g, 14, sit ? 10 : 8, 2, sit ? 8 : 7, M.red);
  px(g, 15, sit ? 10 : 8, 1, sit ? 8 : 7, M.redDk);
  px(g, 13, sit ? 13 : 11, 5, 1, M.gold);
  px(g, 13, sit ? 14 : 12, 5, 1, M.blue);

  // cabeza
  const hx = 18;
  const hy = sit ? 6.5 : 7.5;
  ell(g, hx, hy, 5.2, 4.8, M.fur);
  px(g, hx - 3, hy - 5, 2, 1, M.fur); // mechones arriba
  px(g, hx, hy - 6, 2, 1, M.fur);
  px(g, hx + 2, hy - 5, 1, 1, M.fur);
  // hocico claro y nariz
  ell(g, hx + 4, hy + 2, 2.8, 2.4, M.fur);
  px(g, hx + 6, hy + 0.5, 2, 2, M.nose);
  px(g, hx + 6, hy + 0.5, 1, 1, '#7a6a72');
  px(g, hx + 4, hy + 3.5, 3, 1, M.pinkDk); // boquita
  // ojera café y ojo
  ell(g, hx + 1, hy - 0.8, 2.8, 2.4, M.tan);
  px(g, hx - 1, hy - 3, 3, 1, M.cream);
  px(g, hx + 0, hy - 1.5, 2, 2, M.eye);
  px(g, hx + 0, hy - 1.5, 1, 1, '#ffffff');
  // oreja larga caída, rosada en la punta
  px(g, hx - 4, hy - 3, 3, 3, M.cream);
  px(g, hx - 5, hy - 1, 4, 6, M.pink);
  px(g, hx - 5, hy + 4, 3, 2, M.pinkDk);
  px(g, hx - 5, hy - 1, 1, 4, M.pinkLt);
}

/* ====================== GATO PIRATA ====================== */
const P = {
  black: '#1f1b27',
  blackHi: '#3a3446',
  white: '#fbf8f2',
  whiteSh: '#dcd6e0',
  pink: '#f59ab8',
  eyeAmber: '#f2b630',
  gold: '#f2c14e',
  goldDk: '#b8862a',
  hat: '#15121c',
  hatHi: '#2c2738',
};

function pirataBody(g, frame = 0) {
  const sit = frame === 'sit';
  const f = sit ? 0 : frame;

  // cola larga con punta blanca
  const w = sit ? 0 : f === 1 ? 0 : f === 2 ? 1 : 0;
  line(g, 2 + w, sit ? 15 : 11, 0 + w, sit ? 9 : 5, P.black, 2);
  px(g, w, sit ? 8 : 4, 2, 2, P.white);

  if (sit) {
    ell(g, 9, 13.5, 6, 5.5, P.black);
    ell(g, 11.5, 15, 3, 3.5, P.white); // pecho
    px(g, 11, 17, 4, 2, P.white);
    px(g, 5, 17, 4, 2, P.black);
    px(g, 5, 18, 4, 1, P.white);
  } else {
    ell(g, 10, 12, 8, 4.4, P.black);
    ell(g, 12, 14, 5.5, 2.2, P.white); // panza blanca
    const a = f === 1 ? 1 : 0;
    const b = f === 2 ? 1 : 0;
    px(g, 4, 14, 2, 5 - a, P.black);
    px(g, 8, 15, 2, 4 - b, P.black);
    px(g, 12, 15, 2, 4 - a, P.white);
    px(g, 15, 14, 2, 5 - b, P.white);
    px(g, 4, 18 - a, 3, 1, P.white); // calcetines blancos
    px(g, 8, 18 - b, 3, 1, P.white);
    px(g, 12, 18 - a, 3, 1, P.white);
    px(g, 15, 18 - b, 3, 1, P.white);
  }
  px(g, 6, 8, 4, 1, P.blackHi); // brillo del lomo

  // cabeza
  const hx = 17.5;
  const hy = sit ? 8 : 8.5;
  ell(g, hx, hy, 4.8, 4.2, P.black);
  ell(g, hx + 2.8, hy + 1.8, 2.8, 2.3, P.white); // hocico blanco
  px(g, hx + 4, hy + 0.5, 2, 1, P.pink); // nariz
  px(g, hx + 3, hy + 3, 3, 1, P.whiteSh);
  // bigotes
  px(g, hx + 5, hy + 2, 4, 1, '#ffffff');
  px(g, hx + 5, hy + 3, 3, 1, '#ffffff');
  // parche en el ojo (se ve la cinta)
  ell(g, hx + 0.5, hy - 0.2, 2.4, 2.2, '#0b0910');
  px(g, hx - 1, hy - 1.5, 1, 1, '#3a3446');
  line(g, hx - 3, hy - 2, hx + 3, hy - 3, '#0b0910');
  line(g, hx - 4, hy, hx - 2, hy + 1, '#0b0910');
  // oreja rosada asomando bajo el gorro
  px(g, hx - 4, hy - 4, 2, 2, P.black);
  px(g, hx - 3, hy - 3, 1, 1, P.pink);
  // gorro pirata (tricornio)
  const hatY = hy - 6.5;
  px(g, hx - 6, hatY + 3, 13, 2, P.hat); // ala
  px(g, hx - 5, hatY + 1, 11, 3, P.hat);
  px(g, hx - 3, hatY - 1, 7, 3, P.hat);
  px(g, hx - 6, hatY + 3, 13, 1, P.gold); // ribete dorado
  px(g, hx - 7, hatY + 2, 2, 1, P.hat);
  px(g, hx + 5, hatY + 2, 2, 1, P.hat);
  px(g, hx - 3, hatY - 1, 7, 1, P.hatHi);
  // calavera
  px(g, hx - 1, hatY + 0.5, 3, 2, '#ffffff');
  px(g, hx - 1, hatY + 1, 1, 1, P.hat);
  px(g, hx + 1, hatY + 1, 1, 1, P.hat);
  // arete dorado
  px(g, hx - 4, hy + 3, 1, 2, P.gold);
}

/* ====================== RETRATOS DE FRENTE ====================== */
export function mollyPortrait() {
  return make(38, 40, (g) => {
    // cuerpito y arnés
    ell(g, 19, 38, 13, 8, M.fur);
    ell(g, 19, 40, 11, 5, M.furSh);
    // arnés rojo en V con cinta de colores
    line(g, 9, 33, 17, 40, M.red, 3);
    line(g, 29, 33, 21, 40, M.red, 3);
    px(g, 15, 38, 8, 2, M.gold);
    px(g, 15, 40, 8, 1, M.blue);
    px(g, 17, 36, 4, 2, M.redDk);
    // orejas largas y caídas con puntas rosadas
    for (const [cx, dir] of [[6.5, -1], [31.5, 1]]) {
      ell(g, cx, 21, 4.8, 9, M.cream);
      ell(g, cx + dir * 0.4, 27, 4.4, 6.5, M.pink);
      ell(g, cx, 31, 3.6, 2.6, M.pinkDk);
      px(g, cx - dir * 2, 23, 1, 7, M.pinkLt);
    }
    // cabeza peluda
    ell(g, 19, 18, 12.5, 12, M.fur);
    for (const [x, y] of [[8, 8], [11, 6], [15, 5], [19, 4], [23, 5], [27, 6], [30, 8], [6, 14], [32, 14]]) px(g, x, y, 2, 2, M.fur);
    ell(g, 19, 11, 6, 3, M.furSh); // flequillo con sombra
    px(g, 14, 9, 2, 2, M.fur);
    px(g, 20, 8, 3, 2, M.fur);
    // ojeras café (marca de Molly)
    ell(g, 13, 17, 5, 4.4, M.tan);
    ell(g, 25, 17, 5, 4.4, M.tan);
    ell(g, 12.5, 14.5, 3.5, 1.6, M.cream);
    ell(g, 25.5, 14.5, 3.5, 1.6, M.cream);
    px(g, 8, 18, 2, 2, M.tanDk);
    px(g, 28, 18, 2, 2, M.tanDk);
    // ojos grandes y brillantes
    for (const ex of [12.5, 25.5]) {
      ell(g, ex, 17, 2.6, 2.8, M.eye);
      px(g, ex - 1.5, 15.5, 2, 2, '#ffffff');
      px(g, ex + 0.5, 18.5, 1, 1, '#8a7e86');
    }
    // hocico, nariz y boca
    ell(g, 19, 25, 7, 5.5, M.fur);
    ell(g, 19, 27, 5, 2.5, M.furSh);
    ell(g, 19, 22.5, 3.4, 2.4, M.nose);
    px(g, 17.5, 21.5, 2, 1, '#8a7a82');
    px(g, 19, 25, 1, 2, M.nose);
    px(g, 15, 27, 4, 1, M.nose);
    px(g, 20, 27, 4, 1, M.nose);
    px(g, 18, 28, 3, 2, M.pinkDk); // lengüita
    px(g, 18, 28, 3, 1, M.pink);
  });
}

export function pirataPortrait() {
  return make(38, 40, (g) => {
    // cuerpo negro con babero blanco y arete
    ell(g, 19, 39, 14, 8, P.black);
    ell(g, 19, 38, 6.5, 6, P.white);
    px(g, 16, 35, 6, 1, P.whiteSh);
    // orejas
    for (const [x0, dir] of [[5, 1], [26, -1]]) {
      for (let r = 0; r < 9; r++) px(g, x0 + (dir > 0 ? r * 0.4 : 0), 8 + r, 7 - r * 0.4, 1, P.black);
      px(g, x0 + (dir > 0 ? 2 : 2), 11, 3, 3, P.pink);
    }
    // cabeza negra
    ell(g, 19, 23, 12.5, 11, P.black);
    // antifaz blanco: franja que sube por la frente y hocico blanco
    ell(g, 19, 28, 8, 6.4, P.white);
    for (let y = 14; y < 24; y++) px(g, 19 - (3 + (y - 14) * 0.3), y, 6 + (y - 14) * 0.6, 1, P.white);
    // ojo bueno (ámbar con pupila vertical)
    ell(g, 26, 22, 3.6, 3.6, P.eyeAmber);
    px(g, 25.5, 19.5, 1, 5, '#1a1210');
    px(g, 24.5, 20, 1, 1, '#ffffff');
    px(g, 24, 19, 5, 1, '#0b0910');
    // parche negro en el ojo faltante, con cinta de cuero
    line(g, 6, 14, 18, 18, '#0b0910', 2);
    line(g, 19, 19, 30, 14, '#0b0910', 1);
    ell(g, 12, 22, 4.8, 4.4, '#0b0910');
    px(g, 9.5, 19.5, 3, 1, '#3a3446');
    px(g, 8.5, 20.5, 1, 2, '#3a3446');
    // nariz rosada y boca
    px(g, 17.5, 26, 3, 2, P.pink);
    px(g, 18.5, 28, 1, 1, P.pink);
    px(g, 16, 29, 3, 1, '#2a2430');
    px(g, 20, 29, 3, 1, '#2a2430');
    px(g, 17, 30, 1, 1, '#2a2430');
    px(g, 21, 30, 1, 1, '#2a2430');
    // bigotes largos
    for (const [x, y, len, dx] of [[11, 27, 9, -1], [11, 29, 9, -1], [10, 31, 7, -1], [27, 27, 9, 1], [27, 29, 9, 1], [28, 31, 7, 1]]) {
      const x0 = dx < 0 ? x - len : x;
      px(g, x0, y, len, 1, '#ffffff');
    }
    // arete dorado
    for (const [x, y] of [[32, 27], [33, 28], [33, 29], [32, 30], [31, 30], [31, 28]]) px(g, x, y, 1, 1, P.gold);
    // gorro de pirata (tricornio) con calavera y huesos
    ell(g, 19, 11, 16, 4, P.hat);
    px(g, 3, 11, 32, 2, P.hat);
    px(g, 4, 12, 30, 1, P.gold);
    px(g, 7, 6, 24, 6, P.hat);
    px(g, 10, 2, 18, 5, P.hat);
    px(g, 10, 2, 18, 1, P.hatHi);
    px(g, 2, 9, 3, 3, P.hat);
    px(g, 33, 9, 3, 3, P.hat);
    px(g, 7, 6, 24, 1, P.goldDk);
    // calavera blanca y huesos cruzados
    px(g, 17, 4, 5, 4, '#ffffff');
    px(g, 16, 5, 7, 2, '#ffffff');
    px(g, 17, 5, 1, 2, P.hat);
    px(g, 21, 5, 1, 2, P.hat);
    px(g, 19, 7, 1, 1, P.hat);
    line(g, 13, 6, 25, 9, '#e9e4ee');
    line(g, 13, 9, 25, 6, '#e9e4ee');
    px(g, 17, 4, 5, 1, '#ffffff');
  });
}

/* ====================== API ====================== */
export function makePetSprites() {
  const s = {};
  for (const f of [0, 1, 2, 'sit']) {
    s[`molly${f}`] = make(24, 20, (g) => mollyBody(g, f));
    s[`pirata${f}`] = make(24, 20, (g) => pirataBody(g, f));
  }
  s.mollyPortrait = mollyPortrait();
  s.pirataPortrait = pirataPortrait();
  return s;
}

let cache = null;
export const petSprites = () => (cache ||= makePetSprites());

export const PETS = {
  molly: { name: 'Molly', sprite: 'molly', portrait: 'mollyPortrait', color: '#f59ab8' },
  pirata: { name: 'Gato Pirata', sprite: 'pirata', portrait: 'pirataPortrait', color: '#f2c14e' },
};

// Pinta una mascota en un <canvas> (para HTML). frame: 0|1|2|'sit'. Devuelve el canvas.
export function drawPet(cv, who, frame = 'sit', flip = false) {
  const spr = petSprites()[`${PETS[who].sprite}${frame}`];
  cv.width = spr.width;
  cv.height = spr.height;
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, cv.width, cv.height);
  if (flip) {
    g.translate(cv.width, 0);
    g.scale(-1, 1);
  }
  g.drawImage(spr, 0, 0);
  return cv;
}

export function drawPortrait(cv, who) {
  const spr = petSprites()[PETS[who].portrait];
  cv.width = spr.width;
  cv.height = spr.height;
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(spr, 0, 0);
  return cv;
}
