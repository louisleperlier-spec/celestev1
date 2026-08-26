// Archétype tracker-streak — types.
// ADAPTER : renomme `Habit` (Goal, Practice, Ritual…) et enrichis si besoin.

/** Une chose à suivre (table `habits`). */
export type Habit = {
  id: string;
  name: string;
  created_at: string;
};

/** Une coche journalière (table `habit_entries`). `day` au format YYYY-MM-DD. */
export type HabitEntry = {
  id: string;
  habit_id: string;
  day: string;
  created_at: string;
};

/** Habit enrichie côté client : jours cochés + streak + état du jour (calculés, non stockés). */
export type HabitWithStats = Habit & {
  days: string[]; // jours cochés (YYYY-MM-DD)
  streak: number; // jours consécutifs jusqu'à aujourd'hui
  doneToday: boolean;
};
