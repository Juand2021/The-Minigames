// Movimiento de entidades (cajas) contra la rejilla. Unidades: bloques y segundos.
export const GRAVITY = 32;
export const MAX_FALL = 22;

// e: { x, y, w, h, vx, vy, onGround } — (x, y) = esquina superior izquierda
export function moveEntity(world, e, dt) {
  e.vy = Math.min(MAX_FALL, e.vy + GRAVITY * dt);
  e.hitWall = 0;

  // eje X
  e.x += e.vx * dt;
  if (e.vx !== 0) {
    const tx = e.vx > 0 ? Math.floor(e.x + e.w - 1e-6) : Math.floor(e.x);
    const y0 = Math.floor(e.y + 1e-4);
    const y1 = Math.floor(e.y + e.h - 1e-4);
    for (let ty = y0; ty <= y1; ty++) {
      if (world.solid(tx, ty)) {
        e.x = e.vx > 0 ? tx - e.w : tx + 1;
        e.hitWall = e.vx > 0 ? 1 : -1;
        e.vx = 0;
        break;
      }
    }
  }

  // eje Y
  e.y += e.vy * dt;
  e.onGround = false;
  const x0 = Math.floor(e.x + 1e-4);
  const x1 = Math.floor(e.x + e.w - 1e-4);
  if (e.vy > 0) {
    const ty = Math.floor(e.y + e.h);
    for (let tx = x0; tx <= x1; tx++) {
      if (world.solid(tx, ty)) {
        e.y = ty - e.h;
        e.vy = 0;
        e.onGround = true;
        break;
      }
    }
  } else if (e.vy < 0) {
    const ty = Math.floor(e.y);
    for (let tx = x0; tx <= x1; tx++) {
      if (world.solid(tx, ty)) {
        e.y = ty + 1;
        e.vy = 0;
        break;
      }
    }
  }
}

// ¿Se superpone la caja con la celda (tx, ty)?
export const overlapsTile = (e, tx, ty) => e.x < tx + 1 && e.x + e.w > tx && e.y < ty + 1 && e.y + e.h > ty;

export const centerX = (e) => e.x + e.w / 2;
export const centerY = (e) => e.y + e.h / 2;
export const boxDist = (a, b) => Math.hypot(centerX(a) - centerX(b), centerY(a) - centerY(b));
