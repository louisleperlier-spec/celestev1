/**
 * Lume — source unique de vérité du look : fond noir, un seul accent à la fois.
 * L'app reste mono-thème (pas de variante claire) — seul l'ACCENT peut changer, via les thèmes
 * premium (`src/features/premium/themes.ts`). `Colors.accent*` ci-dessous est la valeur par
 * défaut (Menthe) ; les écrans qui doivent réagir au thème choisi passent par `useTheme()`
 * plutôt que d'importer `Colors` en dur.
 */

import { Platform } from 'react-native';

export const Colors = {
  background: '#000000',
  backgroundElevated: '#050807',
  surface: '#0E1512',
  surfaceElevated: '#161F1A',

  text: '#F4FBF6',
  textSecondary: 'rgba(244, 251, 246, 0.64)',
  textMuted: 'rgba(244, 251, 246, 0.38)',

  accent: '#33E38F',
  accentStrong: '#1FBE73',
  accentSoft: 'rgba(51, 227, 143, 0.14)',

  border: 'rgba(255, 255, 255, 0.09)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',

  success: '#33E38F',
  danger: '#FF6B5E',
  dangerSoft: 'rgba(255, 107, 94, 0.14)',
  overlay: 'rgba(0, 0, 0, 0.72)',

  // Notes A / B / C — la grammaire visuelle de toute l'app.
  gradeA: '#33E38F',
  gradeASoft: 'rgba(51, 227, 143, 0.16)',
  gradeB: '#F4B84C',
  gradeBSoft: 'rgba(244, 184, 76, 0.16)',
  gradeC: '#FF6B5E',
  gradeCSoft: 'rgba(255, 107, 94, 0.16)',
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
