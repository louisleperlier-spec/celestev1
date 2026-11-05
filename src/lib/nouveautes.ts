/**
 * Nouveautés annoncées après une mise à jour à distance (design 10K « Mise à jour d'app », oct. 2026) : à tenir à jour
 * à chaque publication. Fonctions pures, sans `@/data`.
 */
export type Nouveaute = { icone: 'chart' | 'flame' | 'star' | 'bell' | 'spark' | 'trophy'; titre: string; texte: string };

export const NOUVEAUTES: readonly Nouveaute[] = [
  { icone: 'spark', titre: 'Des fiches exercice refaites', texte: 'Ton plan, le mouvement en 3 étapes, puis ce que ça travaille.' },
  { icone: 'star', titre: 'Zoome sur tes exercices', texte: "Touche l'image pour l'agrandir, et « Aa » pour des textes plus grands." },
  { icone: 'bell', titre: "Ton chrono ne s'arrête plus", texte: 'Vélo, course et rando : le temps continue même écran verrouillé.' },
  { icone: 'chart', titre: 'Un Programme et un Profil refaits', texte: "Ta semaine en un coup d'œil, ta séance exercice par exercice." },
];

/** Doit-on annoncer la mise à jour ? `vue` = dernière version annoncée sur l'appareil (null si jamais). */
export function doitAnnoncerMaj(id: string | null, vue: string | null, inscrit: boolean, versionDeLaBoutique: boolean): boolean {
  if (!id || id === vue || !inscrit) return false;
  // 1re ouverture de l'app telle qu'installée depuis l'App Store : rien de nouveau à annoncer.
  return !(vue === null && versionDeLaBoutique);
}
