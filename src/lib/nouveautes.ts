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
  { icone: 'trophy', titre: 'Un vrai passage de niveau', texte: 'Étoiles, étincelles et ton nouveau rang en grand : chaque niveau se fête.' },
  { icone: 'spark', titre: 'Ton coach sur l’Accueil', texte: 'Le mot du jour dans une nouvelle bulle, et « Demander à … » pour lui écrire en un geste.' },
  { icone: 'flame', titre: 'Axel ne te lâche plus 😤', texte: "Il te relance dans la journée jusqu'à ta séance. Tu peux le calmer dans Profil." },
  { icone: 'spark', titre: 'Le coach caméra', texte: 'Filme-toi : NÉA suit ton squelette, compte tes reps et corrige ta posture.', besoin: 'camera' },
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
