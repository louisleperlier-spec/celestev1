/**
 * Nouveautés annoncées après une mise à jour à distance (design 10K « Mise à jour d'app », oct. 2026) : à tenir à jour
 * à chaque publication. Fonctions pures, sans `@/data`.
 */
export type Nouveaute = { icone: 'chart' | 'flame' | 'star' | 'bell' | 'spark' | 'trophy'; titre: string; texte: string };

export const NOUVEAUTES: readonly Nouveaute[] = [
  { icone: 'bell', titre: "Ton chrono ne s'arrête plus", texte: 'Vélo, course et rando : le temps continue même écran verrouillé.' },
  { icone: 'chart', titre: 'Un Programme et un Profil refaits', texte: "Ta semaine en un coup d'œil, ta séance exercice par exercice." },
  { icone: 'spark', titre: 'De nouvelles illustrations', texte: 'Tes coachs à la salle, en étirements, en course et au lit.' },
];

/** Doit-on annoncer la mise à jour ? `vue` = dernière version annoncée sur l'appareil (null si jamais). */
export function doitAnnoncerMaj(id: string | null, vue: string | null, inscrit: boolean, versionDeLaBoutique: boolean): boolean {
  if (!id || id === vue || !inscrit) return false;
  // 1re ouverture de l'app telle qu'installée depuis l'App Store : rien de nouveau à annoncer.
  return !(vue === null && versionDeLaBoutique);
}
