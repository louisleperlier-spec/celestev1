/**
 * Palette NÉA — valeurs exactes du cahier des charges (section 3).
 * Ne pas ajouter de couleur qui n'existe pas dans le prototype `nea-app.html`.
 */
export const colors = {
  // Fonds
  bg: '#070708',
  bgAlt: '#0A0A0C',

  // Surfaces
  surface: '#121215',
  border: '#26262B',

  // Rose néon (accent)
  pink: '#FF4FA3',
  pinkLight: '#FF8CC6',
  pinkPale: '#FFC2DF',

  // Texte
  text: '#FFFFFF',
  textSecondary: '#9A9AA3',

  /** Texte posé sur le bouton principal */
  onPrimary: '#0A0A0C',

  // Calories (badge)
  kcal: '#FF8A1F',
} as const;

/** Dégradés (du premier au dernier stop). */
export const gradients = {
  /** Bouton principal : #FFFFFF → #FFD6EA → #F7A9CF */
  primary: ['#FFFFFF', '#FFD6EA', '#F7A9CF'],
  /** Or NÉA Plus : #FFE38A → #FFC23D */
  gold: ['#FFE38A', '#FFC23D'],
} as const;

/** Zones cardio Z1 → Z5. */
export const heartZones = {
  z1: '#6B7CFF',
  z2: '#3EE07A',
  z3: '#FFD21F',
  z4: '#FF8A1F',
  z5: '#FF3B5C',
} as const;

export type ColorName = keyof typeof colors;
export type HeartZone = keyof typeof heartZones;
