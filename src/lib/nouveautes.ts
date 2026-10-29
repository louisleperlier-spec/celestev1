/**
 * Nouveautés annoncées après une mise à jour à distance (design 10K « Mise à jour d'app », oct. 2026) : à tenir à jour
 * à chaque publication. Fonctions pures, sans `@/data`.
 */
export type Nouveaute = { icone: 'chart' | 'flame' | 'star' | 'bell' | 'spark' | 'trophy'; titre: string; texte: string };

export const NOUVEAUTES: readonly Nouveaute[] = [
  { icone: 'chart', titre: 'Tes progrès en graphiques', texte: 'Séances, temps actif, sommeil, VFC et poids, avec leur évolution.' },
  { icone: 'flame', titre: 'Ta série en flamme', texte: "Ta série du moment s'affiche en haut de l'Accueil." },
  { icone: 'bell', titre: 'Les nouveautés à chaque mise à jour', texte: 'NÉA te dit ce qui change dès que ta version est mise à jour.' },
];

/** Doit-on annoncer la mise à jour ? `vue` = dernière version annoncée sur l'appareil (null si jamais). */
export function doitAnnoncerMaj(id: string | null, vue: string | null, inscrit: boolean, versionDeLaBoutique: boolean): boolean {
  if (!id || id === vue || !inscrit) return false;
  // 1re ouverture de l'app telle qu'installée depuis l'App Store : rien de nouveau à annoncer.
  return !(vue === null && versionDeLaBoutique);
}
