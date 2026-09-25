/**
 * La semaine de l'utilisateur : dates, séances du catalogue ajoutées au calendrier,
 * intensité modifiée, prochaine séance. Portage fidèle du prototype
 * (`weekDates`, `wkSeed`, `addedKey`, `catSession`, `sessionForDay`, `nextSession`, `addToWeek`).
 */
import { SEANCES } from '@/data/seances';
import type { Seance, SeanceId } from '@/data/types';

import { exercice, sesKcal, todayIdx, type Plan, type PlanItem, type PlanSession } from './plan';

export const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;

/** Intensité d'une séance du catalogue : −1 plus facile, 0 normal, +1 plus dur. */
export type Intensite = -1 | 0 | 1;

/** Séance affichable : du plan, ou du catalogue (`cat`), éventuellement une sortie vélo (`ride`). */
export type SeanceJour = Omit<PlanSession, 'key' | 'day'> & {
  key?: PlanSession['key'];
  day: number | null;
  cat?: SeanceId;
  ride?: number;
};

/** Contexte de la semaine (sous-ensemble de l'état `S`). */
export type Semaine = {
  plan: Plan;
  weight: number;
  /** Séances du catalogue ajoutées, par `addedKey`. */
  added: Partial<Record<string, SeanceId>>;
  wkMod: Partial<Record<SeanceId, Intensite>>;
  now?: Date;
};

/** Les 7 jours de la semaine en cours, du lundi au dimanche. */
export function weekDates(now: Date = new Date()): Date[] {
  const dow = (now.getDay() + 6) % 7;
  const m = new Date(now);
  m.setHours(0, 0, 0, 0);
  m.setDate(now.getDate() - dow);
  return [...Array(7)].map((_, i) => {
    const x = new Date(m);
    x.setDate(m.getDate() + i);
    return x;
  });
}

const wkSeed = (now?: Date) => {
  const m = weekDates(now)[0];
  return m.getFullYear() + '-' + m.getMonth() + '-' + m.getDate();
};

/** Clé d'une séance ajoutée : semaine + jour (elle ne vaut que pour cette semaine). */
export const addedKey = (i: number, now?: Date) => wkSeed(now) + ':' + i;

export const seanceById = (id: SeanceId): Seance => SEANCES.find((w) => w.id === id)!;

/** Séance du catalogue mise au format du plan, avec l'intensité choisie. */
export function catSession(w: Seance, day: number | null, weight: number, mod: Intensite = 0): SeanceJour {
  const items: PlanItem[] = w.ex.map((str) => {
    const [idS, se, r, re] = str.split(':');
    const id = idS as PlanItem['id'];
    const it: PlanItem = {
      id,
      sets: Math.max(1, +se + (exercice(id).groupe === 'cardio' && +se === 1 ? 0 : mod)),
      rest: Math.max(0, +re + (mod < 0 ? 15 : mod > 0 ? -10 : 0)),
    };
    if (r.endsWith('m')) it.sec = parseInt(r, 10) * 60;
    else if (r.endsWith('s')) it.sec = parseInt(r, 10);
    else {
      const p = r.split('-').map(Number);
      it.reps = [p[0], p[1] || p[0]];
    }
    it.tempo = it.sec ? 'Contrôlé' : it.reps![1] <= 6 ? '3-1-1' : it.reps![1] <= 12 ? '2-0-2' : '1-0-1';
    return it;
  });
  const s: SeanceJour = { titre: w.t, items, day, cat: w.id, ride: w.ride, min: 0, kcal: 0 };
  s.min =
    w.ride ||
    Math.round(3 + items.reduce((a, it) => a + it.sets * ((it.sec || ((it.reps![0] + it.reps![1]) / 2) * 3) + it.rest), 0) / 60);
  s.kcal = w.ride ? Math.round((w.ride * weight * 7) / 60) : sesKcal(s, weight);
  return s;
}

/** Séance prévue le jour i (0 = lundi) : une séance ajoutée remplace celle du plan. */
export function sessionForDay(sem: Semaine, i: number): SeanceJour | null {
  const a = sem.added[addedKey(i, sem.now)];
  if (a) {
    const w = SEANCES.find((x) => x.id === a);
    if (w) return catSession(w, i, sem.weight, sem.wkMod[w.id] ?? 0);
  }
  return sem.plan.sessions.find((s) => s.day === i) ?? null;
}

/** Prochaine séance à partir d'aujourd'hui (`offset` = jours d'écart). */
export function nextSession(sem: Semaine): { s: SeanceJour; offset: number } {
  const t = todayIdx(sem.now);
  for (let k = 0; k < 7; k++) {
    const s = sessionForDay(sem, (t + k) % 7);
    if (s) return { s, offset: k };
  }
  return { s: sem.plan.sessions[0] as SeanceJour, offset: 0 };
}

/** Premier jour libre à partir d'aujourd'hui (addToWeek) ; null s'il n'y en a pas. */
export function premierJourLibre(sem: Semaine): number | null {
  const t = todayIdx(sem.now);
  for (let k = 0; k < 7; k++) {
    const i = (t + k) % 7;
    if (i < t) continue;
    if (!sessionForDay(sem, i)) return i;
  }
  return null;
}
