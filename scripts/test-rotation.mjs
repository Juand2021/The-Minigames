// La bola que rueda hacia +x debe mover hacia +x los puntos de la textura que miran al jugador.
import { rollRot, mul, FRONT, randomRot } from '../src/games/pool/rotation.js';

const R = 5;
// Dónde (en la vista) cae un punto de la textura
const toView = (rot, p) => [0, 1, 2].map((i) => rot[i * 3] * p[0] + rot[i * 3 + 1] * p[1] + rot[i * 3 + 2] * p[2]);
const texPoint = (rot, v) => [0, 1, 2].map((i) => rot[i] * v[0] + rot[3 + i] * v[1] + rot[6 + i] * v[2]); // Rᵀ·v

let rot = FRONT;
const p = texPoint(rot, [0, 0, 1]); // punto de la textura que mira al jugador al inicio
let ok = true;
for (const [dx, dy, name] of [[1, 0, '+x'], [-1, 0, '-x'], [0, 1, '+y'], [0, -1, '-y']]) {
  const r2 = rollRot(FRONT, dx * 0.5, dy * 0.5, R);
  const v = toView(r2, p);
  const moved = Math.sign(v[0]) === Math.sign(dx) && Math.sign(v[1]) === Math.sign(dy);
  console.log(`rodar ${name}: el punto frontal va a (${v[0].toFixed(3)}, ${v[1].toFixed(3)}) ${moved ? 'OK' : 'MAL'}`);
  ok = ok && moved;
}

// Una vuelta completa de rodadura (2πR px) devuelve la bola a su orientación original
let r = randomRot(R);
const r0 = r.slice();
const steps = 2000;
for (let i = 0; i < steps; i++) r = rollRot(r, (2 * Math.PI * R) / steps, 0, R);
const err = Math.max(...r.map((v, i) => Math.abs(v - r0[i])));
console.log(`vuelta completa: error máximo ${err.toExponential(2)}`);
ok = ok && err < 1e-6;

// La matriz sigue siendo ortonormal tras 100 000 pasos
let q = randomRot(R);
for (let i = 0; i < 100000; i++) q = rollRot(q, Math.cos(i * 0.01) * 0.3, Math.sin(i * 0.013) * 0.3, R);
const I = mul(q, [q[0], q[3], q[6], q[1], q[4], q[7], q[2], q[5], q[8]]);
const dev = Math.max(...I.map((v, i) => Math.abs(v - (i % 4 === 0 ? 1 : 0))));
console.log(`ortonormalidad tras 100k pasos: ${dev.toExponential(2)}`);
ok = ok && dev < 1e-9;

if (!ok) throw new Error('rotación incorrecta');
console.log('OK');
