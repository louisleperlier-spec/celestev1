/**
 * Palette NÉA, refonte « sobre » (13 nov. 2026, demandée par l'utilisateur : moins d'effets générés, plus d'UX ; références
 * réelles : Whoop, Bevel, Ladder, Gentler Streak). Noir neutre (sans teinte bleue), gris chauds, surfaces sans liseré, orange
 * réservé à l'action principale et à l'état actif ; vert / ambre / rouge seulement quand ils disent quelque chose (état).
 * Pas de halo coloré : `glow()` ne dessine plus rien.
 */
export const colors = {
  // Fonds
  bg: '#0B0B0C',
  bgAlt: '#080809',

  // Surfaces
  surface: '#151516',
  surface2: '#1D1D1F',
  border: '#242426',
  border2: '#323235',

  // Rose néon (accent) et mauve (séries secondaires)
  pink: '#FF6B1A',
  pinkLight: '#FFA266',
  pinkPale: '#FFD2B3',
  mauve: '#A0522D',

  // Texte
  text: '#F2F1EE',
  textSecondary: '#9A9993',
  textTertiary: '#64635F',
  green: '#3DD68C',
  /** Erreur (sémantique). */
  error: '#FF5C6C',

  /** Texte posé sur le bouton principal (rose plein), graphite comme dans les maquettes. */
  onPrimary: '#140A04',

  /** États (comme Whoop) : bon, moyen ; le rouge est `error`. Jamais décoratifs. */
  good: '#3DD68C',
  warn: '#F2B13B',

  // Calories (badge)
  kcal: '#FFB547',
} as const;

/** Teintes ponctuelles (surfaces secondaires, graphiques, sommeil…), accordées à la palette graphite. */
export const ui = {
  /** Bouton secondaire, cases du récap, steppers. */
  dark: '#1D1D1F',
  /** Fond de pastille d'icône. */
  iconBg: '#1F1F21',
  /** Pastilles et filtres. */
  chipBg: '#1D1D1F',
  /** Fond des avatars. */
  avatarBg: '#1D1D1F',
  /** Flèches du carrousel de coachs. */
  arrowBg: 'rgba(29,29,31,0.92)',
  /** Texte clair secondaire. */
  text2: '#E6E5E1',
  text3: '#CCCAC4',
  text4: '#E6E5E1',
  icon: '#D2D0CA',
  /** Avertissement (.warn). */
  warnBg: 'rgba(255,92,108,0.10)',
  warnBorder: 'rgba(255,92,108,0.35)',
  warnText: '#F6D9DE',
  /** Icône cœur de la FC max. */
  heart: '#FF5C6C',
  /** Texte du badge « Recommandé ». */
  onGold: '#1A1300',
  /** Toast et bannières. */
  toast: '#1F1F21',
  /** Sélection : fond rose très léger. */
  selTop: 'rgba(255,107,26,0.08)',
  selBottom: 'rgba(255,107,26,0.08)',
  pinkRing: 'rgba(255,107,26,0.35)',
  /** Fond d'une carte choisie (rose 12 % sur l'ardoise). */
  selFond: '#211A15',
  /** Podium du classement. */
  podium: ['#FFCC3D', '#C9CED8', '#CD7F4F'],
  /** Éclair du Turbo x2. */
  turbo: '#FFD21F',
  /** Cartes récompense : couleur de chaque rareté (Commune, Rare, Épique, Légendaire), confettis. */
  rarete: ['#9AA0AB', '#FFA266', '#FF6B1A', '#FFD27A'],
  confettis: ['#FF6B1A', '#FFA266', '#FFD27A', '#FFFFFF', '#A0522D'],
  voileFete: 'rgba(10,10,14,0.82)',
  /** Randonnée : couleur de la difficulté (facile, modéré, difficile), voile sur les photos. */
  difficulte: { facile: '#4CD964', modere: '#FF6B1A', difficile: '#FF5C6C' },
  voilePhoto: ['rgba(14,14,17,0)', 'rgba(14,14,17,0.55)', 'rgba(14,14,17,1)'],
  /** Crédit posé sur une photo et fond de la visionneuse plein écran. */
  voileCredit: 'rgba(0,0,0,0.5)',
  voileVisionneuse: 'rgba(12,12,14,0.97)',
  /** Contrôle segmenté : fond, texte, segment actif. */
  segBg: '#151516',
  segTxt: '#9A9993',
  segOn: '#2C2C2F',
  /** Sommeil : barres et anneau (mauve → rose clair), libellés des graphiques. */
  sommeil: '#FFA266',
  sommeilFonce: '#A0522D',
  axe: '#6E6D68',
  /** Carte du vélo : fond et quadrillage. */
  carte: '#141415',
  grille: '#232325',
  /** Texte de la bannière de notification. */
  bannerTxt: '#CCCAC4',
  /** Chat : bulle de l'utilisateur, bouton Envoyer, lien NÉA Plus. */
  bulleMoi: ['#FF6B1A', '#FF6B1A'],
  envoyer: ['#FF6B1A', '#FF6B1A'],
  plusLien: '#FFC23D',
  /** Fond des feuilles (bottom sheets) et voile derrière. */
  sheet: '#151516',
  voile: 'rgba(5,5,7,0.72)',
  /** Barre d'onglets flottante (pilule) et lueur orange des anneaux. */
  barre: '#151516',
  /** Tuiles Sommeil (violet) et VFC (vert) de l'Accueil. */
  tuileSommeil: '#8E7CFF',
  tuileVfc: '#3EE07A',
  lueur: 'rgba(255,107,26,0)',
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
