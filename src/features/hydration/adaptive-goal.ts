import { DayStats } from './types';

/**
 * Objectif adaptatif (premium) — pas d'IA, pas de médical : juste la moyenne de ce que
 * l'utilisateur boit réellement les jours où il boit, recalculée chaque jour.
 */

const MIN_ADAPTIVE_GOAL_ML = 1200;
const MAX_ADAPTIVE_GOAL_ML = 4000;
const ADAPTIVE_WINDOW_DAYS = 14;
const MIN_DAYS_WITH_DATA = 3;
const ROUND_STEP_ML = 50;

/** `recentDays` doit couvrir au moins `ADAPTIVE_WINDOW_DAYS` jours (les plus anciens en premier). */
export function computeAdaptiveGoal(recentDays: readonly DayStats[], fallbackGoalMl: number): number {
  const withData = recentDays.filter((d) => d.entries.length > 0).slice(-ADAPTIVE_WINDOW_DAYS);
  if (withData.length < MIN_DAYS_WITH_DATA) return fallbackGoalMl;

  const average = withData.reduce((sum, d) => sum + d.hydratingMl, 0) / withData.length;
  const rounded = Math.round(average / ROUND_STEP_ML) * ROUND_STEP_ML;
  return Math.min(MAX_ADAPTIVE_GOAL_ML, Math.max(MIN_ADAPTIVE_GOAL_ML, rounded));
}
