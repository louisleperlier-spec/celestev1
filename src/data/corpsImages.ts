/**
 * Silhouette musculaire de face et de dos (planche « couleurs codées » générée par l'utilisateur avec Nano Banana, 13 nov. 2026),
 * découpée en masques transparents par `scripts/decouper-corps.py` : silhouette, contours, et un masque par muscle visible.
 * Chaque masque est teinté dans l'app (`tintColor`) selon la récupération du muscle (`lib/corps.ts`).
 */
import type { ImageSourcePropType } from 'react-native';

import type { Muscle } from '@/lib/corps';

export type VueCorps = { ratio: number; silhouette: ImageSourcePropType; lignes: ImageSourcePropType; muscles: Partial<Record<Muscle, ImageSourcePropType>> };

export const CORPS_IMAGES: Record<'face' | 'dos', VueCorps> = {
  face: {
    ratio: 1.6713,
    silhouette: require('@/assets/corps/face_silhouette.png'),
    lignes: require('@/assets/corps/face_lignes.png'),
    muscles: {
      traps: require('@/assets/corps/face_traps.png'),
      shoulders: require('@/assets/corps/face_shoulders.png'),
      chest: require('@/assets/corps/face_chest.png'),
      biceps: require('@/assets/corps/face_biceps.png'),
      forearms: require('@/assets/corps/face_forearms.png'),
      lats: require('@/assets/corps/face_lats.png'),
      abs: require('@/assets/corps/face_abs.png'),
      glutes: require('@/assets/corps/face_glutes.png'),
      quads: require('@/assets/corps/face_quads.png'),
      adductors: require('@/assets/corps/face_adductors.png'),
      calves: require('@/assets/corps/face_calves.png'),
    },
  },
  dos: {
    ratio: 1.7124,
    silhouette: require('@/assets/corps/dos_silhouette.png'),
    lignes: require('@/assets/corps/dos_lignes.png'),
    muscles: {
      traps: require('@/assets/corps/dos_traps.png'),
      shoulders: require('@/assets/corps/dos_shoulders.png'),
      triceps: require('@/assets/corps/dos_triceps.png'),
      forearms: require('@/assets/corps/dos_forearms.png'),
      upperBack: require('@/assets/corps/dos_upperBack.png'),
      lats: require('@/assets/corps/dos_lats.png'),
      lowerBack: require('@/assets/corps/dos_lowerBack.png'),
      glutes: require('@/assets/corps/dos_glutes.png'),
      adductors: require('@/assets/corps/dos_adductors.png'),
      hamstrings: require('@/assets/corps/dos_hamstrings.png'),
      calves: require('@/assets/corps/dos_calves.png'),
    },
  },
};
