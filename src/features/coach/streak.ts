import { DayStats } from '@/features/hydration/types';

const STREAK_THRESHOLD = 70;

/**
 * Nombre de jours consécutifs (en remontant depuis aujourd'hui) avec au moins une entrée loggée
 * et un score global ≥ seuil. Calculé sur des données réelles, jamais fictif — un jour sans
 * entrée casse la série, un jour loggé mais faible aussi.
 */
export function computeStreak(days: DayStats[], threshold: number = STREAK_THRESHOLD): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i];
    if (day.entries.length === 0 || day.globalScore < threshold) break;
    streak++;
  }
  return streak;
}
