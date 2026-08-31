import { CATEGORIES } from '@/constants/categories';
import { addDays, toDateKey } from '@/lib/date';
import type { CategoryId, DayScore, Entry, Grade } from '@/lib/types';

const EMPTY_BY_CATEGORY: Record<CategoryId, number> = {
  sleep: 0,
  sport: 0,
  discipline: 0,
  nutrition: 0,
  mindset: 0,
};

export function gradeForScore(total: number): Grade {
  if (total >= 80) return 'A';
  if (total >= 60) return 'B';
  if (total >= 40) return 'C';
  return 'D';
}

export const GRADE_LABEL: Record<Grade, string> = {
  A: 'Excellent',
  B: 'Bon travail',
  C: 'Peut mieux faire',
  D: 'Journée difficile',
};

/**
 * Le score du jour d'une catégorie = le meilleur effort loggé ce jour-là (0-20),
 * pas la somme : on récompense "as-tu fait ta meilleure action" plutôt que de
 * pouvoir gonfler le score en spammant des petites entrées.
 */
export function computeDayScore(dateKey: string, entriesForDay: Entry[]): DayScore {
  const byCategory: Record<CategoryId, number> = { ...EMPTY_BY_CATEGORY };
  for (const entry of entriesForDay) {
    if (entry.points > byCategory[entry.category]) {
      byCategory[entry.category] = entry.points;
    }
  }
  const total = CATEGORIES.reduce((sum, c) => sum + byCategory[c.id], 0);
  return { dateKey, total, grade: gradeForScore(total), byCategory };
}

export function groupEntriesByDate(entries: Entry[]): Map<string, Entry[]> {
  const map = new Map<string, Entry[]>();
  for (const e of entries) {
    const list = map.get(e.dateKey);
    if (list) list.push(e);
    else map.set(e.dateKey, [e]);
  }
  return map;
}

export function computeScoresForRange(entries: Entry[], start: Date, days: number): DayScore[] {
  const byDate = groupEntriesByDate(entries);
  const scores: DayScore[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    const key = toDateKey(d);
    scores.push(computeDayScore(key, byDate.get(key) ?? []));
  }
  return scores;
}

/**
 * Série de jours consécutifs (en partant d'aujourd'hui, ou d'hier si aujourd'hui
 * n'a pas encore de score) avec un grade >= B (score >= 60).
 */
export function computeCurrentStreak(entries: Entry[], today: Date): number {
  const byDate = groupEntriesByDate(entries);
  const todayKey = toDateKey(today);
  const todayScore = computeDayScore(todayKey, byDate.get(todayKey) ?? []);

  let cursor = today;
  if (todayScore.total < 60) {
    // Aujourd'hui pas encore réussi (ou pas fini) : on compte la série jusqu'à hier.
    cursor = addDays(today, -1);
  }

  let streak = 0;
  for (let i = 0; i < 3650; i++) {
    const key = toDateKey(addDays(cursor, -i));
    const score = computeDayScore(key, byDate.get(key) ?? []);
    if (score.total >= 60) streak++;
    else break;
  }
  return streak;
}

export function weakestCategory(dayScore: DayScore): CategoryId {
  let weakest: CategoryId = 'sleep';
  let min = Infinity;
  for (const c of CATEGORIES) {
    if (dayScore.byCategory[c.id] < min) {
      min = dayScore.byCategory[c.id];
      weakest = c.id;
    }
  }
  return weakest;
}

export function potentialScore(dayScore: DayScore): number {
  // Score atteignable si on comble juste la catégorie la plus faible du jour.
  const weakest = weakestCategory(dayScore);
  const gain = 20 - dayScore.byCategory[weakest];
  return Math.min(100, dayScore.total + gain);
}
