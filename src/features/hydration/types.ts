export type BuiltInDrinkType = 'water' | 'tea' | 'coffee' | 'juice' | 'soda' | 'other';
export type DrinkType = BuiltInDrinkType | 'custom';

export const DRINK_TYPES: readonly BuiltInDrinkType[] = ['water', 'tea', 'coffee', 'juice', 'soda', 'other'];

/** Part de la boisson qui hydrate réellement (le café/l'alcool hydratent moins qu'un volume égal d'eau). */
export const HYDRATION_FACTOR: Record<BuiltInDrinkType, number> = {
  water: 1,
  tea: 0.95,
  coffee: 0.85,
  juice: 0.9,
  soda: 0.8,
  other: 0.85,
};

/** Boissons qui pèsent négativement sur la note Qualité au-delà d'une petite part du volume total. */
export const LOWERS_QUALITY: readonly BuiltInDrinkType[] = ['coffee', 'soda'];

export type EntrySource = 'manual' | 'healthkit';

export interface HydrationEntry {
  id: string;
  volumeMl: number;
  drinkType: DrinkType;
  loggedAt: string; // ISO 8601
  source: EntrySource;
  /** UUID de l'échantillon HealthKit correspondant, quand Lume l'a écrit dans Apple Santé. */
  healthUUID?: string;
  /** Renseignés uniquement quand drinkType === 'custom' — copiés depuis la boisson personnalisée au moment de la saisie. */
  customDrinkName?: string;
  customHydrationFactor?: number; // 0-1
  customLowersQuality?: boolean;
}

/** Boisson personnalisée (premium) — définie une fois, réutilisable pour chaque entrée. */
export interface CustomDrink {
  id: string;
  name: string;
  hydrationFactor: number; // 0-1
  lowersQuality: boolean;
}

export type Grade = 'A' | 'B' | 'C' | 'D';

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
  adaptiveGoalEnabled: boolean;
}

export const DEFAULT_SETTINGS: HydrationSettings = {
  dailyGoalMl: 2000,
  healthSyncEnabled: false,
  adaptiveGoalEnabled: false,
};
