// Dibujo de Maincra en un canvas de baja resolución (1 bloque = 16 px lógicos) escalado en pixel-art.
import { B, BLOCKS } from './blocks.js';
import { T, makeBlockTextures, makeCracks, makeCharacterSprites, tint, makeCanvas } from './textures.js';
import { rng } from './world.js';

const lerp = (a, b, t) => a + (b - a) * t;
// Bloques que no tapan la luz del cielo
const SEE_THROUGH = new Set([B.GLASS, B.CHEST, B.FENCE, B.DOOR]);
const mixRGB = (a, b, t) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`;
const SKY_DAY = [[120, 167, 255], [179, 209, 255]];
const SKY_DUSK = [[74, 90, 158], [240, 160, 112]];
const SKY_NIGHT = [[8, 12, 40], [26, 34, 78]];

export class Renderer {
  constructor(canvas) {
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.tex = makeBlockTextures();
    this.cracks = makeCracks();
    this.sprites = makeCharacterSprites();
    this.tinted = new Map();
    this.avg = new Map();
    this.particles = [];
    this.cam = { x: 0, y: 0 };
    this.viewW = 12;
    this.viewH = 20;
    this.shake = 0;
    this.time = 0;
    const r = rng(42);
    this.stars = Array.from({ length: 50 }, () => ({ x: r(), y: r() * 0.6, tw: r() * 6 }));
    this.clouds = Array.from({ length: 6 }, (_, i) => ({ x: i * 14 + r() * 8, y: 1.5 + r() * 4, w: 3 + Math.floor(r() * 4) }));
  }

  resize(cssW, cssH, viewTilesW) {
    this.viewW = viewTilesW;
    const lw = Math.round(viewTilesW * T);
    const lh = Math.max(T * 4, Math.round((lw * cssH) / cssW));
    this.cv.width = lw;
    this.cv.height = lh;
    this.viewH = lh / T;
    this.cv.style.width = `${cssW}px`;
    this.cv.style.height = `${cssH}px`;
    this.g.imageSmoothingEnabled = false;
    this.cssW = cssW;
    this.cssH = cssH;
  }

  setWorld(world) {
    this.world = world;
    const [c, g] = makeCanvas(world.w * T, world.h * T);
    this.layer = c;
    this.lg = g;
    for (let y = 0; y < world.h; y++) for (let x = 0; x < world.w; x++) this.drawTile(x, y);
    world.onChange = (x, y) => {
      for (const [dx, dy] of [[0, 0], [0, -1], [0, 1]]) this.drawTile(x + dx, y + dy);
    };
    this.hills = Array.from({ length: Math.ceil(world.w * 0.6) + 20 }, (_, i) => 3 + Math.round(Math.sin(i * 0.35) * 2 + Math.sin(i * 0.11) * 3));
  }

  textureOf(id, x, y) {
    if (id === B.DOOR && this.world.get(x, y + 1) === B.DOOR) return this.tex.doorTop;
    return this.tex[id];
  }

  drawTile(x, y) {
    const w = this.world;
    if (!w.inside(x, y)) return;
    this.lg.clearRect(x * T, y * T, T, T);
    const id = w.get(x, y);
    if (id === B.AIR) return;
    const t = this.textureOf(id, x, y);
    if (t) this.lg.drawImage(t, x * T, y * T);
  }

  avgColor(id) {
    if (!this.avg.has(id)) {
      const t = this.tex[id];
      const d = t.getContext('2d').getImageData(0, 0, T, T).data;
      const cols = [];
      for (let i = 0; i < d.length; i += 4 * 9) if (d[i + 3] > 100) cols.push(`rgb(${d[i]},${d[i + 1]},${d[i + 2]})`);
      this.avg.set(id, cols.length ? cols : ['#888']);
    }
    const cols = this.avg.get(id);
    return cols[Math.floor(Math.random() * cols.length)];
  }

  sprite(name, mode) {
    if (!mode) return this.sprites[name];
    const key = `${name}:${mode}`;
    if (!this.tinted.has(key)) {
      const t = { hurt: ['#ff1a1a', 0.5], glow: ['#fff6c8', 1] }[mode] || ['#000000', 0.6];
      this.tinted.set(key, tint(this.sprites[name], t[0], t[1]));
    }
    return this.tinted.get(key);
  }

  /* ---------- cámara ---------- */
  follow(cx, cy, dt, instant = false, anchorY = 0.45) {
    const w = this.world;
    const tx = Math.max(0, Math.min(w.w - this.viewW, cx - this.viewW / 2));
    const ty = Math.max(0, Math.min(w.h - this.viewH, cy - this.viewH * anchorY));
    const k = instant ? 1 : 1 - Math.exp(-dt * 6);
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * k;
  }

  // Encaja una zona del mundo (en bloques) en la vista
  frameArea(x0, y0, w, h) {
    this.cam.x = x0 + w / 2 - this.viewW / 2;
    this.cam.y = y0 + h / 2 - this.viewH / 2;
  }

  toTile(clientX, clientY) {
    const r = this.cv.getBoundingClientRect();
    const fx = this.cam.x + ((clientX - r.left) / r.width) * this.viewW;
    const fy = this.cam.y + ((clientY - r.top) / r.height) * this.viewH;
    return { tx: Math.floor(fx), ty: Math.floor(fy), fx, fy };
  }

  /* ---------- partículas ---------- */
  burst(x, y, kind, opt = {}) {
    const P = this.particles;
    if (kind === 'block') {
      for (let i = 0; i < 14; i++)
        P.push({ x: x + Math.random(), y: y + Math.random(), vx: (Math.random() - 0.5) * 5, vy: -Math.random() * 5, g: 22, life: 0.6 + Math.random() * 0.4, size: 2 + (i % 2), color: this.avgColor(opt.id) });
    } else if (kind === 'dig') {
      for (let i = 0; i < 3; i++)
        P.push({ x: x + Math.random(), y: y + Math.random(), vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 3, g: 22, life: 0.35, size: 2, color: this.avgColor(opt.id) });
    } else if (kind === 'smoke') {
      for (let i = 0; i < 10; i++)
        P.push({ x: x + (Math.random() - 0.5), y: y + (Math.random() - 0.5) * 1.5, vx: (Math.random() - 0.5) * 1.5, vy: -0.8 - Math.random(), g: 0, life: 0.6 + Math.random() * 0.5, size: 3 + Math.floor(Math.random() * 3), color: ['#ffffff', '#dddddd', '#bbbbbb'][i % 3], grow: true });
    } else if (kind === 'explosion') {
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 2 + Math.random() * 7;
        P.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, g: 4, life: 0.5 + Math.random() * 0.7, size: 3 + Math.floor(Math.random() * 4), color: ['#ffffff', '#f0f0f0', '#9a9a9a', '#ffcf5a', '#ff8a2a'][i % 5], grow: true });
      }
    } else if (kind === 'crit') {
      for (let i = 0; i < 8; i++)
        P.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: -2 - Math.random() * 3, g: 10, life: 0.5, size: 2, color: '#d8f0ff' });
    } else if (kind === 'fire') {
      for (let i = 0; i < 4; i++)
        P.push({ x: x + (Math.random() - 0.5) * 0.6, y: y + Math.random(), vx: 0, vy: -2 - Math.random() * 2, g: 0, life: 0.4, size: 2, color: ['#ffdf6a', '#ff9a2a', '#ff5a1a'][i % 3] });
    } else if (kind === 'sparkle') {
      for (let i = 0; i < 10; i++)
        P.push({ x: x + Math.random(), y: y + Math.random(), vx: (Math.random() - 0.5) * 3, vy: -1 - Math.random() * 3, g: 6, life: 0.6, size: 2, color: ['#fff6b0', '#ffd166', '#ffffff'][i % 3] });
    } else if (kind === 'heart') {
      for (let i = 0; i < 6; i++)
        P.push({ x: x + (Math.random() - 0.5), y, vx: (Math.random() - 0.5) * 2, vy: -2 - Math.random() * 2, g: 0, life: 0.9, size: 3, color: '#ff5c8a' });
    }
  }

  /* ---------- dibujo ---------- */
  frame(scene, dt) {
    this.time += dt;
    const g = this.g;
    const W = this.cv.width;
    const H = this.cv.height;
    const w = this.world;
    const d = scene.daylight ?? 0;
    this.shake = Math.min(18, Math.max(0, this.shake - dt * 12));
    const sx = (Math.random() - 0.5) * this.shake;
    const sy = (Math.random() - 0.5) * this.shake;
    const camPX = Math.round((this.cam.x + sx * 0.05) * T);
    const camPY = Math.round((this.cam.y + sy * 0.05) * T);
    const vx0 = Math.floor(camPX / T);
    const vy0 = Math.floor(camPY / T);
    const vx1 = Math.ceil((camPX + W) / T);
    const vy1 = Math.ceil((camPY + H) / T);

    // Cielo
    const [top, bottom] =
      d < 0.5
        ? [0, 1].map((i) => mixRGB(SKY_DAY[i], SKY_DUSK[i], d * 2))
        : [0, 1].map((i) => mixRGB(SKY_DUSK[i], SKY_NIGHT[i], (d - 0.5) * 2));
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, top);
    grad.addColorStop(1, bottom);
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    // Sol que baja / luna que sube
    const sunY = Math.round(lerp(14, H * 0.55, Math.min(1, d * 1.4)));
    if (d < 0.8) {
      g.fillStyle = '#fff3a8';
      g.fillRect(W - 46, sunY, 22, 22);
      g.fillStyle = '#ffe066';
      g.fillRect(W - 43, sunY + 3, 16, 16);
    }

    // Colinas lejanas (paralaje)
    const hillCol = mixRGB([132, 178, 160], [24, 34, 66], d);
    g.fillStyle = hillCol;
    g.globalAlpha = 0.55;
    const par = 0.4;
    for (let i = 0; i < W / 8 + 2; i++) {
      const hx = Math.floor((camPX * par) / 8) + i;
      const h = this.hills[((hx % this.hills.length) + this.hills.length) % this.hills.length];
      g.fillRect(i * 8 - ((camPX * par) % 8), H * 0.62 - h * 6 - (camPY - 8 * T) * 0.2, 8, H);
    }
    g.globalAlpha = 1;

    // Nubes
    g.fillStyle = `rgba(255,255,255,${0.85 - d * 0.6})`;
    for (const c of this.clouds) {
      const cx = ((c.x + this.time * 0.25) * T - camPX * 0.5) % (W + 160);
      const xx = cx < -80 ? cx + W + 160 : cx;
      g.fillRect(Math.round(xx), Math.round(c.y * T - camPY * 0.15), c.w * T, T * 0.6);
      g.fillRect(Math.round(xx + T * 0.6), Math.round(c.y * T - camPY * 0.15 - T * 0.4), (c.w - 1.5) * T, T * 0.4);
    }

    // Bloques (capa en caché)
    g.drawImage(this.layer, camPX, camPY, W, H, 0, 0, W, H);

    // Plano fantasma (modo construcción)
    if (scene.ghost && scene.ghost.show) this.drawGhost(scene.ghost, camPX, camPY);

    // Grietas
    for (const c of scene.cracks || []) {
      const st = Math.min(9, Math.floor(c.p * 10));
      g.drawImage(this.cracks[st], c.tx * T - camPX, c.ty * T - camPY);
    }

    // Bloque apuntado
    if (scene.target) {
      g.strokeStyle = 'rgba(0,0,0,0.75)';
      g.lineWidth = 1;
      g.strokeRect(scene.target.tx * T - camPX + 0.5, scene.target.ty * T - camPY + 0.5, T - 1, T - 1);
    }

    // Entidades
    for (const e of scene.entities || []) this.drawEntity(e, camPX, camPY);

    // Flechas
    g.fillStyle = '#6b4a2a';
    for (const a of scene.arrows || []) {
      const ang = a.stuck ? a.ang : Math.atan2(a.vy, a.vx);
      a.ang = ang;
      for (let i = 0; i < 8; i++) {
        g.fillStyle = i < 2 ? '#bdbdbd' : i > 5 ? '#e8e8e8' : '#6b4a2a';
        g.fillRect(Math.round(a.x * T - camPX - Math.cos(ang) * i), Math.round(a.y * T - camPY - Math.sin(ang) * i), 1, 1);
      }
    }

    // Partículas
    const P = this.particles;
    for (const p of P) {
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      const s = p.grow ? p.size + (1 - p.life) * 3 : p.size;
      g.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
      g.fillStyle = p.color;
      g.fillRect(Math.round(p.x * T - camPX - s / 2), Math.round(p.y * T - camPY - s / 2), s, s);
    }
    g.globalAlpha = 1;
    this.particles = P.filter((p) => p.life > 0);

    // Luz por bloque (estilo cúbico)
    if (d > 0.02 || scene.caves) this.drawLight(scene, vx0, vy0, vx1, vy1, camPX, camPY, d);

    // Estrellas y luna por encima de la oscuridad, solo donde se ve el cielo
    if (d > 0.55) {
      const a = Math.min(1, (d - 0.55) * 3);
      for (const s of this.stars) {
        const px = Math.round(s.x * W);
        const py = Math.round(s.y * H);
        const tx = Math.floor((px + camPX) / T);
        const ty = Math.floor((py + camPY) / T);
        if (ty >= this.colTop(tx) || this.world.get(tx, ty) !== B.AIR) continue;
        g.fillStyle = `rgba(255,255,255,${a * (0.5 + 0.5 * Math.sin(this.time * 2 + s.tw))})`;
        g.fillRect(px, py, 1, 1);
      }
      const my = Math.round(lerp(H * 0.4, 18, Math.min(1, (d - 0.55) * 2.2)));
      if (my / T + this.cam.y < this.colTop(Math.floor((22 + camPX) / T))) {
        g.fillStyle = `rgba(230,234,245,${a})`;
        g.fillRect(16, my, 18, 18);
        g.fillStyle = `rgba(180,186,205,${a})`;
        g.fillRect(20, my + 4, 4, 4);
        g.fillRect(27, my + 10, 3, 3);
      }
    }
  }

  colTop(x) {
    const w = this.world;
    if (x < 0 || x >= w.w) return w.h;
    if (!this._colCache || this._colFrame !== this.time) {
      this._colCache = new Map();
      this._colFrame = this.time;
    }
    if (this._colCache.has(x)) return this._colCache.get(x);
    let y = 0;
    for (; y < w.h; y++) {
      const id = w.get(x, y);
      if (BLOCKS[id].solid && !SEE_THROUGH.has(id)) break;
    }
    this._colCache.set(x, y);
    return y;
  }

  drawLight(scene, vx0, vy0, vx1, vy1, camPX, camPY, d) {
    const g = this.g;
    const w = this.world;
    const lights = [];
    for (let y = vy0 - 7; y <= vy1 + 7; y++)
      for (let x = vx0 - 7; x <= vx1 + 7; x++) if (w.get(x, y) === B.TORCH) lights.push([x + 0.5, y + 0.4, 7.5, 1]);
    for (const l of scene.lights || []) lights.push(l);
    const flick = 0.03 * Math.sin(this.time * 13);
    for (let x = vx0; x <= vx1; x++) {
      // suaviza con las columnas vecinas para evitar franjas
      const top = (this.colTop(x - 1) + 2 * this.colTop(x) + this.colTop(x + 1)) / 4;
      for (let y = vy0; y <= vy1; y++) {
        const sky = y < top ? 1 : Math.max(0.12, 1 - (y - top + 1) * 0.11);
        let L = sky * (1 - 0.8 * d);
        if (y < top && w.get(x, y) === B.AIR) L = Math.max(L, 1 - 0.5 * d); // el aire libre se oscurece menos
        for (const [lx, ly, rad, str] of lights) {
          const dist = Math.abs(x + 0.5 - lx) + Math.abs(y + 0.5 - ly) * 0.9;
          if (dist < rad) L = Math.max(L, (1 - dist / rad) * str + flick);
        }
        const dark = Math.round(Math.max(0, 1 - L) * 0.9 * 8) / 8;
        if (dark <= 0) continue;
        g.fillStyle = `rgba(4,6,18,${dark})`;
        g.fillRect(x * T - camPX, y * T - camPY, T, T);
      }
    }
  }

  drawGhost(ghost, camPX, camPY) {
    const g = this.g;
    const pulse = 0.5 + 0.15 * Math.sin(this.time * 4);
    for (const c of ghost.cells) {
      const cur = this.world.get(c.x, c.y);
      const X = c.x * T - camPX;
      const Y = c.y * T - camPY;
      if (c.id === B.AIR) {
        if (cur !== B.AIR && cur !== B.WATER && !this.world.isFixed(c.x, c.y)) {
          g.fillStyle = 'rgba(255,40,40,0.45)';
          g.fillRect(X, Y, T, T);
        }
        continue;
      }
      if (cur === c.id) continue;
      if (cur !== B.AIR && cur !== B.WATER) {
        g.strokeStyle = 'rgba(255,60,60,0.95)';
        g.strokeRect(X + 0.5, Y + 0.5, T - 1, T - 1);
        continue;
      }
      g.globalAlpha = pulse;
      g.drawImage(this.tex[c.id], X, Y);
      g.globalAlpha = 1;
      g.strokeStyle = 'rgba(255,255,255,0.55)';
      g.setLineDash([2, 2]);
      g.strokeRect(X + 0.5, Y + 0.5, T - 1, T - 1);
      g.setLineDash([]);
    }
  }

  // e: { name, x, y, w, h, face, mode, bob, carry, alpha, scale }
  drawEntity(e, camPX, camPY) {
    const g = this.g;
    const s = e.img || this.sprite(e.name, e.mode);
    if (!s) return;
    const sc = e.scale || 1;
    const sw = s.width * sc;
    const sh = s.height * sc;
    const dx = Math.round((e.x + e.w / 2) * T - camPX - sw / 2);
    const dy = Math.round((e.y + e.h) * T - camPY - sh + (e.bob || 0));
    if (e.alpha !== undefined) g.globalAlpha = e.alpha;
    if (e.face < 0) {
      g.save();
      g.translate(dx + sw, dy);
      g.scale(-1, 1);
      g.drawImage(s, 0, 0, sw, sh);
      g.restore();
    } else g.drawImage(s, dx, dy, sw, sh);
    g.globalAlpha = 1;
    if (e.carry) {
      // el botín va encima de la cabeza, con borde claro para que se vea sobre cualquier fondo
      const c = this.sprites[e.carry];
      const glow = this.sprite(e.carry, 'glow');
      const cx = Math.round(dx + sw / 2 - c.width / 2);
      const cy = dy - c.height + 1 + Math.round(Math.sin(this.time * 8));
      for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.drawImage(glow, cx + ox, cy + oy);
      g.drawImage(c, cx, cy);
    }
    if (e.hpBar !== undefined && e.hpBar < 1) {
      g.fillStyle = 'rgba(0,0,0,0.6)';
      g.fillRect(dx + sw / 2 - 8, dy - 4, 16, 2);
      g.fillStyle = e.hpBar > 0.5 ? '#5ee65e' : e.hpBar > 0.25 ? '#ffd166' : '#ff5c5c';
      g.fillRect(dx + sw / 2 - 8, dy - 4, Math.round(16 * e.hpBar), 2);
    }
  }
}
