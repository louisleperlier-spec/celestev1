// Archétype timer-session — types.
// ADAPTER : renomme `Session` et ajoute tes champs (type de séance, ressenti, notes…).

/** Une séance terminée, gardée dans l'historique (table `sessions`). */
export type Session = {
  id: string;
  label: string | null;
  duration_seconds: number;
  completed_at: string;
};

/** Ce qu'on enregistre à la fin d'une séance. */
export type SessionInput = {
  label?: string | null;
  duration_seconds: number;
};
