export type CategoryId = 'sleep' | 'sport' | 'discipline' | 'nutrition' | 'mindset';

export type Grade = 'A' | 'B' | 'C' | 'D';

export type Entry = {
  id: string;
  category: CategoryId;
  presetId: string;
  label: string;
  points: number; // 0-20, effort de l'action loggée
  note?: string;
  createdAt: string; // ISO timestamp
  dateKey: string; // YYYY-MM-DD (jour local de l'entrée)
};

export type DayScore = {
  dateKey: string;
  total: number; // 0-100
  grade: Grade;
  byCategory: Record<CategoryId, number>; // 0-20 chacune
};
