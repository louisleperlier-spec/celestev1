/** Vraies photos des sentiers (fournies par l'utilisateur, style NÉA), points d'intérêt et Axel randonneur. */
import type { ImageSourcePropType } from 'react-native';

import type { Voir } from '@/lib/rando';

export const RANDO_IMAGES: Readonly<Record<string, ImageSourcePropType>> = {
  'lac-des-cygnes': require('@/assets/randos/lac-des-cygnes.jpg'),
  'les-loups': require('@/assets/randos/les-loups.jpg'),
  acropole: require('@/assets/randos/acropole.jpg'),
  montmorency: require('@/assets/randos/montmorency.jpg'),
  'mont-wright': require('@/assets/randos/mont-wright.jpg'),
  'mont-albert': require('@/assets/randos/mont-albert.jpg'),
  'mont-jacques-cartier': require('@/assets/randos/mont-jacques-cartier.jpg'),
  'ernest-laforce': require('@/assets/randos/ernest-laforce.jpg'),
  'pic-champlain': require('@/assets/randos/pic-champlain.jpg'),
  'statue': require('@/assets/randos/statue.jpg'),
  'pain-de-sucre': require('@/assets/randos/pain-de-sucre.jpg'),
  'mont-chauve': require('@/assets/randos/mont-chauve.jpg'),
  'centenaire': require('@/assets/randos/centenaire.jpg'),
};

/** Grandes photos (rando de la semaine, fiche, récap) ; sinon la vignette. */
export const RANDO_GRANDES: Readonly<Record<string, ImageSourcePropType>> = {
  'lac-des-cygnes': require('@/assets/randos/lac-des-cygnes_grand.jpg'),
  'les-loups': require('@/assets/randos/les-loups_grand.jpg'),
  acropole: require('@/assets/randos/acropole_grand.jpg'),
  montmorency: require('@/assets/randos/montmorency_grand.jpg'),
  'mont-wright': require('@/assets/randos/mont-wright_grand.jpg'),
  'mont-albert': require('@/assets/randos/mont-albert_grand.jpg'),
  'mont-jacques-cartier': require('@/assets/randos/mont-jacques-cartier_grand.jpg'),
  'ernest-laforce': require('@/assets/randos/ernest-laforce_grand.jpg'),
  'pic-champlain': require('@/assets/randos/pic-champlain_grand.jpg'),
  'statue': require('@/assets/randos/statue_grand.jpg'),
  'pain-de-sucre': require('@/assets/randos/pain-de-sucre_grand.jpg'),
  'mont-chauve': require('@/assets/randos/mont-chauve_grand.jpg'),
  'centenaire': require('@/assets/randos/centenaire_grand.jpg'),
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

/** Photo de la galerie d'un sentier ; `voir` : illustre ce point de « Ce que tu vas voir » ; `credit` : auteur et licence (Wikimedia Commons, image teintée). */
export type PhotoSentier = { img: ImageSourcePropType; voir?: Voir; credit?: string };

/** Photos libres de Wikimedia Commons (recadrées et teintées au style NÉA ; crédits affichés sous la galerie). */
const COMMONS: Readonly<Record<string, readonly PhotoSentier[]>> = {
  'mont-albert': [
    { img: require('@/assets/randos/galerie/mont-albert_1.webp'), credit: 'Radicalsim · CC BY-SA 3.0' },
    { img: require('@/assets/randos/galerie/mont-albert_2.webp'), voir: 'belvedere', credit: 'Ymblanter · CC BY-SA 4.0' },
    { img: require('@/assets/randos/galerie/mont-albert_3.webp'), credit: 'Ymblanter · CC BY-SA 4.0' },
  ],
  'mont-jacques-cartier': [
    { img: require('@/assets/randos/galerie/mont-jacques-cartier_1.webp'), voir: 'belvedere', credit: 'Jacques@Barabao · CC BY-SA 2.0' },
  ],
  'ernest-laforce': [
    { img: require('@/assets/randos/galerie/ernest-laforce_1.webp'), voir: 'belvedere', credit: 'Jean-Philippe Caron · CC BY-SA 4.0' },
    { img: require('@/assets/randos/galerie/ernest-laforce_2.webp'), credit: 'Fralambert · CC BY-SA 4.0' },
  ],
  'pic-champlain': [
    { img: require('@/assets/randos/galerie/pic-champlain_1.webp'), voir: 'belvedere', credit: 'Urs Neumeier · CC BY-SA 2.5' },
    { img: require('@/assets/randos/galerie/pic-champlain_2.webp'), credit: 'Jean-Pierre Guillet · CC BY-SA 4.0' },
    { img: require('@/assets/randos/galerie/pic-champlain_3.webp'), credit: 'Yasmine lmdi · CC BY-SA 4.0' },
  ],
  statue: [
    { img: require('@/assets/randos/galerie/statue_1.webp'), credit: 'Fralambert · CC BY-SA 3.0' },
    { img: require('@/assets/randos/galerie/statue_2.webp'), voir: 'belvedere', credit: 'Simon Villeneuve · CC BY-SA 3.0' },
  ],
  'pain-de-sucre': [
    { img: require('@/assets/randos/galerie/pain-de-sucre_1.webp'), voir: 'belvedere', credit: 'Jiaqian AirplaneFan · CC BY 3.0' },
    { img: require('@/assets/randos/galerie/pain-de-sucre_2.webp'), credit: 'Jiaqian AirplaneFan · CC BY 3.0' },
  ],
  'mont-chauve': [
    { img: require('@/assets/randos/galerie/mont-chauve_1.webp'), voir: 'belvedere', credit: 'AmandinedeChanteloup · CC BY-SA 4.0' },
    { img: require('@/assets/randos/galerie/mont-chauve_2.webp'), credit: 'Tangque · CC BY-SA 4.0' },
    { img: require('@/assets/randos/galerie/mont-chauve_3.webp'), credit: 'O_livier · CC BY-SA 3.0' },
  ],
  centenaire: [
    { img: require('@/assets/randos/galerie/centenaire_1.webp'), credit: 'Mhsheikholeslami · CC BY-SA 4.0' },
    { img: require('@/assets/randos/galerie/centenaire_3.webp'), credit: 'Mhsheikholeslami · CC BY-SA 4.0' },
  ],
  'lac-des-cygnes': [
    { img: require('@/assets/randos/galerie/lac-des-cygnes_1.webp'), voir: 'belvedere', credit: 'Mathématicien joyeux · CC BY-SA 3.0' },
    { img: require('@/assets/randos/galerie/lac-des-cygnes_2.webp'), credit: 'Mathématicien joyeux · CC BY-SA 3.0' },
    { img: require('@/assets/randos/galerie/lac-des-cygnes_3.webp'), credit: 'Yann from Madrid, Spain · CC BY 2.0' },
    { img: require('@/assets/randos/galerie/lac-des-cygnes_4.webp'), credit: 'Yann from Madrid, Spain · CC BY 2.0' },
  ],
  'les-loups': [
    { img: require('@/assets/randos/galerie/les-loups_1.webp'), voir: 'belvedere', credit: 'Wilfredor · CC0' },
    { img: require('@/assets/randos/galerie/les-loups_2.webp'), voir: 'riviere', credit: 'Wilfredor · CC0' },
    { img: require('@/assets/randos/galerie/les-loups_3.webp'), credit: 'Cephas · CC BY-SA 3.0' },
    { img: require('@/assets/randos/galerie/les-loups_4.webp'), credit: 'Cephas · CC BY-SA 3.0' },
  ],
  acropole: [
    { img: require('@/assets/randos/galerie/acropole_1.webp'), voir: 'riviere', credit: 'Dav2z · domaine public' },
    { img: require('@/assets/randos/galerie/acropole_2.webp'), credit: 'dconvertini · CC BY-SA 2.0' },
    { img: require('@/assets/randos/galerie/acropole_3.webp'), credit: 'dconvertini · CC BY-SA 2.0' },
  ],
  montmorency: [
    { img: require('@/assets/randos/galerie/montmorency_1.webp'), voir: 'belvedere', credit: 'The Cosmonaut · CC BY-SA 2.5 ca' },
    { img: require('@/assets/randos/galerie/montmorency_2.webp'), credit: 'Wilfredor · CC BY-SA 4.0' },
    { img: require('@/assets/randos/galerie/montmorency_3.webp'), credit: 'Cactus0625 · CC BY-SA 4.0' },
  ],
};

/** Sentiers dont la photo principale vient elle aussi de Wikimedia Commons (1re photo de la galerie). */
const RANDOS_COMMONS: readonly string[] = ['mont-albert', 'mont-jacques-cartier', 'ernest-laforce', 'pic-champlain', 'statue', 'pain-de-sucre', 'mont-chauve', 'centenaire'];

/** Galerie d'un sentier : sa photo principale (fournie par l'utilisateur pour les 5 premiers) puis les photos libres. */
export function galerie(id: string): PhotoSentier[] {
  const commons = COMMONS[id] ?? [];
  const perso = RANDO_GRANDES[id] && !RANDOS_COMMONS.includes(id) ? [{ img: RANDO_GRANDES[id] }] : [];
  return [...perso, ...commons];
}


/** Image d'un point de « Ce que tu vas voir » : une photo du sentier si elle en montre un, sinon l'illustration générique. */
export const imageVoir = (id: string, v: Voir) => (COMMONS[id] ?? []).find((p) => p.voir === v)?.img ?? VOIR_IMAGES[v];

/** Crédit de la photo principale (sentiers dont elle vient de Wikimedia Commons). */
export const creditPrincipal = (id: string) => (RANDOS_COMMONS.includes(id) ? COMMONS[id]?.[0]?.credit : undefined);
