/**
 * Lume — source unique de vérité du look : fond clair et doux, mascotte, un seul accent à la
 * fois. L'app reste mono-thème (pas de variante sombre) — seul l'ACCENT peut changer, via les
 * thèmes premium (`src/features/premium/themes.ts`). `Colors.accent*` ci-dessous est la valeur
 * par défaut (Menthe) ; les écrans qui doivent réagir au thème choisi passent par `useTheme()`
 * plutôt que d'importer `Colors` en dur.
 */

import { Platform } from 'react-native';

export const Colors = {
  background: '#F5F7EF',
  backgroundElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFBF5',

  text: '#1C2B1E',
  textSecondary: 'rgba(28, 43, 30, 0.62)',
  textMuted: 'rgba(28, 43, 30, 0.4)',

  accent: '#2ECC71',
  accentStrong: '#25A85D',
  accentSoft: 'rgba(46, 204, 113, 0.12)',
  accentText: '#FFFFFF',

  border: 'rgba(28, 43, 30, 0.07)',
  borderStrong: 'rgba(28, 43, 30, 0.14)',

  success: '#2ECC71',
  danger: '#FF6B5E',
  dangerSoft: 'rgba(255, 107, 94, 0.12)',
  overlay: 'rgba(28, 43, 30, 0.45)',

  // Notes A / B / C / D — la grammaire visuelle de toute l'app, fixes quel que soit le thème.
  gradeA: '#2ECC71',
  gradeASoft: 'rgba(46, 204, 113, 0.14)',
  gradeB: '#4FA8FF',
  gradeBSoft: 'rgba(79, 168, 255, 0.14)',
  gradeC: '#F4A94C',
  gradeCSoft: 'rgba(244, 169, 76, 0.16)',
  gradeD: '#FF7A8A',
  gradeDSoft: 'rgba(255, 122, 138, 0.14)',
} as const;

export type ColorToken = keyof typeof Colors;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  full: 9999,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const FontSize = {
  caption: 12,
  footnote: 13,
  body: 16,
  callout: 18,
  title3: 20,
  title2: 26,
  title1: 34,
  hero: 56,
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    mono: 'ui-monospace',
    rounded: 'ui-rounded',
  },
  default: {
    sans: 'normal',
    mono: 'monospace',
    rounded: 'normal',
  },
})!;

export const BottomTabInset = Platform.select({ ios: 50, default: 70 }) ?? 0;
export const MaxContentWidth = 640;
