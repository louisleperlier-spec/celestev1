// Archétype ai-feed — types.
// ADAPTER : renomme `Creation` et enrichis le résultat si ton IA renvoie plus qu'un texte
// (ex. un titre, des tags, une image URL) — pense à refléter ça dans l'edge function ET
// la table `creations`.

/** Une création générée par l'IA, gardée par l'utilisateur (table `creations`). */
export type Creation = {
  id: string;
  prompt: string;
  result: string;
  favorite: boolean;
  created_at: string;
};

/** Ce qu'on envoie à l'edge function `generate`. */
export type GenerateInput = {
  prompt: string;
  language: 'fr' | 'en';
};

/** Ce que renvoie l'edge function `generate`. */
export type GenerateResult = {
  refused: boolean;
  refusalReason?: string | null;
  text: string | null;
};
