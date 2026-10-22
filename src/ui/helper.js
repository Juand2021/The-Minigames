// Mini-cinemática: cuando Laura pide una pista, una de sus mascotas llega corriendo, le dice que la ayuda,
// hace la ayuda y se va. Sirve para Sudoku y Crucigrama.
import './helper.css';
import { drawPet, PETS } from './pets.js';
import { helperLines } from '../content/story.js';
import { sfx } from '../games/shared/sfx.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
let turn = Math.random() < 0.5 ? 0 : 1;
const nextPet = () => (turn++ % 2 === 0 ? 'molly' : 'pirata');

/**
 * @param host  elemento (position: relative) sobre el que se muestra
 * @param ctx   contexto del juego (usa ctx.hold para pausar el reloj)
 * @param apply función que aplica la ayuda; se llama cuando la mascota "ayuda"
 */
export function callHelper(host, ctx, apply) {
  const who = nextPet();
  const pet = PETS[who];
  const line = pick(helperLines[who]);

  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = `hp hp-${who}`;
    el.innerHTML = `
      <div class="hp-scrim"></div>
      <div class="hp-stage">
        <div class="glass hp-bubble"><b>${pet.name}</b><p></p></div>
        <div class="hp-pet"><canvas></canvas></div>
      </div>`;
    host.appendChild(el);
    const cv = el.querySelector('canvas');
    const petEl = el.querySelector('.hp-pet');
    const bubble = el.querySelector('.hp-bubble');
    const text = bubble.querySelector('p');
    const timers = new Set();
    const wait = (ms) =>
      new Promise((r) => {
        const id = setTimeout(() => {
          timers.delete(id);
          r();
        }, ms);
        timers.add(id);
      });
    let run = 0;
    let runTimer = 0;
    const startRun = () => {
      clearInterval(runTimer);
      runTimer = setInterval(() => drawPet(cv, who, (run++ % 2) + 1), 110);
    };
    const stopRun = (frame = 'sit') => {
      clearInterval(runTimer);
      drawPet(cv, who, frame);
    };
    let dead = false;
    const cleanup = () => {
      dead = true;
      clearInterval(runTimer);
      timers.forEach(clearTimeout);
      el.remove();
    };

    (async () => {
      ctx?.hold?.(true);
      drawPet(cv, who, 1);
      // 1) entra corriendo desde la izquierda
      requestAnimationFrame(() => el.classList.add('in'));
      startRun();
      await wait(750);
      if (dead) return;
      // 2) se sienta y habla
      stopRun('sit');
      petEl.classList.add('sit');
      who === 'molly' ? sfx.bark() : sfx.meow();
      bubble.classList.add('show');
      for (let i = 1; i <= line.length; i++) {
        text.textContent = line.slice(0, i);
        if (i % 3 === 0) sfx.note();
        await wait(26);
        if (dead) return;
      }
      await wait(650);
      // 3) ayuda: salta, ladra/maúlla y se aplica la pista
      petEl.classList.add('hop');
      who === 'molly' ? sfx.bark() : sfx.meow();
      el.classList.add('flash');
      apply?.();
      await wait(950);
      // 4) se despide corriendo
      bubble.classList.remove('show');
      petEl.classList.remove('sit', 'hop');
      el.classList.add('out');
      startRun();
      await wait(650);
      cleanup();
      ctx?.hold?.(false);
      resolve(who);
    })().catch(() => {
      cleanup();
      ctx?.hold?.(false);
      resolve(null);
    });
  });
}
