export type DrinkType = 'water' | 'tea' | 'coffee' | 'juice' | 'soda' | 'other';

export const DRINK_TYPES: readonly DrinkType[] = ['water', 'tea', 'coffee', 'juice', 'soda', 'other'];

/** Part de la boisson qui hydrate réellement (le café/l'alcool hydratent moins qu'un volume égal d'eau). */
export const HYDRATION_FACTOR: Record<DrinkType, number> = {
  water: 1,
  tea: 0.95,
  coffee: 0.85,
  juice: 0.9,
  soda: 0.8,
  other: 0.85,
};

/** Boissons qui pèsent négativement sur la note Qualité au-delà d'une petite part du volume total. */
export const LOWERS_QUALITY: readonly DrinkType[] = ['coffee', 'soda'];

export type EntrySource = 'manual' | 'healthkit';

export interface HydrationEntry {
  id: string;
  volumeMl: number;
  drinkType: DrinkType;
  loggedAt: string; // ISO 8601
  source: EntrySource;
  /** UUID de l'échantillon HealthKit correspondant, quand Lume l'a écrit dans Apple Santé. */
  healthUUID?: string;
}

export type Grade = 'A' | 'B' | 'C';

export interface MetricScore {
  score: number; // 0-100
  grade: Grade;
}

export type MetricId = 'volume' | 'regularity' | 'timing' | 'quality';

export interface DayMetrics {
  volume: MetricScore;
  regularity: MetricScore;
  timing: MetricScore;
  quality: MetricScore;
}

export interface DayStats {
  date: string; // YYYY-MM-DD
  totalMl: number;
  hydratingMl: number;
  goalMl: number;
  entries: HydrationEntry[];
  metrics: DayMetrics;
  globalScore: number; // 0-100
  globalGrade: Grade;
}

export interface HydrationSettings {
  dailyGoalMl: number;
  healthSyncEnabled: boolean;
}

export const DEFAULT_SETTINGS: HydrationSettings = {
  dailyGoalMl: 2000,
  healthSyncEnabled: false,
};
