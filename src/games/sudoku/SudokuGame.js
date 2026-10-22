import './sudoku.css';
import { generatePuzzle, canPlace, rowOf, colOf, boxOf } from './generator.js';
import { sfx } from '../shared/sfx.js';
import { burst } from '../shared/confetti.js';
import { sudokuToasts } from '../../content/story.js';

const HINTS = 3;
const CLUES = 38;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Índices de cada fila, columna y caja.
const UNITS = (() => {
  const rows = [];
  const cols = [];
  const boxes = [];
  for (let k = 0; k < 9; k++) {
    rows.push([...Array(9).keys()].map((x) => k * 9 + x));
    cols.push([...Array(9).keys()].map((x) => x * 9 + k));
    const br = Math.floor(k / 3) * 3;
    const bc = (k % 3) * 3;
    boxes.push([...Array(9).keys()].map((x) => (br + Math.floor(x / 3)) * 9 + bc + (x % 3)));
  }
  return { rows, cols, boxes };
})();

const isPeer = (a, b) =>
  a !== b && (rowOf(a) === rowOf(b) || colOf(a) === colOf(b) || boxOf(a) === boxOf(b));

export function createSudoku() {
  let root;
  let ctx;
  let board;
  let cursor;
  let toastEl;
  let cells = [];
  let keys = [];
  let btn = {};
  let state;
  let stopConfetti = null;
  let observer = null;
  const timeouts = new Set();

  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timeouts.delete(id);
      fn();
    }, ms);
    timeouts.add(id);
  };

  /* ---------- construcción ---------- */
  function build() {
    const { puzzle, solution } = generatePuzzle(CLUES);
    state = {
      given: puzzle.map((n) => n !== 0),
      v: puzzle.slice(),
      solution,
      notes: new Array(81).fill(0),
      sel: -1,
      notesMode: false,
      hints: HINTS,
      undo: [],
      doneUnits: new Set(),
      doneDigits: new Set(),
      over: false,
    };

    root = document.createElement('div');
    root.className = 'sdk enter';

    const cellHtml = Array.from({ length: 81 }, (_, i) => {
      const r = rowOf(i);
      const c = colOf(i);
      const cls = ['cell'];
      if (c % 3 === 2 && c < 8) cls.push('bR');
      if (r % 3 === 2 && r < 8) cls.push('bB');
      if (state.given[i]) cls.push('given');
      const notes = Array.from({ length: 9 }, (_, n) => `<s data-n="${n + 1}">${n + 1}</s>`).join('');
      return `<button class="${cls.join(' ')}" data-i="${i}" style="--d:${(r + c) * 24}ms" aria-label="Fila ${r + 1}, columna ${c + 1}"><span class="v"></span><span class="notes">${notes}</span></button>`;
    }).join('');

    const keyHtml = Array.from(
      { length: 9 },
      (_, n) => `<button class="key" data-n="${n + 1}" style="--d:${n * 35}ms"><b>${n + 1}</b><i></i></button>`,
    ).join('');

    root.innerHTML = `
      <div class="sdk-toast" aria-live="polite"></div>
      <div class="sdk-main">
        <div class="sdk-board">
          <div class="sdk-cursor"></div>
          ${cellHtml}
        </div>
      </div>
      <div class="sdk-tools">
        <button class="tool" data-act="undo"><span>↶</span><em>Deshacer</em></button>
        <button class="tool" data-act="erase"><span>⌫</span><em>Borrar</em></button>
        <button class="tool" data-act="notes"><span>✏️</span><em>Notas</em><u>OFF</u></button>
        <button class="tool" data-act="hint"><span>💡</span><em>Pista</em><u>${HINTS}</u></button>
        <button class="tool" data-act="sound"><span>${sfx.muted ? '🔇' : '🔊'}</span><em>Sonido</em></button>
      </div>
      <div class="sdk-pad">${keyHtml}</div>`;

    board = root.querySelector('.sdk-board');
    cursor = root.querySelector('.sdk-cursor');
    toastEl = root.querySelector('.sdk-toast');
    cells = [...root.querySelectorAll('.cell')];
    keys = [...root.querySelectorAll('.key')];
    btn = {
      undo: root.querySelector('[data-act=undo]'),
      notes: root.querySelector('[data-act=notes]'),
      hint: root.querySelector('[data-act=hint]'),
      sound: root.querySelector('[data-act=sound]'),
    };
  }

  /* ---------- feedback visual ---------- */
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.remove('show');
    void toastEl.offsetWidth; // reinicia la animación
    toastEl.classList.add('show');
  }

  function flash(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
  }

  function sparkles(i) {
    const cell = cells[i];
    const x = (colOf(i) + 0.5) * (100 / 9);
    const y = (rowOf(i) + 0.5) * (100 / 9);
    for (let k = 0; k < 7; k++) {
      const s = document.createElement('span');
      s.className = 'spark';
      const ang = (k / 7) * Math.PI * 2 + Math.random();
      const dist = 26 + Math.random() * 22;
      s.style.cssText = `left:${x}%;top:${y}%;--dx:${Math.cos(ang) * dist}px;--dy:${Math.sin(ang) * dist}px`;
      s.textContent = k % 2 ? '✦' : '✧';
      board.appendChild(s);
      s.addEventListener('animationend', () => s.remove(), { once: true });
    }
    void cell;
  }

  /* ---------- estado derivado ---------- */
  function conflictSet() {
    const bad = new Set();
    for (let i = 0; i < 81; i++) {
      if (state.v[i] && !canPlace(state.v, i, state.v[i])) bad.add(i);
    }
    return bad;
  }

  function refresh() {
    const { v, sel, notes } = state;
    const sv = sel >= 0 ? v[sel] : 0;
    const bad = conflictSet();
    for (let i = 0; i < 81; i++) {
      const c = cells[i];
      c.classList.toggle('sel', i === sel);
      c.classList.toggle('peer', sel >= 0 && isPeer(sel, i));
      c.classList.toggle('same', sv !== 0 && i !== sel && v[i] === sv);
      c.classList.toggle('err', bad.has(i));
      const vEl = c.firstElementChild;
      const text = v[i] ? String(v[i]) : '';
      if (vEl.textContent !== text) vEl.textContent = text;
      c.classList.toggle('filled', v[i] !== 0);
      const nEls = c.lastElementChild.children;
      for (let n = 0; n < 9; n++) nEls[n].classList.toggle('on', !v[i] && (notes[i] >> n) & 1);
    }

    // Teclado: restantes y dígitos completados
    for (const k of keys) {
      const d = Number(k.dataset.n);
      let count = 0;
      for (let i = 0; i < 81; i++) if (v[i] === d && !bad.has(i)) count++;
      k.lastElementChild.textContent = count < 9 ? String(9 - count) : '';
      const done = count >= 9;
      k.classList.toggle('done', done);
      if (done && !state.doneDigits.has(d)) {
        state.doneDigits.add(d);
        flash(k, 'boom');
        sfx.complete();
      } else if (!done) state.doneDigits.delete(d);
    }

    btn.undo.disabled = state.undo.length === 0;
    btn.notes.classList.toggle('on', state.notesMode);
    btn.notes.lastElementChild.textContent = state.notesMode ? 'ON' : 'OFF';
    btn.hint.lastElementChild.textContent = String(state.hints);
    btn.hint.disabled = state.hints === 0;
    moveCursor();
  }

  function moveCursor() {
    const sel = state.sel;
    if (sel < 0) {
      cursor.style.opacity = '0';
      return;
    }
    cursor.style.opacity = '1';
    cursor.style.transform = `translate(${colOf(sel) * 100}%, ${rowOf(sel) * 100}%)`;
  }

  /* ---------- unidades completadas ---------- */
  function unitComplete(unit) {
    const seen = new Set();
    for (const i of unit) {
      const n = state.v[i];
      if (!n || seen.has(n)) return false;
      seen.add(n);
    }
    return true;
  }

  function checkUnits(origin) {
    const groups = [
      ['r' + rowOf(origin), UNITS.rows[rowOf(origin)]],
      ['c' + colOf(origin), UNITS.cols[colOf(origin)]],
      ['b' + boxOf(origin), UNITS.boxes[boxOf(origin)]],
    ];
    let any = false;
    for (const [key, unit] of groups) {
      if (unitComplete(unit)) {
        if (!state.doneUnits.has(key)) {
          state.doneUnits.add(key);
          any = true;
          unit.forEach((i, idx) => {
            const dist = Math.abs(rowOf(i) - rowOf(origin)) + Math.abs(colOf(i) - colOf(origin));
            cells[i].style.setProperty('--w', `${dist * 45 + idx * 6}ms`);
            flash(cells[i], 'wave');
          });
        }
      } else state.doneUnits.delete(key);
    }
    if (any) {
      sfx.complete();
      toast(pick(sudokuToasts.complete));
    }
  }

  /* ---------- acciones ---------- */
  function snapshot() {
    state.undo.push({ v: state.v.slice(), notes: state.notes.slice() });
    if (state.undo.length > 120) state.undo.shift();
  }

  function select(i) {
    if (state.over) return;
    state.sel = i;
    sfx.tap();
    refresh();
  }

  function place(n) {
    const i = state.sel;
    if (state.over) return;
    if (i < 0) return toast(sudokuToasts.pickFirst);
    if (state.given[i]) return;

    if (state.notesMode) {
      if (state.v[i]) return;
      snapshot();
      state.notes[i] ^= 1 << (n - 1);
      sfx.note();
      refresh();
      return;
    }

    if (state.v[i] === n) return;
    snapshot();
    state.v[i] = n;
    state.notes[i] = 0;
    // Limpia ese dígito de las notas de los vecinos.
    for (let j = 0; j < 81; j++) if (isPeer(i, j)) state.notes[j] &= ~(1 << (n - 1));

    const wrong = !canPlace(state.v, i, n);
    refresh();
    flash(cells[i], 'pop');
    if (wrong) {
      sfx.error();
      flash(board, 'shake');
      if (Math.random() < 0.5) toast(pick(sudokuToasts.error));
    } else {
      sfx.place();
      checkUnits(i);
    }
    state.doneUnits.forEach((key) => {
      // Una unidad deja de contar como completada si algún cambio la invalida.
      const idx = Number(key.slice(1));
      const unit = key[0] === 'r' ? UNITS.rows[idx] : key[0] === 'c' ? UNITS.cols[idx] : UNITS.boxes[idx];
      if (!unitComplete(unit)) state.doneUnits.delete(key);
    });
    checkWin();
  }

  function erase() {
    const i = state.sel;
    if (state.over || i < 0 || state.given[i]) return;
    if (!state.v[i] && !state.notes[i]) return;
    snapshot();
    state.v[i] = 0;
    state.notes[i] = 0;
    sfx.erase();
    refresh();
  }

  function undo() {
    if (state.over) return;
    const prev = state.undo.pop();
    if (!prev) return;
    state.v = prev.v;
    state.notes = prev.notes;
    sfx.erase();
    refresh();
  }

  function hint() {
    if (state.over || state.hints === 0) return;
    let i = state.sel;
    if (i < 0 || state.given[i] || state.v[i] === state.solution[i]) {
      const pool = [];
      for (let k = 0; k < 81; k++) if (!state.given[k] && state.v[k] !== state.solution[k]) pool.push(k);
      if (!pool.length) return;
      i = pick(pool);
    }
    snapshot();
    state.hints--;
    state.v[i] = state.solution[i];
    state.notes[i] = 0;
    state.sel = i;
    cells[i].classList.add('hinted');
    refresh();
    flash(cells[i], 'pop');
    sparkles(i);
    sfx.hint();
    toast(pick(sudokuToasts.hint));
    checkUnits(i);
    checkWin();
  }

  function toggleNotes() {
    state.notesMode = !state.notesMode;
    sfx.tap();
    refresh();
  }

  function toggleSound() {
    sfx.setMuted(!sfx.muted);
    btn.sound.firstElementChild.textContent = sfx.muted ? '🔇' : '🔊';
    sfx.tap();
  }

  /* ---------- victoria ---------- */
  function checkWin() {
    if (state.over) return;
    for (let i = 0; i < 81; i++) {
      if (state.v[i] !== state.solution[i]) return;
    }
    state.over = true;
    ctx.freeze?.(); // resuelto: el reloj ya no corre durante la celebración
    state.sel = -1;
    refresh();
    root.classList.add('won');
    cells.forEach((c, i) => {
      const dist = Math.abs(rowOf(i) - 4) + Math.abs(colOf(i) - 4);
      c.style.setProperty('--w', `${dist * 70}ms`);
      flash(c, 'wave');
    });
    sfx.win();
    toast(sudokuToasts.win);
    stopConfetti = burst(root);
    later(() => ctx.win(), 2300);
  }

  /* ---------- entrada ---------- */
  function onPointer(e) {
    const cell = e.target.closest('.cell');
    if (cell) return select(Number(cell.dataset.i));
    const key = e.target.closest('.key');
    if (key) return key.classList.contains('done') ? null : place(Number(key.dataset.n));
    const tool = e.target.closest('.tool');
    if (!tool || tool.disabled) return;
    const act = tool.dataset.act;
    if (act === 'undo') undo();
    else if (act === 'erase') erase();
    else if (act === 'notes') toggleNotes();
    else if (act === 'hint') hint();
    else if (act === 'sound') toggleSound();
  }

  function onKey(e) {
    if (e.key >= '1' && e.key <= '9') place(Number(e.key));
    else if (e.key === 'Backspace' || e.key === 'Delete') erase();
    else if (e.key.toLowerCase() === 'n') toggleNotes();
    else if (e.key.startsWith('Arrow') && state.sel >= 0) {
      const d = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[e.key];
      const next = state.sel + d;
      if (next >= 0 && next < 81 && (Math.abs(d) === 9 || rowOf(next) === rowOf(state.sel))) select(next);
    }
  }

  return {
    mount(container, context) {
      ctx = context;
      build();
      container.appendChild(root);
      root.addEventListener('pointerdown', onPointer);
      document.addEventListener('keydown', onKey);

      // Pulso del tablero en los últimos 30 s (el shell marca el reloj con .urgent).
      const timeEl = document.getElementById('time');
      if (timeEl) {
        observer = new MutationObserver(() =>
          root.classList.toggle('urgent', timeEl.classList.contains('urgent')),
        );
        observer.observe(timeEl, { attributes: true, attributeFilter: ['class'] });
      }

      refresh();
      toast(sudokuToasts.start);
      later(() => {
        root.classList.remove('enter');
        const first = state.given.findIndex((g, i) => !g && !state.v[i]);
        if (first >= 0) select(first);
      }, 1100);
    },
    destroy() {
      timeouts.forEach(clearTimeout);
      timeouts.clear();
      observer?.disconnect();
      stopConfetti?.();
      document.removeEventListener('keydown', onKey);
      root?.remove();
    },
  };
}
