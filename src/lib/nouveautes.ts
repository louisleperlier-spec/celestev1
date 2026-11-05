/**
 * Nouveautés annoncées après une mise à jour à distance (design 10K « Mise à jour d'app », oct. 2026) : à tenir à jour
 * à chaque publication. Fonctions pures, sans `@/data`.
 */
export type Nouveaute = {
  icone: 'chart' | 'flame' | 'star' | 'bell' | 'spark' | 'trophy';
  titre: string;
  texte: string;
  /** Module natif nécessaire (build 35+) : l'annonce est cachée sur les builds qui ne l'ont pas. */
  besoin?: 'camera' | 'gpsFond';
};

export const NOUVEAUTES: readonly Nouveaute[] = [
  { icone: 'trophy', titre: 'Axel illustre tes 50 exercices', texte: 'Une nouvelle bibliothèque : chaque mouvement montré par Axel, muscles en surbrillance.' },
  { icone: 'spark', titre: 'Le coach caméra', texte: 'Filme-toi : NÉA suit ton squelette, compte tes reps et corrige ta posture.', besoin: 'camera' },
  { icone: 'bell', titre: 'Ta sortie suit même écran verrouillé', texte: 'Vélo, course et rando : le chrono et le GPS continuent.', besoin: 'gpsFond' },
  { icone: 'flame', titre: 'Une séance en cours refaite', texte: "L'exercice en grand, un gros bouton pour valider ta série." },
  { icone: 'star', titre: 'Zoome sur tes exercices', texte: "Touche l'image pour l'agrandir, et « Aa » pour des textes plus grands." },
];

/** Nouveautés disponibles sur ce build (`dispo` = modules natifs présents). */
export function nouveautesDispo(dispo: { camera: boolean; gpsFond: boolean }): Nouveaute[] {
  return NOUVEAUTES.filter((n) => !n.besoin || dispo[n.besoin]);
}

/** Doit-on annoncer la mise à jour ? `vue` = dernière version annoncée sur l'appareil (null si jamais). */
export function doitAnnoncerMaj(id: string | null, vue: string | null, inscrit: boolean, versionDeLaBoutique: boolean): boolean {
  if (!id || id === vue || !inscrit) return false;
  // 1re ouverture de l'app telle qu'installée depuis l'App Store : rien de nouveau à annoncer.
  return !(vue === null && versionDeLaBoutique);
}
