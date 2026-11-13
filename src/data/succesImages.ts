/** Cartes succès dessinées par l'utilisateur (découpées de sa planche, coins arrondis). */
import type { ImageSourcePropType } from 'react-native';

import type { SuccesId } from '@/lib/succes';

export const SUCCES_IMAGES: Readonly<Record<SuccesId, ImageSourcePropType>> = {
  'premier-pas': require('@/assets/succes/premier-pas.webp'),
  endurance: require('@/assets/succes/endurance.webp'),
  force: require('@/assets/succes/force.webp'),
  explorateur: require('@/assets/succes/explorateur.webp'),
  inarretable: require('@/assets/succes/inarretable.webp'),
};

/** Format des cartes (largeur / hauteur). */
export const SUCCES_RATIO = 412 / 706;
