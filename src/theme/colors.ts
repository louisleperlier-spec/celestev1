/**
 * Palette NÉA (direction artistique « nuit », oct. 2026, maquettes de l'utilisateur) : fonds presque noirs, cartes sombres
 * à fin liseré, orange réservé aux actions, sélections, courbes, anneaux (à lueur) et icônes actives.
 */
export const colors = {
  // Fonds
  bg: '#0E0E11',
  bgAlt: '#0A0A0C',

  // Surfaces
  surface: '#17171B',
  surface2: '#1E1F24',
  border: '#2A2B31',
  border2: '#383940',

  // Rose néon (accent) et mauve (séries secondaires)
  pink: '#FF6B1A',
  pinkLight: '#FFA266',
  pinkPale: '#FFD2B3',
  mauve: '#A0522D',

  // Texte
  text: '#F5F5F7',
  textSecondary: '#A3A5AD',
  textTertiary: '#74767E',
  green: '#3EE07A',
  /** Erreur (sémantique). */
  error: '#FF5C6C',

  /** Texte posé sur le bouton principal (rose plein), graphite comme dans les maquettes. */
  onPrimary: '#140A04',

  // Calories (badge)
  kcal: '#FFB547',
} as const;

/** Teintes ponctuelles (surfaces secondaires, graphiques, sommeil…), accordées à la palette graphite. */
export const ui = {
  /** Bouton secondaire, cases du récap, steppers. */
  dark: '#222328',
  /** Fond de pastille d'icône. */
  iconBg: '#2A1A10',
  /** Pastilles et filtres. */
  chipBg: '#222328',
  /** Fond des avatars. */
  avatarBg: '#222328',
  /** Flèches du carrousel de coachs. */
  arrowBg: 'rgba(34,35,40,0.9)',
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
  toast: '#25262C',
  /** Sélection : fond rose très léger. */
  selTop: 'rgba(255,107,26,0.12)',
  selBottom: 'rgba(255,107,26,0.05)',
  pinkRing: 'rgba(255,107,26,0.35)',
  /** Fond d'une carte choisie (rose 12 % sur l'ardoise). */
  selFond: '#2A1B12',
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
  segBg: '#17171B',
  segTxt: '#A3A5AD',
  segOn: '#2E2F35',
  /** Sommeil : barres et anneau (mauve → rose clair), libellés des graphiques. */
  sommeil: '#FFA266',
  sommeilFonce: '#A0522D',
  axe: '#80838D',
  /** Carte du vélo : fond et quadrillage. */
  carte: '#16161A',
  grille: '#24252B',
  /** Texte de la bannière de notification. */
  bannerTxt: '#CFD1D8',
  /** Chat : bulle de l'utilisateur, bouton Envoyer, lien NÉA Plus. */
  bulleMoi: ['#FF6B1A', '#FF6B1A'],
  envoyer: ['#FF6B1A', '#FF6B1A'],
  plusLien: '#FFC23D',
  /** Fond des feuilles (bottom sheets) et voile derrière. */
  sheet: '#17171B',
  voile: 'rgba(5,5,7,0.72)',
  /** Barre d'onglets flottante (pilule) et lueur orange des anneaux. */
  barre: '#141418',
  /** Tuiles Sommeil (violet) et VFC (vert) de l'Accueil. */
  tuileSommeil: '#8E7CFF',
  tuileVfc: '#3EE07A',
  lueur: 'rgba(255,107,26,0.45)',
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
