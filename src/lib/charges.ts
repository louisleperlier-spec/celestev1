/**
 * Charge conseillée selon le poids, le niveau et la semaine du programme (loadFor du prototype),
 * et zone de répétitions (zoneBar).
 */
import { exercice, hrMax, lvlN, progFactor, progWeek, type PlanItem, type Profil } from './plan';

export type Charge = { txt: string; sub: string; kg?: number };

/** Nombre à la française (dec() du prototype). */
export const dec = (n: number | string) => String(n).replace('.', ',');

export function loadFor(it: PlanItem, p: Profil, now: number = Date.now()): Charge {
  const e = exercice(it.id);
  const w = p.weight;
  if (
    e.materiel === 'pdc' ||
    e.materiel === 'velo' ||
    (e.materiel === 'mac' && (e.id === 'dips' || e.id === 'releve_genoux' || e.id === 'tractions_assistees')) ||
    e.id === 'tractions'
  ) {
    if (e.id === 'tractions_assistees')
      return { txt: 'Assistance ≈ ' + Math.round(w * 0.4) + ' kg', sub: 'Tu soulèves ≈ ' + Math.round(w * 0.6) + ' kg' };
    if (e.id === 'velo_stationnaire')
      return {
        txt: 'Résistance ' + [4, 6, 7][lvlN(p.level) - 1] + '/10',
        sub: 'Vise ' + Math.round(hrMax(p.age) * 0.65) + ' à ' + Math.round(hrMax(p.age) * 0.75) + ' bpm',
      };
    return { txt: 'Poids du corps', sub: e.ratioCharge ? 'Tu déplaces ≈ ' + Math.round(w * e.ratioCharge) + ' kg' : 'Contrôle et gainage' };
  }
  const hi = it.reps ? it.reps[1] : 15;
  const rf = hi <= 6 ? 1.25 : hi <= 10 ? 1.1 : hi <= 12 ? 1 : hi <= 15 ? 0.8 : 0.65;
  const lf = [0.6, 1, 1.25][lvlN(p.level) - 1] * progFactor(p, now);
  let kg = w * e.ratioCharge * rf * lf;
  const step = e.materiel === 'hal' ? 1 : 2.5;
  kg = Math.max(e.materiel === 'bar' ? 20 : e.materiel === 'hal' ? 2 : 5, Math.round(kg / step) * step);
  return {
    txt: dec(kg) + ' kg' + (e.materiel === 'hal' && !e.uneHaltere ? ' par haltère' : ''),
    sub:
      'Pour ' + dec(w) + ' kg, ' + { deb: 'débutant', int: 'intermédiaire', adv: 'avancé' }[p.level] + ', sem. ' + progWeek(p, now),
    kg: e.materiel === 'hal' && !e.uneHaltere ? kg * 2 : kg,
  };
}

/** Répétitions « 8-12 » (rj() du prototype). */
export const rj = (r: readonly [number, number]) => (r[0] === r[1] ? String(r[0]) : r.join('-'));

/** « 3 × 8-12 reps • 20 kg par haltère • repos 75 s » (itemLine du prototype). */
export function itemLine(it: PlanItem, p: Profil): string {
  const vol = it.sec ? (it.sec >= 120 ? Math.round(it.sec / 60) + ' min' : it.sec + ' s') : rj(it.reps!) + ' reps';
  return `${it.sets} × ${vol} • ${loadFor(it, p).txt} • repos ${it.rest} s`;
}

/** Position (0–100 %) d'un nombre de reps sur la barre Force / Hypertrophie / Endurance (1 à 25 reps). */
export const zonePct = (v: number) => ((Math.min(25, Math.max(1, v)) - 1) / 24) * 100;

/** Nombre entier avec espace des milliers (fmt() du prototype). */
export const fmt = (n: number) => Math.round(n).toLocaleString('fr-CA').replace(/[  ,]/g, ' ');
