/**
 * Lume — source unique de vérité du look : fond très sombre façon dashboard premium, mascotte,
 * un seul accent à la fois. L'app reste mono-thème (pas de variante claire) — seul l'ACCENT peut
 * changer, via les thèmes premium (`src/features/premium/themes.ts`). `Colors.accent*` ci-dessous
 * est la valeur par défaut (Menthe) ; les écrans qui doivent réagir au thème choisi passent par
 * `useTheme()` plutôt que d'importer `Colors` en dur.
 */

import { Platform } from 'react-native';

export const Colors = {
  background: '#0A0B0D',
  backgroundElevated: '#000000',
  surface: '#17191D',
  surfaceElevated: '#1F2226',

  text: '#F2F3F5',
  textSecondary: 'rgba(242, 243, 245, 0.62)',
  textMuted: 'rgba(242, 243, 245, 0.4)',

  accent: '#2ECC71',
  accentStrong: '#25A85D',
  accentSoft: 'rgba(46, 204, 113, 0.16)',
  accentText: '#0A2313',

  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',

  success: '#2ECC71',
  danger: '#FF6B5E',
  dangerSoft: 'rgba(255, 107, 94, 0.16)',
  overlay: 'rgba(0, 0, 0, 0.72)',

  // Notes A / B / C / D — la grammaire visuelle de toute l'app, fixes quel que soit le thème.
  gradeA: '#2ECC71',
  gradeASoft: 'rgba(46, 204, 113, 0.16)',
  gradeB: '#9BE33D',
  gradeBSoft: 'rgba(155, 227, 61, 0.16)',
  gradeC: '#F4B84C',
  gradeCSoft: 'rgba(244, 184, 76, 0.16)',
  gradeD: '#FF6B5E',
  gradeDSoft: 'rgba(255, 107, 94, 0.16)',
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
