// Estado de la partida: turnos, grupos asignados y resultado de cada tiro.
import { rack, newReport, canPlaceCue, W, H } from './physics.js';
import { evaluateShot, legalTargets, opponent, otherGroup } from './rules.js';

export class Match {
  constructor() {
    this.balls = rack();
    this.assign = { P: null, V: null };
    this.turn = 'P'; // la jugadora abre
    this.inHand = false;
    this.winner = null;
    this.isBreak = true;
    this.report = newReport();
    this.pre = new Set();
  }

  get cue() {
    return this.balls[0];
  }

  pocketedSet() {
    return new Set(this.balls.filter((b) => b.pocketed).map((b) => b.id));
  }

  targets() {
    return legalTargets(this.assign[this.turn], this.pocketedSet());
  }

  beginShot() {
    this.pre = this.pocketedSet();
    this.report = newReport();
  }

  // Aplica las reglas al terminar el tiro. Devuelve el resumen para la interfaz.
  endShot() {
    const shooter = this.turn;
    // Meter la 8 en la apertura no hace perder: vuelve a su punto (regla habitual de salón).
    if (this.isBreak && this.report.pocketed.includes(8)) {
      this.report.pocketed = this.report.pocketed.filter((id) => id !== 8);
      this.respotEight();
      this.eightRespotted = true;
    } else this.eightRespotted = false;
    const res = evaluateShot({ shooter, assign: this.assign, prePocketed: this.pre, report: this.report });
    const out = { shooter, ...res, pocketed: this.report.pocketed.slice(), wasBreak: this.isBreak, eightRespotted: this.eightRespotted };
    this.isBreak = false;

    if (res.assignedTo) {
      this.assign[shooter] = res.assignedTo;
      this.assign[opponent(shooter)] = otherGroup(res.assignedTo);
    }

    if (this.report.pocketed.includes(0)) this.resetCue();

    if (res.gameOver) {
      this.winner = res.gameOver.winner;
      this.inHand = false;
      return out;
    }
    if (!res.continueTurn) this.turn = opponent(shooter);
    this.inHand = res.ballInHand;
    return out;
  }

  respotEight() {
    const b = this.balls.find((x) => x.id === 8);
    b.pocketed = false;
    b.sink = null;
    b.vx = 0;
    b.vy = 0;
    const x = W / 2;
    let y = H * 0.27;
    // si el punto está ocupado, la sube por la línea central hasta un hueco
    while (!canPlaceCue(this.balls.filter((o) => o.id !== 8), x, y) && y > 12) y -= 2;
    b.x = x;
    b.y = y;
  }

  // Coloca la blanca en un sitio libre (cerca del punto de salida).
  resetCue() {
    const c = this.cue;
    c.pocketed = false;
    c.sink = null;
    c.vx = 0;
    c.vy = 0;
    const spots = [[W / 2, H * 0.75]];
    for (let i = 0; i < 40; i++) spots.push([W / 2 + (Math.random() - 0.5) * 80, H * 0.6 + Math.random() * 60]);
    const spot = spots.find(([x, y]) => canPlaceCue(this.balls, x, y)) || spots[0];
    c.x = spot[0];
    c.y = spot[1];
  }

  // La 8 vuelve a la mesa si se emboca sin ganar no hace falta: la partida termina.
  remaining(player) {
    const g = this.assign[player];
    if (!g) return null;
    return this.balls.filter((b) => b.id !== 8 && b.id !== 0 && !b.pocketed && (g === 'solid' ? b.id < 8 : b.id > 8)).length;
  }
}
