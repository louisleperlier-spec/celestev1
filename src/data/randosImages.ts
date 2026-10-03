/** Vraies photos des sentiers (fournies par l'utilisateur, style NÉA), points d'intérêt et Axel randonneur. */
import type { ImageSourcePropType } from 'react-native';

import type { Voir } from '@/lib/rando';

export const RANDO_IMAGES: Readonly<Record<string, ImageSourcePropType>> = {
  'lac-des-cygnes': require('@/assets/randos/lac-des-cygnes.jpg'),
  'les-loups': require('@/assets/randos/les-loups.jpg'),
  acropole: require('@/assets/randos/acropole.jpg'),
  montmorency: require('@/assets/randos/montmorency.jpg'),
  'mont-wright': require('@/assets/randos/mont-wright.jpg'),
};

/** Grandes photos (rando de la semaine, fiche, récap) ; sinon la vignette. */
export const RANDO_GRANDES: Readonly<Record<string, ImageSourcePropType>> = {
  'lac-des-cygnes': require('@/assets/randos/lac-des-cygnes_grand.jpg'),
  'les-loups': require('@/assets/randos/les-loups_grand.jpg'),
  acropole: require('@/assets/randos/acropole_grand.jpg'),
  montmorency: require('@/assets/randos/montmorency_grand.jpg'),
  'mont-wright': require('@/assets/randos/mont-wright_grand.jpg'),
};
export const photoGrande = (id: string) => RANDO_GRANDES[id] ?? RANDO_IMAGES[id];

export const VOIR_IMAGES: Readonly<Record<Voir, ImageSourcePropType>> = {
  belvedere: require('@/assets/randos/voir_belvedere.jpg'),
  chute: require('@/assets/randos/voir_chute.jpg'),
  lac: require('@/assets/randos/voir_lac.jpg'),
  riviere: require('@/assets/randos/voir_lac.jpg'),
};

/** Axel randonneur (onglet), qui donne ses conseils (fiche) et qui fête le sommet (récap). */
export const AXEL_RANDO: ImageSourcePropType = require('@/assets/randos/axel_rando.webp');
export const AXEL_CONSEIL: ImageSourcePropType = require('@/assets/randos/axel_conseil.webp');
export const AXEL_SOMMET: ImageSourcePropType = require('@/assets/randos/axel_sommet.webp');
