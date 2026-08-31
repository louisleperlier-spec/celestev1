/**
 * Thèmes premium — Lume reste clair/mono-surface, seul l'accent change. Le vert Menthe reste
 * l'identité par défaut (gratuit) ; les autres teintes sont réservées au premium. `onAccent` est
 * la couleur de texte à utiliser sur un fond de cette couleur (varie selon la luminosité de
 * l'accent — blanc sur les teintes saturées, sombre sur les teintes claires).
 */

export interface AccentTheme {
  id: string;
  label: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  onAccent: string;
}

export const DEFAULT_ACCENT_THEME_ID = 'mint';

export const ACCENT_THEMES: readonly AccentTheme[] = [
  {
    id: 'mint',
    label: 'Menthe',
    accent: '#2ECC71',
    accentStrong: '#25A85D',
    accentSoft: 'rgba(46, 204, 113, 0.12)',
    onAccent: '#FFFFFF',
  },
  {
    id: 'azure',
    label: 'Azur',
    accent: '#4FA8FF',
    accentStrong: '#2E86E0',
    accentSoft: 'rgba(79, 168, 255, 0.14)',
    onAccent: '#FFFFFF',
  },
  {
    id: 'coral',
    label: 'Corail',
    accent: '#FF7A5C',
    accentStrong: '#E85A3B',
    accentSoft: 'rgba(255, 122, 92, 0.14)',
    onAccent: '#FFFFFF',
  },
  {
    id: 'violet',
    label: 'Violet',
    accent: '#B48CFF',
    accentStrong: '#9668E8',
    accentSoft: 'rgba(180, 140, 255, 0.14)',
    onAccent: '#2B1F4D',
  },
];

export function findAccentTheme(id: string): AccentTheme {
  return ACCENT_THEMES.find((theme) => theme.id === id) ?? ACCENT_THEMES[0];
}
