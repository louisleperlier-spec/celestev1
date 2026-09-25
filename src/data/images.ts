// Généré depuis NEA-donnees-et-images.zip (identique aux constantes du prototype `prototype/nea-app.html`).
// Ne pas modifier à la main : corriger la source puis régénérer.

import type { ImageSourcePropType } from 'react-native';

import type { CoachId, ExerciceId } from './types';

/** Illustration de chaque exercice (`assets/exercices/<id>.webp`). */
export const EXERCICE_IMAGES: Readonly<Record<ExerciceId, ImageSourcePropType>> = {
  developpe_couche_halteres: require('@/assets/exercices/developpe_couche_halteres.webp'),
  developpe_incline_halteres: require('@/assets/exercices/developpe_incline_halteres.webp'),
  developpe_couche_barre: require('@/assets/exercices/developpe_couche_barre.webp'),
  ecarte_halteres: require('@/assets/exercices/ecarte_halteres.webp'),
  pompes: require('@/assets/exercices/pompes.webp'),
  pompes_inclinees: require('@/assets/exercices/pompes_inclinees.webp'),
  dips: require('@/assets/exercices/dips.webp'),
  presse_pectoraux: require('@/assets/exercices/presse_pectoraux.webp'),
  rowing_un_bras: require('@/assets/exercices/rowing_un_bras.webp'),
  rowing_barre: require('@/assets/exercices/rowing_barre.webp'),
  tirage_vertical: require('@/assets/exercices/tirage_vertical.webp'),
  tirage_horizontal: require('@/assets/exercices/tirage_horizontal.webp'),
  tractions: require('@/assets/exercices/tractions.webp'),
  tractions_assistees: require('@/assets/exercices/tractions_assistees.webp'),
  face_pull: require('@/assets/exercices/face_pull.webp'),
  souleve_terre: require('@/assets/exercices/souleve_terre.webp'),
  developpe_epaules: require('@/assets/exercices/developpe_epaules.webp'),
  elevations_laterales: require('@/assets/exercices/elevations_laterales.webp'),
  elevations_frontales: require('@/assets/exercices/elevations_frontales.webp'),
  oiseau_halteres: require('@/assets/exercices/oiseau_halteres.webp'),
  presse_epaules: require('@/assets/exercices/presse_epaules.webp'),
  curl_biceps: require('@/assets/exercices/curl_biceps.webp'),
  curl_marteau: require('@/assets/exercices/curl_marteau.webp'),
  curl_pupitre: require('@/assets/exercices/curl_pupitre.webp'),
  curl_poulie: require('@/assets/exercices/curl_poulie.webp'),
  extension_triceps_poulie: require('@/assets/exercices/extension_triceps_poulie.webp'),
  extension_triceps_tete: require('@/assets/exercices/extension_triceps_tete.webp'),
  extension_triceps_couche: require('@/assets/exercices/extension_triceps_couche.webp'),
  squat_barre: require('@/assets/exercices/squat_barre.webp'),
  goblet_squat: require('@/assets/exercices/goblet_squat.webp'),
  squat_poids_corps: require('@/assets/exercices/squat_poids_corps.webp'),
  fentes_arriere: require('@/assets/exercices/fentes_arriere.webp'),
  fentes_marche: require('@/assets/exercices/fentes_marche.webp'),
  squat_bulgare: require('@/assets/exercices/squat_bulgare.webp'),
  step_up: require('@/assets/exercices/step_up.webp'),
  presse_cuisses: require('@/assets/exercices/presse_cuisses.webp'),
  leg_extension: require('@/assets/exercices/leg_extension.webp'),
  leg_curl: require('@/assets/exercices/leg_curl.webp'),
  souleve_roumain: require('@/assets/exercices/souleve_roumain.webp'),
  hip_thrust: require('@/assets/exercices/hip_thrust.webp'),
  pont_fessier: require('@/assets/exercices/pont_fessier.webp'),
  mollets_debout: require('@/assets/exercices/mollets_debout.webp'),
  planche: require('@/assets/exercices/planche.webp'),
  planche_laterale: require('@/assets/exercices/planche_laterale.webp'),
  dead_bug: require('@/assets/exercices/dead_bug.webp'),
  bird_dog: require('@/assets/exercices/bird_dog.webp'),
  crunch: require('@/assets/exercices/crunch.webp'),
  releve_genoux: require('@/assets/exercices/releve_genoux.webp'),
  mountain_climbers: require('@/assets/exercices/mountain_climbers.webp'),
  velo_stationnaire: require('@/assets/exercices/velo_stationnaire.webp'),
};

/** Mascotte entière (`corps`, Axel = nouvelle version avec bandeau) et avatar (`tete`) de chaque coach. */
export const COACH_IMAGES: Readonly<Record<CoachId, { corps: ImageSourcePropType; tete: ImageSourcePropType }>> = {
  axel: {
    corps: require('@/assets/coachs/axel_corps.png'),
    tete: require('@/assets/coachs/axel_tete.webp'),
  },
  nova: {
    corps: require('@/assets/coachs/nova_corps.png'),
    tete: require('@/assets/coachs/nova_tete.webp'),
  },
  kai: {
    corps: require('@/assets/coachs/kai_corps.png'),
    tete: require('@/assets/coachs/kai_tete.webp'),
  },
  luna: {
    corps: require('@/assets/coachs/luna_corps.png'),
    tete: require('@/assets/coachs/luna_tete.webp'),
  },
  blaze: {
    corps: require('@/assets/coachs/blaze_corps.png'),
    tete: require('@/assets/coachs/blaze_tete.webp'),
  },
  rex: {
    corps: require('@/assets/coachs/rex_corps.png'),
    tete: require('@/assets/coachs/rex_tete.webp'),
  },
};

/** Décors de l'accueil : podium et poses d'Axel. */
export const DECO_IMAGES = {
  podium: require('@/assets/deco/deco_podium.webp'),
  pAxel: require('@/assets/deco/p_axel.webp'),
  posePoint: require('@/assets/deco/pose_point.webp'),
  poseSaut: require('@/assets/deco/pose_saut.webp'),
} satisfies Record<string, ImageSourcePropType>;

/** Vidéo d'accueil en boucle. */
export const VIDEO_ACCUEIL: number = require('@/assets/deco/v_axel.mp4');
