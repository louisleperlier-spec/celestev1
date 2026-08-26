// Archétype tracker-streak — calculs purs (aucun accès réseau) : clé de jour + streak.
// Isolé pour être testable et réutilisable partout dans la feature.

/** Jour LOCAL au format YYYY-MM-DD (la clé d'une coche journalière, dans le fuseau du device). */
export function dayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Streak = nombre de jours consécutifs cochés en remontant depuis aujourd'hui.
 *  Si aujourd'hui n'est pas encore coché, on ne « casse » pas la série tant que la journée
 *  n'est pas finie : on démarre le comptage à hier. */
export function computeStreak(days: Iterable<string>): number {
  const set = new Set(days);
  const cursor = new Date();
  if (!set.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (set.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
