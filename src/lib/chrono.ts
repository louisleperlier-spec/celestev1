/**
 * Chrono d'une sortie compté depuis l'heure de départ (et non seconde par seconde) : quand l'écran est verrouillé,
 * iOS suspend l'app et son minuteur, mais le temps écoulé reste juste au retour. Les pauses sont retirées. Fonctions pures.
 */
export type Chrono = { depart: number; pauseDepuis: number | null; enPause: number };

export const chronoDemarre = (now: number = Date.now()): Chrono => ({ depart: now, pauseDepuis: null, enPause: 0 });

/** Met en pause ou reprend. */
export function chronoBascule(c: Chrono, now: number = Date.now()): Chrono {
  if (c.pauseDepuis == null) return { ...c, pauseDepuis: now };
  return { ...c, pauseDepuis: null, enPause: c.enPause + (now - c.pauseDepuis) };
}

/** Secondes d'effort écoulées (pauses retirées). */
export function chronoSecondes(c: Chrono, now: number = Date.now()): number {
  const fin = c.pauseDepuis ?? now;
  return Math.max(0, Math.floor((fin - c.depart - c.enPause) / 1000));
}
