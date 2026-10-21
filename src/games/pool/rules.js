// Reglas de 8 bolas simplificadas (sin cantar tronera). P = jugadora, V = Quiz.

export const groupOf = (id) => (id === 8 ? 'eight' : id === 0 ? 'cue' : id < 8 ? 'solid' : 'stripe');
export const otherGroup = (g) => (g === 'solid' ? 'stripe' : 'solid');
export const opponent = (p) => (p === 'P' ? 'V' : 'P');

const GROUP_IDS = {
  solid: [1, 2, 3, 4, 5, 6, 7],
  stripe: [9, 10, 11, 12, 13, 14, 15],
};
export const idsOfGroup = (g) => GROUP_IDS[g];

// Bolas que el jugador puede tocar legalmente primero.
export function legalTargets(grp, prePocketed) {
  if (!grp) return [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15].filter((i) => !prePocketed.has(i));
  const own = GROUP_IDS[grp].filter((i) => !prePocketed.has(i));
  return own.length ? own : [8];
}

/**
 * @param shooter 'P' | 'V'
 * @param assign  { P: grupo|null, V: grupo|null }
 * @param prePocketed Set de ids embocadas antes del tiro
 * @param report  { firstContact, pocketed: ids en orden, railAfterContact }
 */
export function evaluateShot({ shooter, assign, prePocketed, report }) {
  const opp = opponent(shooter);
  const grp = assign[shooter];
  const ownRemaining = grp ? GROUP_IDS[grp].filter((i) => !prePocketed.has(i)).length : null;
  const scratch = report.pocketed.includes(0);
  const obj = report.pocketed.filter((i) => i !== 0);

  let foul = null;
  if (scratch) foul = 'la blanca cayó en la tronera';
  else if (report.firstContact === null) foul = 'no tocó ninguna bola';
  else {
    const f = report.firstContact;
    if (grp) {
      const legal = ownRemaining === 0 ? f === 8 : groupOf(f) === grp;
      if (!legal) foul = f === 8 ? 'tocó la 8 antes de tiempo' : 'tocó una bola del rival';
    } else if (f === 8) foul = 'tocó la 8 con la mesa abierta';
  }
  if (!foul && obj.length === 0 && !report.railAfterContact) foul = 'ninguna bola tocó banda';

  const result = {
    foul,
    assignedTo: null, // grupo asignado al tirador en este tiro
    continueTurn: false,
    ballInHand: !!foul,
    gameOver: null,
  };

  if (obj.includes(8)) {
    const legal8 = !foul && grp && ownRemaining === 0;
    result.gameOver = { winner: legal8 ? shooter : opp, early: !legal8 };
    result.continueTurn = false;
    return result;
  }

  if (foul) return result;

  let g = grp;
  if (!g && obj.length) {
    g = groupOf(obj[0]);
    result.assignedTo = g;
  }
  if (g && obj.some((i) => groupOf(i) === g)) result.continueTurn = true;
  return result;
}
