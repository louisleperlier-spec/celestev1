import type { SFSymbol } from 'sf-symbols-typescript';

/**
 * Routines guidées — étapes de bien-être générique (pas de promesse médicale), dans le même
 * esprit que `content.ts` (recipes/activity/recovery) : un aperçu court, pas un catalogue. Les
 * textes (titre/sous-titre/étapes) vivent en i18n sous `coach.routines.<id>.*`.
 */

export type RoutineId = 'morning' | 'evening';

export interface Routine {
  id: RoutineId;
  icon: SFSymbol;
  durationMinutes: number;
  stepCount: number;
}

export const ROUTINES: Routine[] = [
  { id: 'morning', icon: 'sunrise.fill', durationMinutes: 5, stepCount: 6 },
  { id: 'evening', icon: 'moon.stars.fill', durationMinutes: 8, stepCount: 7 },
];

export function findRoutine(id: string): Routine | undefined {
  return ROUTINES.find((r) => r.id === id);
}
