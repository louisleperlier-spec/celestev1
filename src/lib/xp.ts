/** Série de jours, niveaux et rangs, boosts (streak, lvlInfo, rankOf, boosts, mult du prototype). */
import { RANKS } from '@/data/ligue';
import { DAYSPOS } from '@/data/templates';
import type { JoursParSemaine, Rank } from '@/data/types';

/** Une activité terminée (séance ou sortie vélo). */
export type Log = {
  d: string;
  type: 'muscu' | 'velo';
  title: string;
  min: number;
  cal: number;
  vol: number;
  hrAvg?: number;
  hrMax?: number;
  hrv?: number;
  dist?: number;
  ex?: number;
};

/** Jours consécutifs avec une activité ; un jour de repos prévu ne casse pas la série. */
export function streak(logs: readonly Log[], days: number, now: Date = new Date()): number {
  const set = new Set(logs.map((l) => l.d.slice(0, 10)));
  let n = 0;
  const d = new Date(now);
  for (let k = 0; k < 400; k++) {
    const key = d.toISOString().slice(0, 10);
    const di = (d.getDay() + 6) % 7;
    if (set.has(key)) n++;
    else if (k > 0 && DAYSPOS[String(days) as JoursParSemaine].includes(di)) break;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Niveau n coûte 100 + 20 × (n − 1) XP. */
export function lvlInfo(xp: number): { n: number; cur: number; need: number } {
  let n = 1;
  let need = 100;
  let acc = 0;
  while (xp >= acc + need) {
    acc += need;
    n++;
    need = 100 + 20 * (n - 1);
  }
  return { n, cur: xp - acc, need };
}

/** Rang tous les 5 niveaux : Bronze, Argent, Or, Platine, Diamant. */
export const rankOf = (n: number): Rank => RANKS[Math.min(4, Math.floor((n - 1) / 5))];

export type Boost = readonly [string, number, string];

/** Boosts actifs (série, Turbo, équipe). */
export function boosts(serie: number, boostUntil: number, equipeActive: number, now: number = Date.now()): Boost[] {
  const b: Boost[] = [];
  if (serie >= 7) b.push(['Série ' + serie + ' j', 1.5, 'flame']);
  else if (serie >= 3) b.push(['Série ' + serie + ' j', 1.2, 'flame']);
  if (boostUntil > now) b.push(['Turbo', 2, 'bolt']);
  if (equipeActive >= 3) b.push(['Équipe', 1.2, 'usercheck']);
  return b;
}

/** Multiplicateur d'XP : produit des boosts, plafonné à x3. */
export const mult = (b: readonly Boost[]) => Math.min(3, b.reduce((a, x) => a * x[1], 1));
