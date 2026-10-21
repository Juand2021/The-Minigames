// Orientación 3D de una bola. Matriz 3x3 (fila a fila) que lleva puntos de la textura al espacio de la vista:
// x a la derecha, y hacia abajo, z hacia quien mira.

export const mul = (a, b) => {
  const r = new Array(9);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  return r;
};

// Mantiene la matriz ortonormal (evita deriva numérica tras miles de multiplicaciones).
export function orthonormalize(m) {
  let [a0, a1, a2, b0, b1, b2] = m;
  let l = Math.hypot(a0, a1, a2);
  a0 /= l; a1 /= l; a2 /= l;
  const d = a0 * b0 + a1 * b1 + a2 * b2;
  b0 -= d * a0; b1 -= d * a1; b2 -= d * a2;
  l = Math.hypot(b0, b1, b2);
  b0 /= l; b1 /= l; b2 /= l;
  return [a0, a1, a2, b0, b1, b2, a1 * b2 - a2 * b1, a2 * b0 - a0 * b2, a0 * b1 - a1 * b0];
}

// Rodadura sin deslizar: la bola avanza (dx, dy) y gira R rad/px alrededor del eje perpendicular.
// El punto que mira al jugador se desplaza en el mismo sentido que el movimiento.
export function rollRot(rot, dx, dy, radius) {
  const d = Math.hypot(dx, dy);
  if (d < 1e-6) return rot;
  const th = d / radius;
  const ax = -dy / d;
  const ay = dx / d;
  const c = Math.cos(th);
  const s = Math.sin(th);
  const t = 1 - c;
  const m = [
    t * ax * ax + c, t * ax * ay, s * ay,
    t * ax * ay, t * ay * ay + c, -s * ax,
    -s * ay, s * ax, c,
  ];
  return orthonormalize(mul(m, rot));
}

const rotZ = (a) => [Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a), 0, 0, 0, 1];

// Orientación inicial: el número (eje x de la textura) mira hacia arriba, con inclinación y giro al azar.
export function randomRot(radius, faceUp = true) {
  const front = [0, 0, -1, 0, 1, 0, 1, 0, 0];
  let m = faceUp ? front : [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const a = Math.random() * Math.PI * 2;
  const tilt = faceUp ? 0.25 + Math.random() * 0.5 : Math.PI;
  m = rollRot(m, Math.cos(a) * tilt * radius, Math.sin(a) * tilt * radius, radius);
  return mul(rotZ(Math.random() * Math.PI * 2), m);
}

export const FRONT = [0, 0, -1, 0, 1, 0, 1, 0, 0];
