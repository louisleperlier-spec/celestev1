import { PILLARS } from '@/constants/piliers';
import { addDays, toDateKey } from '@/lib/date';
import type { CheckIn, CheckInStatus, DayScore, PillarId } from '@/lib/types';

const EMPTY_BY_PILLAR: Record<PillarId, number> = {
  physique: 0,
  apparence: 0,
  energie: 0,
  discipline: 0,
  mental: 0,
};

export const POINTS_FOR_STATUS: Record<CheckInStatus, number> = {
  missed: 0,
  partial: 50,
  done: 100,
};

/** Fenêtre glissante sur laquelle se calcule le score d'un pilier. */
export const ROLLING_WINDOW_DAYS = 14;

/**
 * Score d'un pilier à une date donnée (0-100) = moyenne de ses check-ins sur les
 * `windowDays` jours précédents (bornes incluses). Les jours sans check-in pour ce
 * pilier sont ignorés (pas comptés comme 0) : un utilisateur qui vient de commencer
 * n'est pas plombé par l'historique qu'il n'a pas encore eu l'occasion de remplir.
 */
export function pillarScoreAsOf(
  pillar: PillarId,
  checkIns: CheckIn[],
  date: Date,
  windowDays: number = ROLLING_WINDOW_DAYS
): number {
  const startKey = toDateKey(addDays(date, -(windowDays - 1)));
  const endKey = toDateKey(date);
  const relevant = checkIns.filter(
    (c) => c.pillar === pillar && c.dateKey >= startKey && c.dateKey <= endKey
  );
  if (relevant.length === 0) return 0;
  const sum = relevant.reduce((s, c) => s + POINTS_FOR_STATUS[c.status], 0);
  return Math.round(sum / relevant.length);
}

export function allPillarScoresAsOf(checkIns: CheckIn[], date: Date): Record<PillarId, number> {
  const result = { ...EMPTY_BY_PILLAR };
  for (const p of PILLARS) result[p.id] = pillarScoreAsOf(p.id, checkIns, date);
  return result;
}

/** Le Max Score du jour = moyenne des 5 piliers, arrondie. */
export function computeDayScore(checkIns: CheckIn[], date: Date): DayScore {
  const byPillar = allPillarScoresAsOf(checkIns, date);
  const total = Math.round(
    PILLARS.reduce((sum, p) => sum + byPillar[p.id], 0) / PILLARS.length
  );
  return { dateKey: toDateKey(date), total, grade: gradeForScore(total), byPillar };
}

export function gradeForScore(total: number): 'A' | 'B' | 'C' | 'D' {
  if (total >= 80) return 'A';
  if (total >= 60) return 'B';
  if (total >= 40) return 'C';
  return 'D';
}

/** Une journée "compte" pour la série si au moins une mission a été faite ou partielle. */
function dayCountsForStreak(checkIns: CheckIn[], dateKey: string): boolean {
  return checkIns.some((c) => c.dateKey === dateKey && c.status !== 'missed');
}

export function computeCurrentStreak(checkIns: CheckIn[], today: Date): number {
  let cursor = today;
  if (!dayCountsForStreak(checkIns, toDateKey(today))) {
    cursor = addDays(today, -1);
  }
  let streak = 0;
  for (let i = 0; i < 3650; i++) {
    const key = toDateKey(addDays(cursor, -i));
    if (dayCountsForStreak(checkIns, key)) streak++;
    else break;
  }
  return streak;
}

export function weakestPillar(dayScore: DayScore): PillarId {
  let weakest: PillarId = 'physique';
  let min = Infinity;
  for (const p of PILLARS) {
    if (dayScore.byPillar[p.id] < min) {
      min = dayScore.byPillar[p.id];
      weakest = p.id;
    }
  }
  return weakest;
}

/**
 * Simule : "si je termine dès maintenant la mission de ce pilier", quel serait le
 * nouveau Max Score du jour ? Utilisé par le Coach / Plan pour afficher le gain
 * potentiel et motiver à cocher la dernière mission faible.
 */
export function simulateCompletion(checkIns: CheckIn[], pillar: PillarId, today: Date): number {
  const dateKey = toDateKey(today);
  const withoutTodayForPillar = checkIns.filter(
    (c) => !(c.pillar === pillar && c.dateKey === dateKey)
  );
  const hypothetical: CheckIn[] = [
    ...withoutTodayForPillar,
    {
      id: 'simulated',
      missionId: 'simulated',
      pillar,
      status: 'done',
      createdAt: today.toISOString(),
      dateKey,
    },
  ];
  return computeDayScore(hypothetical, today).total;
}

export function scoreHistory(checkIns: CheckIn[], days: number, end: Date): DayScore[] {
  const start = addDays(end, -(days - 1));
  const history: DayScore[] = [];
  for (let i = 0; i < days; i++) {
    history.push(computeDayScore(checkIns, addDays(start, i)));
  }
  return history;
}
