/**
 * Thèmes premium — Lume reste noir/mono-surface, seul l'accent change. Le vert Menthe reste
 * l'identité par défaut (gratuit) ; les autres teintes sont réservées au premium.
 */

export interface AccentTheme {
  id: string;
  label: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
}

export const DEFAULT_ACCENT_THEME_ID = 'mint';

export const ACCENT_THEMES: readonly AccentTheme[] = [
  {
    id: 'mint',
    label: 'Menthe',
    accent: '#33E38F',
    accentStrong: '#1FBE73',
    accentSoft: 'rgba(51, 227, 143, 0.14)',
  },
  {
    id: 'azure',
    label: 'Azur',
    accent: '#4FA8FF',
    accentStrong: '#2E86E0',
    accentSoft: 'rgba(79, 168, 255, 0.14)',
  },
  {
    id: 'coral',
    label: 'Corail',
    accent: '#FF7A5C',
    accentStrong: '#E85A3B',
    accentSoft: 'rgba(255, 122, 92, 0.14)',
  },
  {
    id: 'violet',
    label: 'Violet',
    accent: '#B48CFF',
    accentStrong: '#9668E8',
    accentSoft: 'rgba(180, 140, 255, 0.14)',
  },
];

export function findAccentTheme(id: string): AccentTheme {
  return ACCENT_THEMES.find((theme) => theme.id === id) ?? ACCENT_THEMES[0];
}
