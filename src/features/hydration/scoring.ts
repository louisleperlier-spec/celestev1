import { DayMetrics, DayStats, Grade, HYDRATION_FACTOR, HydrationEntry, LOWERS_QUALITY, MetricScore } from './types';

const DEFAULT_CUSTOM_HYDRATION_FACTOR = 0.85;

function hydrationFactorFor(entry: HydrationEntry): number {
  if (entry.drinkType === 'custom') return entry.customHydrationFactor ?? DEFAULT_CUSTOM_HYDRATION_FACTOR;
  return HYDRATION_FACTOR[entry.drinkType];
}

function lowersQualityFor(entry: HydrationEntry): boolean {
  if (entry.drinkType === 'custom') return entry.customLowersQuality ?? false;
  return LOWERS_QUALITY.includes(entry.drinkType);
}

/**
 * Moteur de notation — pur, testable, sans dépendance à React ni au storage.
 * 4 métriques (Volume, Régularité, Timing, Qualité) donnent chacune une note 0-100 + une lettre
 * A/B/C, combinées en une note globale /100 pondérée.
 */

export const WEIGHTS = {
  volume: 0.4,
  regularity: 0.2,
  timing: 0.15,
  quality: 0.25,
} as const;

const GRADE_THRESHOLDS = { A: 80, B: 60, C: 40 } as const;

export function gradeFromScore(score: number): Grade {
  if (score >= GRADE_THRESHOLDS.A) return 'A';
  if (score >= GRADE_THRESHOLDS.B) return 'B';
  if (score >= GRADE_THRESHOLDS.C) return 'C';
  return 'D';
}

function toMetric(score: number): MetricScore {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return { score: clamped, grade: gradeFromScore(clamped) };
}

export function hydratingVolume(entries: readonly HydrationEntry[]): number {
  return entries.reduce((sum, e) => sum + e.volumeMl * hydrationFactorFor(e), 0);
}

export function totalVolume(entries: readonly HydrationEntry[]): number {
  return entries.reduce((sum, e) => sum + e.volumeMl, 0);
}

/** Métrique Volume : part de l'objectif quotidien atteinte (volume hydratant). */
export function computeVolumeMetric(entries: readonly HydrationEntry[], goalMl: number): MetricScore {
  if (goalMl <= 0) return toMetric(0);
  const ratio = hydratingVolume(entries) / goalMl;
  return toMetric(ratio * 100);
}

const WAKE_START_HOUR = 7;
const WAKE_END_HOUR = 23;
const WINDOW_COUNT = 4;
const WINDOW_SPAN_HOURS = (WAKE_END_HOUR - WAKE_START_HOUR) / WINDOW_COUNT;

/** Métrique Régularité : l'hydratation est-elle étalée dans la journée, ou concentrée d'un coup ? */
export function computeRegularityMetric(entries: readonly HydrationEntry[], now: Date = new Date()): MetricScore {
  if (entries.length === 0) return toMetric(0);

  const hours = entries.map((e) => new Date(e.loggedAt).getHours() + new Date(e.loggedAt).getMinutes() / 60);
  const windowsHit = new Set<number>();
  for (const h of hours) {
    if (h < WAKE_START_HOUR || h >= WAKE_END_HOUR) continue;
    windowsHit.add(Math.floor((h - WAKE_START_HOUR) / WINDOW_SPAN_HOURS));
  }
  const coverageScore = (windowsHit.size / WINDOW_COUNT) * 70;

  const sorted = [...hours].sort((a, b) => a - b);
  const nowHour = Math.min(now.getHours() + now.getMinutes() / 60, WAKE_END_HOUR);
  const points = [WAKE_START_HOUR, ...sorted.filter((h) => h >= WAKE_START_HOUR && h <= WAKE_END_HOUR), nowHour].sort(
    (a, b) => a - b,
  );
  let maxGap = 0;
  for (let i = 1; i < points.length; i++) {
    maxGap = Math.max(maxGap, points[i] - points[i - 1]);
  }
  const gapBonus = maxGap <= 4 ? 30 : maxGap <= 6 ? 15 : 0;

  return toMetric(coverageScore + gapBonus);
}

const EARLY_HOUR_STRICT = 10;
const EARLY_HOUR_LOOSE = 12;
const LATE_HOUR = 21;

/** Métrique Timing : démarrer tôt, éviter de tout boire juste avant le coucher. */
export function computeTimingMetric(entries: readonly HydrationEntry[]): MetricScore {
  if (entries.length === 0) return toMetric(0);

  const sorted = [...entries].sort(
    (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime(),
  );
  const firstHour = new Date(sorted[0].loggedAt).getHours() + new Date(sorted[0].loggedAt).getMinutes() / 60;
  const startBonus = firstHour < EARLY_HOUR_STRICT ? 50 : firstHour < EARLY_HOUR_LOOSE ? 30 : 10;

  const total = totalVolume(entries);
  const lateMl = entries
    .filter((e) => new Date(e.loggedAt).getHours() >= LATE_HOUR)
    .reduce((sum, e) => sum + e.volumeMl, 0);
  const lateRatio = total > 0 ? lateMl / total : 0;
  const eveningBonus = 50 * (1 - lateRatio);

  return toMetric(startBonus + eveningBonus);
}

const QUALITY_ALLOWANCE_RATIO = 0.2;

/** Métrique Qualité : part de boissons qui hydratent moins bien (café, soda…) dans le total. */
export function computeQualityMetric(entries: readonly HydrationEntry[]): MetricScore {
  if (entries.length === 0) return toMetric(0);

  const total = totalVolume(entries);
  const lowQualityMl = entries.filter(lowersQualityFor).reduce((sum, e) => sum + e.volumeMl, 0);
  const ratio = total > 0 ? lowQualityMl / total : 0;
  const overshoot = Math.max(0, ratio - QUALITY_ALLOWANCE_RATIO);
  const score = 100 - (overshoot / (1 - QUALITY_ALLOWANCE_RATIO)) * 100;

  return toMetric(score);
}

export function computeDayMetrics(entries: readonly HydrationEntry[], goalMl: number, now?: Date): DayMetrics {
  return {
    volume: computeVolumeMetric(entries, goalMl),
    regularity: computeRegularityMetric(entries, now),
    timing: computeTimingMetric(entries),
    quality: computeQualityMetric(entries),
  };
}

export function computeGlobalScore(metrics: DayMetrics): number {
  const weighted =
    metrics.volume.score * WEIGHTS.volume +
    metrics.regularity.score * WEIGHTS.regularity +
    metrics.timing.score * WEIGHTS.timing +
    metrics.quality.score * WEIGHTS.quality;
  return Math.max(0, Math.min(100, Math.round(weighted)));
}

export function computeDayStats(date: string, entries: readonly HydrationEntry[], goalMl: number, now?: Date): DayStats {
  const metrics = computeDayMetrics(entries, goalMl, now);
  const globalScore = computeGlobalScore(metrics);
  return {
    date,
    totalMl: totalVolume(entries),
    hydratingMl: Math.round(hydratingVolume(entries)),
    goalMl,
    entries: [...entries],
    metrics,
    globalScore,
    globalGrade: gradeFromScore(globalScore),
  };
}
