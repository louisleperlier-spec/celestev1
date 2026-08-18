import { DayStats, MetricId } from '@/features/hydration/types';

export interface WeeklyInsight {
  metric: MetricId;
  averageScore: number;
}

const METRIC_ORDER: MetricId[] = ['volume', 'quality', 'regularity', 'timing'];

/**
 * "Insight du jour" — pas de l'IA, juste une moyenne sur les 7 derniers jours loggés : quelle
 * métrique tire le score global vers le bas en moyenne. `null` s'il n'y a pas encore assez de
 * données (aucun jour loggé) pour dire quoi que ce soit d'honnête.
 */
export function computeWeeklyInsight(days: DayStats[]): WeeklyInsight | null {
  const loggedDays = days.filter((day) => day.entries.length > 0);
  if (loggedDays.length === 0) return null;

  const totals: Record<MetricId, number> = { volume: 0, regularity: 0, timing: 0, quality: 0 };
  for (const day of loggedDays) {
    for (const id of METRIC_ORDER) totals[id] += day.metrics[id].score;
  }

  const averages = METRIC_ORDER.map((id) => ({ id, avg: totals[id] / loggedDays.length }));
  averages.sort((a, b) => a.avg - b.avg);
  const weakest = averages[0];
  return { metric: weakest.id, averageScore: Math.round(weakest.avg) };
}
