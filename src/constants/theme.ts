/**
 * Palette et tokens de style de SelfMax. Deux modes (clair / sombre), pilotés par
 * `useColorScheme()`. Le violet est la couleur de marque ("self-maxing" = ambition,
 * énergie), l'ambre sert aux récompenses/streaks.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#14121C',
    textSecondary: '#6B6578',
    background: '#FAF9FC',
    backgroundElement: '#F1EEF6',
    backgroundSelected: '#E7E1F3',
    card: '#FFFFFF',
    border: '#E9E5F1',
    primary: '#6D28D9',
    primaryLight: '#EDE6FB',
    accent: '#F59E0B',
    accentLight: '#FEF3E2',
    success: '#16A34A',
    successLight: '#E3F7EA',
    warning: '#D97706',
    danger: '#DC2626',
  },
  dark: {
    text: '#F5F3FA',
    textSecondary: '#A8A2B8',
    background: '#0E0C14',
    backgroundElement: '#1B1826',
    backgroundSelected: '#272233',
    card: '#181521',
    border: '#2A2536',
    primary: '#A78BFA',
    primaryLight: '#241D38',
    accent: '#FBBF24',
    accentLight: '#2B2412',
    success: '#4ADE80',
    successLight: '#12271A',
    warning: '#FBBF24',
    danger: '#F87171',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    rounded: 'normal',
    mono: 'monospace',
  },
}) as { sans: string; rounded: string; mono: string };

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 10,
  medium: 16,
  large: 22,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 60, android: 80 }) ?? 0;
export const MaxContentWidth = 560;
