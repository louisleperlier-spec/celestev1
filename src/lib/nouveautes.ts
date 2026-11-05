/**
 * Nouveautés annoncées après une mise à jour à distance (design 10K « Mise à jour d'app », oct. 2026) : à tenir à jour
 * à chaque publication. Fonctions pures, sans `@/data`.
 */
export type Nouveaute = { icone: 'chart' | 'flame' | 'star' | 'bell' | 'spark' | 'trophy'; titre: string; texte: string };

export const NOUVEAUTES: readonly Nouveaute[] = [
  { icone: 'spark', titre: 'Le coach caméra', texte: 'Filme-toi : NÉA suit ton squelette, compte tes reps et corrige ta posture.' },
  { icone: 'bell', titre: 'Ta sortie suit même écran verrouillé', texte: 'Vélo, course et rando : le chrono et le GPS continuent.' },
  { icone: 'flame', titre: 'Une séance en cours refaite', texte: "L'exercice en grand, un gros bouton pour valider ta série." },
  { icone: 'star', titre: 'Zoome sur tes exercices', texte: "Touche l'image pour l'agrandir, et « Aa » pour des textes plus grands." },
];

/** Doit-on annoncer la mise à jour ? `vue` = dernière version annoncée sur l'appareil (null si jamais). */
export function doitAnnoncerMaj(id: string | null, vue: string | null, inscrit: boolean, versionDeLaBoutique: boolean): boolean {
  if (!id || id === vue || !inscrit) return false;
  // 1re ouverture de l'app telle qu'installée depuis l'App Store : rien de nouveau à annoncer.
  return !(vue === null && versionDeLaBoutique);
}
