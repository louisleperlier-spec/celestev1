import { ActivityLevel, SleepBucket } from './onboarding-types';

/**
 * Première estimation de l'objectif quotidien (ml) à partir du poids, du niveau d'activité et du
 * sommeil déclarés à l'onboarding — un repère de bien-être courant (30-35 ml/kg + bonus activité),
 * pas un calcul médical. Purement indicatif : ajustable à tout moment dans Réglages, et remplacé
 * automatiquement par l'objectif adaptatif (premium) une fois assez de données réelles collectées.
 */

const ML_PER_KG = 32;
const ACTIVITY_BONUS_ML: Record<ActivityLevel, number> = { sedentary: 0, moderate: 300, active: 600 };
const SHORT_SLEEP_BONUS_ML = 150;

const MIN_GOAL_ML = 1200;
const MAX_GOAL_ML = 4000;
const ROUND_STEP_ML = 50;

export function estimateDailyGoalMl(weightKg: number, activity: ActivityLevel, sleep: SleepBucket): number {
  const base = weightKg * ML_PER_KG + ACTIVITY_BONUS_ML[activity] + (sleep === 'short' ? SHORT_SLEEP_BONUS_ML : 0);
  const rounded = Math.round(base / ROUND_STEP_ML) * ROUND_STEP_ML;
  return Math.min(MAX_GOAL_ML, Math.max(MIN_GOAL_ML, rounded));
}
