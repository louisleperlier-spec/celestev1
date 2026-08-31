/**
 * Lume — source unique de vérité du look : fond clair, mascotte, un seul accent à la fois.
 * L'app reste mono-thème (pas de variante sombre) — seul l'ACCENT peut changer, via les thèmes
 * premium (`src/features/premium/themes.ts`). `Colors.accent*` ci-dessous est la valeur par
 * défaut (Menthe) ; les écrans qui doivent réagir au thème choisi passent par `useTheme()`
 * plutôt que d'importer `Colors` en dur.
 */

import { Platform } from 'react-native';

export const Colors = {
  background: '#F4F7FB',
  backgroundElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#F7F9FC',

  text: '#1B2430',
  textSecondary: 'rgba(27, 36, 48, 0.62)',
  textMuted: 'rgba(27, 36, 48, 0.4)',

  accent: '#2ECC71',
  accentStrong: '#25A85D',
  accentSoft: 'rgba(46, 204, 113, 0.12)',
  accentText: '#0F3D22',

  border: 'rgba(27, 36, 48, 0.08)',
  borderStrong: 'rgba(27, 36, 48, 0.16)',

  success: '#2ECC71',
  danger: '#FF6B5E',
  dangerSoft: 'rgba(255, 107, 94, 0.14)',
  overlay: 'rgba(27, 36, 48, 0.45)',

  // Notes A / B / C / D — la grammaire visuelle de toute l'app, fixes quel que soit le thème.
  gradeA: '#2ECC71',
  gradeASoft: 'rgba(46, 204, 113, 0.14)',
  gradeB: '#7BC142',
  gradeBSoft: 'rgba(123, 193, 66, 0.14)',
  gradeC: '#F4B84C',
  gradeCSoft: 'rgba(244, 184, 76, 0.16)',
  gradeD: '#FF6B5E',
  gradeDSoft: 'rgba(255, 107, 94, 0.14)',

  // Mascotte Lume — couleur fixe, indépendante du thème d'accent choisi.
  mascot: '#3B9EFF',
  mascotStrong: '#1F7FE0',
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
