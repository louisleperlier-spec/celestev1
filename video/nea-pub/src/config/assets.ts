/**
 * Fichiers attendus dans `public/`. Les captures sont de vraies captures de l'app NÉA (rendu web de l'app,
 * profil de démonstration) : on les recadre et on zoome, sans jamais redessiner l'interface.
 * Coordonnées des zones en pixels de l'image source (largeur 1290).
 */
export const ASSETS = {
  mascotte: { fichier: 'mascotte-nea.png', largeur: 557, hauteur: 900 },
  police: 'fonts/Inter.woff2',
  captures: {
    accueil: { fichier: 'captures/accueil.png', largeur: 1290, hauteur: 3750 },
    programme: { fichier: 'captures/programme.png', largeur: 1290, hauteur: 3150 },
    progres: { fichier: 'captures/progres.png', largeur: 1290, hauteur: 2900 },
  },
  audio: {
    voix: (i: number) => `audio/voix_${i}.wav`,
    /** Voix off complète facultative : si présente, elle remplace les lignes ci-dessus (voir README). */
    voixComplete: 'audio/voiceover.wav',
    musique: 'audio/musique.wav',
    clic: 'audio/clic.wav',
    glisse: 'audio/glisse.wav',
    pop: 'audio/pop.wav',
  },
} as const;

export type Zone = { x: number; y: number; l: number; h: number };

/** Zones repérées dans les captures. */
export const ZONES = {
  programme: {
    haut: { x: 0, y: 0, l: 1290, h: 1950 } as Zone,
    masse: { x: 40, y: 600, l: 1210, h: 340 } as Zone,
    seance: { x: 40, y: 1050, l: 1210, h: 1340 } as Zone,
    liste: { x: 40, y: 1560, l: 1210, h: 600 } as Zone,
    seriesReps: { x: 950, y: 1590, l: 220, h: 540 } as Zone,
  },
  progres: {
    haut: { x: 0, y: 0, l: 1290, h: 1950 } as Zone,
    ascension: { x: 40, y: 390, l: 1210, h: 1150 } as Zone,
    barre: { x: 40, y: 1300, l: 1210, h: 230 } as Zone,
  },
  accueil: {
    /** Du message du coach jusqu'à « Ta prochaine séance » (Bas du corps, Voir la séance). */
    seance: { x: 0, y: 1580, l: 1290, h: 1840 } as Zone,
  },
} as const;

/**
 * Source de la voix off : `lignes` = les 7 fichiers voix_<n>.wav (générés par scripts/voix.py, recalés sur chaque scène) ;
 * `complete` = un seul fichier public/audio/voiceover.wav posé à 0 s ; `aucune` = vidéo sans voix (prévisualisation).
 */
export const VOIX_SOURCE: 'lignes' | 'complete' | 'aucune' = 'lignes';
