import { computeGlobalScore, gradeFromScore } from '@/features/hydration/scoring';
import { DayMetrics, DayStats, MetricId } from '@/features/hydration/types';

/**
 * Moteur de règles du Coach — 100 % déterministe, zéro IA dans le choix. L'IA (ai-copy.ts)
 * n'intervient qu'après coup, pour reformuler le "pourquoi" de ce que ces règles ont choisi.
 */

export type PriorityActionKind = 'drink' | 'diversify' | 'spreadOut' | 'startEarlier' | 'reduceLate' | 'maintain' | 'moveBody';

export interface PriorityAction {
  kind: PriorityActionKind;
  targetMl: number | null;
  deadlineHour: number | null;
  potentialPoints: number;
}

const WEAK_THRESHOLD = 70;
const GOOD_THRESHOLD = 85;

const ACTION_METRIC: Record<PriorityActionKind, MetricId | null> = {
  drink: 'volume',
  diversify: 'quality',
  spreadOut: 'regularity',
  startEarlier: 'timing',
  reduceLate: 'timing',
  maintain: null,
  moveBody: null,
};

function nextCheckpointHour(now: Date): number {
  const hour = now.getHours();
  if (hour < 12) return 12;
  if (hour < 15) return 15;
  if (hour < 19) return 19;
  return 21;
}

/** Estime le score atteignable sur une métrique si l'action recommandée est suivie : referme 60 % de l'écart à 100. */
function projectedMetricScore(currentScore: number): number {
  return Math.min(100, Math.round(currentScore + (100 - currentScore) * 0.6));
}

function potentialPointsFor(metrics: DayMetrics, targetMetric: MetricId | null): number {
  if (!targetMetric) return 0;
  const current = metrics[targetMetric];
  const projectedScore = projectedMetricScore(current.score);
  const hypothetical: DayMetrics = {
    ...metrics,
    [targetMetric]: { score: projectedScore, grade: gradeFromScore(projectedScore) },
  };
  const currentGlobal = computeGlobalScore(metrics);
  const projectedGlobal = computeGlobalScore(hypothetical);
  return Math.max(0, projectedGlobal - currentGlobal);
}

function buildAction(kind: PriorityActionKind, metrics: DayMetrics, extra?: Partial<PriorityAction>): PriorityAction {
  return {
    kind,
    targetMl: null,
    deadlineHour: null,
    potentialPoints: potentialPointsFor(metrics, ACTION_METRIC[kind]),
    ...extra,
  };
}

/**
 * Choisit LA priorité du jour, dans l'ordre d'importance des métriques (Volume 40 %, Qualité
 * 25 %, Régularité 20 %, Timing 15 %) : la première métrique sous le seuil "faible" gagne.
 */
export function choosePriorityAction(today: DayStats, now: Date = new Date()): PriorityAction {
  const { metrics, goalMl, hydratingMl } = today;

  if (metrics.volume.score < WEAK_THRESHOLD) {
    const remainingMl = Math.max(150, Math.round(Math.min(Math.max(goalMl - hydratingMl, 150), 500) / 50) * 50);
    return buildAction('drink', metrics, { targetMl: remainingMl, deadlineHour: nextCheckpointHour(now) });
  }
  if (metrics.quality.score < WEAK_THRESHOLD) {
    return buildAction('diversify', metrics);
  }
  if (metrics.regularity.score < WEAK_THRESHOLD) {
    return buildAction('spreadOut', metrics);
  }
  if (metrics.timing.score < WEAK_THRESHOLD) {
    return buildAction(today.entries.length === 0 ? 'startEarlier' : 'reduceLate', metrics);
  }
  if (today.globalScore >= GOOD_THRESHOLD) {
    // Tout est déjà bon : nudge générique, non lié aux données trackées par Lume.
    return buildAction('moveBody', metrics, { potentialPoints: 2 });
  }
  return buildAction('maintain', metrics, { potentialPoints: 2 });
}

export interface ScorePotential {
  current: number;
  potential: number;
}

export function computeScorePotential(today: DayStats, action: PriorityAction): ScorePotential {
  return { current: today.globalScore, potential: Math.min(100, today.globalScore + action.potentialPoints) };
}

export type MissionId = 'drinkGoal' | 'walk' | 'noAddedSugar';

export interface Mission {
  id: MissionId;
  kind: 'auto' | 'manual';
  done: boolean;
  progress: number; // 0-1
}

export interface ManualMissionState {
  walked: boolean;
  noAddedSugar: boolean;
}

export const DEFAULT_MANUAL_MISSION_STATE: ManualMissionState = { walked: false, noAddedSugar: false };

/**
 * 3 missions du jour. Une seule ("boire son objectif") est mesurée par Lume ; les deux autres
 * n'ont rien qui les vérifie (pas de podomètre, pas de suivi alimentaire) — elles sont
 * honnêtement auto-déclarées par l'utilisateur, pas "trackées".
 */
export function buildMissions(today: DayStats, manual: ManualMissionState): Mission[] {
  const drinkProgress = today.goalMl > 0 ? Math.min(1, today.hydratingMl / today.goalMl) : 0;
  return [
    { id: 'drinkGoal', kind: 'auto', done: drinkProgress >= 1, progress: drinkProgress },
    { id: 'walk', kind: 'manual', done: manual.walked, progress: manual.walked ? 1 : 0 },
    { id: 'noAddedSugar', kind: 'manual', done: manual.noAddedSugar, progress: manual.noAddedSugar ? 1 : 0 },
  ];
}
