/**
 * Palette NÉA (refonte graphite) : fonds graphite, cartes ardoise, rose néon réservé aux actions,
 * sélections, courbes, anneaux et icônes actives. Jamais de noir pur.
 */
export const colors = {
  // Fonds
  bg: '#222328',
  bgAlt: '#1D1E23',

  // Surfaces
  surface: '#2D3038',
  surface2: '#343740',
  border: '#41444E',
  border2: '#4C4F5A',

  // Rose néon (accent) et mauve (séries secondaires)
  pink: '#FF6B1A',
  pinkLight: '#FFA266',
  pinkPale: '#FFD2B3',
  mauve: '#A0522D',

  // Texte
  text: '#F5F5F7',
  textSecondary: '#ADB0BA',
  textTertiary: '#80838D',
  green: '#3EE07A',
  /** Erreur (sémantique). */
  error: '#FF5C6C',

  /** Texte posé sur le bouton principal (rose plein), graphite comme dans les maquettes. */
  onPrimary: '#1D1E23',

  // Calories (badge)
  kcal: '#FFB547',
} as const;

/** Teintes ponctuelles (surfaces secondaires, graphiques, sommeil…), accordées à la palette graphite. */
export const ui = {
  /** Bouton secondaire, cases du récap, steppers. */
  dark: '#343740',
  /** Fond de pastille d'icône. */
  iconBg: '#3A3D47',
  /** Pastilles et filtres. */
  chipBg: '#343740',
  /** Fond des avatars. */
  avatarBg: '#343740',
  /** Flèches du carrousel de coachs. */
  arrowBg: 'rgba(52,55,64,0.9)',
  /** Texte clair secondaire. */
  text2: '#E4E5EA',
  text3: '#CFD1D8',
  text4: '#E4E5EA',
  icon: '#D4D6DD',
  /** Avertissement (.warn). */
  warnBg: 'rgba(255,92,108,0.10)',
  warnBorder: 'rgba(255,92,108,0.35)',
  warnText: '#F6D9DE',
  /** Icône cœur de la FC max. */
  heart: '#FF5C6C',
  /** Texte du badge « Recommandé ». */
  onGold: '#1A1300',
  /** Toast et bannières. */
  toast: '#3A3D47',
  /** Sélection : fond rose très léger. */
  selTop: 'rgba(255,107,26,0.12)',
  selBottom: 'rgba(255,107,26,0.05)',
  pinkRing: 'rgba(255,107,26,0.35)',
  /** Fond d'une carte choisie (rose 12 % sur l'ardoise). */
  selFond: '#463734',
  /** Podium du classement. */
  podium: ['#FFCC3D', '#C9CED8', '#CD7F4F'],
  /** Éclair du Turbo x2. */
  turbo: '#FFD21F',
  /** Cartes récompense : couleur de chaque rareté (Commune, Rare, Épique, Légendaire), fond de carte, confettis. */
  rarete: ['#9AA0AB', '#FFA266', '#FF6B1A', '#FFD27A'],
  carteFond: ['#2D3038', '#3A2E28', '#3F2A1E', '#3F341C'],
  carteDos: '#1A1B1F',
  confettis: ['#FF6B1A', '#FFA266', '#FFD27A', '#FFFFFF', '#A0522D'],
  voileFete: 'rgba(10,10,14,0.82)',
  /** Contrôle segmenté : fond, texte, segment actif. */
  segBg: '#2D3038',
  segTxt: '#ADB0BA',
  segOn: '#41444E',
  /** Sommeil : barres et anneau (mauve → rose clair), libellés des graphiques. */
  sommeil: '#FFA266',
  sommeilFonce: '#A0522D',
  axe: '#80838D',
  /** Carte du vélo : fond et quadrillage. */
  carte: '#26282E',
  grille: '#30333B',
  /** Texte de la bannière de notification. */
  bannerTxt: '#CFD1D8',
  /** Chat : bulle de l'utilisateur, bouton Envoyer, lien NÉA Plus. */
  bulleMoi: ['#FF6B1A', '#FF6B1A'],
  envoyer: ['#FF6B1A', '#FF6B1A'],
  plusLien: '#FFC23D',
  /** Fond des feuilles (bottom sheets) et voile derrière. */
  sheet: '#2D3038',
  voile: 'rgba(22,23,27,0.7)',
} as const;

/** Dégradés (du premier au dernier stop). */
export const gradients = {
  /** Bouton principal : rose plein. */
  primary: ['#FF6B1A', '#FF6B1A', '#FF6B1A'],
  /** Segments de progression actifs. */
  progress: ['#FF6B1A', '#FF6B1A'],
  /** Or NÉA Plus : #FFE38A → #FFC23D */
  gold: ['#FFE38A', '#FFC23D'],
} as const;

/** Zones cardio Z1 → Z5 : du gris mauve au rose clair, toujours accompagnées de leur libellé. */
export const heartZones = {
  z1: '#7A6E66',
  z2: '#A0522D',
  z3: '#D35E23',
  z4: '#FF6B1A',
  z5: '#FFA266',
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
