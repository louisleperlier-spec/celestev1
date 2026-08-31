export type PillarId = 'physique' | 'apparence' | 'energie' | 'discipline' | 'mental';

export type Grade = 'A' | 'B' | 'C' | 'D';

export type CheckInStatus = 'missed' | 'partial' | 'done';

export type CheckIn = {
  id: string;
  missionId: string;
  pillar: PillarId;
  status: CheckInStatus;
  note?: string;
  createdAt: string; // ISO timestamp
  dateKey: string; // YYYY-MM-DD (jour local du check-in)
};

export type DayScore = {
  dateKey: string;
  total: number; // 0-100
  grade: Grade;
  byPillar: Record<PillarId, number>; // 0-20 chacun
};

export type ScanEntry = {
  id: string;
  dateKey: string;
  createdAt: string;
  weightKg?: number;
  bodyFatPct?: number;
  waistCm?: number;
  note?: string;
  photoUri?: string;
};
