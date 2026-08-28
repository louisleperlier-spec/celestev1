/**
 * Lume — source unique de vérité du look : fond clair et doux, mascotte-goutte, un accent
 * lavande par défaut. L'app reste mono-thème (pas de variante sombre) — seul l'ACCENT peut
 * changer, via les thèmes premium (`src/features/premium/themes.ts`). `Colors.accent*`
 * ci-dessous est la valeur par défaut (Lavande) ; les écrans qui doivent réagir au thème choisi
 * passent par `useTheme()` plutôt que d'importer `Colors` en dur.
 */

import { Platform } from 'react-native';

export const Colors = {
  background: '#F3F0FC',
  backgroundElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FBFAFF',

  text: '#241F3D',
  textSecondary: 'rgba(36, 31, 61, 0.64)',
  textMuted: 'rgba(36, 31, 61, 0.4)',

  accent: '#7C6FF0',
  accentStrong: '#5B4FD8',
  accentSoft: 'rgba(124, 111, 240, 0.12)',
  accentText: '#FFFFFF',

  border: 'rgba(36, 31, 61, 0.08)',
  borderStrong: 'rgba(36, 31, 61, 0.16)',

  success: '#33E38F',
  danger: '#FF6B5E',
  dangerSoft: 'rgba(255, 107, 94, 0.14)',
  overlay: 'rgba(36, 31, 61, 0.5)',

  // Notes A / B / C — la grammaire visuelle de toute l'app, fixes quel que soit le thème.
  gradeA: '#2BBE7D',
  gradeASoft: 'rgba(51, 227, 143, 0.16)',
  gradeB: '#E0A63E',
  gradeBSoft: 'rgba(244, 184, 76, 0.16)',
  gradeC: '#E85A4A',
  gradeCSoft: 'rgba(255, 107, 94, 0.16)',

  // Mascotte Lume — couleur fixe, indépendante du thème d'accent choisi.
  mascot: '#6FE1C7',
  mascotStrong: '#3FC9A8',
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
