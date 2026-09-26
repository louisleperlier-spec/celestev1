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
  surface2: '#18181C',
  border: '#26262B',
  border2: '#34343A',

  // Rose néon (accent)
  pink: '#FF4FA3',
  pinkLight: '#FF8CC6',
  pinkPale: '#FFC2DF',

  // Texte
  text: '#FFFFFF',
  textSecondary: '#9A9AA3',
  textTertiary: '#6C6C75',
  green: '#3EE07A',

  /** Texte posé sur le bouton principal */
  onPrimary: '#0A0A0C',

  // Calories (badge)
  kcal: '#FF8A1F',
} as const;

/** Teintes ponctuelles reprises telles quelles du CSS du prototype. */
export const ui = {
  /** Bouton sombre, cases du récap (.btn.dark, .cplan div, .stepper button). */
  dark: '#1A1A1F',
  /** Fond de pastille d'icône (.big2 .gi). */
  iconBg: '#1C1C21',
  /** Pastilles du style de coach (.coachstyle span). */
  chipBg: '#17171B',
  /** Fond des avatars (.av). */
  avatarBg: '#0D0D10',
  /** Flèches du carrousel de coachs (.coachstage .arrow). */
  arrowBg: 'rgba(20,20,24,0.85)',
  /** Texte clair secondaire (.quote, .coachstyle, .ackb, .bsteps, .goal .gi). */
  text2: '#E8E8EC',
  text3: '#D6D6DB',
  text4: '#E6E6EA',
  icon: '#D9D9DE',
  /** Avertissement (.warn). */
  warnBg: 'rgba(255,79,100,0.08)',
  warnBorder: 'rgba(255,79,100,0.3)',
  warnText: '#F3D6DE',
  /** Icône cœur de la FC max (.fcmax svg). */
  heart: '#FF4F6D',
  /** Texte du badge « Recommandé » (.reco). */
  onGold: '#1A1300',
  /** Toast (.toast). */
  toast: '#1D1D22',
  /** Sélection : fond rose très léger (.sel.on). */
  selTop: 'rgba(255,79,163,0.10)',
  selBottom: 'rgba(255,79,163,0.03)',
  pinkRing: 'rgba(255,79,163,0.35)',
  /** Podium du classement (.pos.p0, .p1, .p2). */
  podium: ['#FFCC3D', '#C9CED8', '#CD7F4F'],
  /** Éclair du Turbo x2 (.turbo svg). */
  turbo: '#FFD21F',
  /** Boutons du sélecteur (.seg button) et bouton actif (dégradé #ffc6e0 → #ff8cc6). */
  segBg: '#17171B',
  segTxt: '#C6C6CC',
  segOn: '#FFC6E0',
  /** Sommeil : barres et anneau (#8f9bff → #5a46d6), libellés des graphiques (#77777f). */
  sommeil: '#8F9BFF',
  sommeilFonce: '#5A46D6',
  axe: '#77777F',
  /** Carte du vélo : fond (.map) et quadrillage (grid). */
  carte: '#0C0C10',
  grille: '#16161C',
  /** Texte de la bannière de notification (.nbanner small) et date d'une notification (--muted2). */
  bannerTxt: '#CFCFD6',
  /** Chat : bulle de l'utilisateur (#ffb3d6 → #ff79b9), bouton Envoyer (#ffc6e0 → #ff6fb5), lien NÉA Plus (.quota button). */
  bulleMoi: ['#FFB3D6', '#FF79B9'],
  envoyer: ['#FFC6E0', '#FF6FB5'],
  plusLien: '#FFC23D',
} as const;

/** Dégradés (du premier au dernier stop). */
export const gradients = {
  /** Bouton principal : #FFFFFF → #FFD6EA (55 %) → #F7A9CF, horizontal (.btn). */
  primary: ['#FFFFFF', '#FFD6EA', '#F7A9CF'],
  /** Segments de progression actifs (.segs i.on). */
  progress: ['#FF8CC6', '#FF4FA3'],
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

/** `color-mix(in srgb, a p%, b)` du CSS : mélange deux couleurs hexadécimales. */
export function mix(a: string, p: number, b: string): string {
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [rgb(a), rgb(b)];
  return '#' + x.map((v, i) => Math.round(v * (p / 100) + y[i] * (1 - p / 100)).toString(16).padStart(2, '0')).join('');
}

/** Couleur hexadécimale avec opacité (0 à 1). */
export const alpha = (hex: string, a: number) => hex + Math.round(a * 255).toString(16).padStart(2, '0');
