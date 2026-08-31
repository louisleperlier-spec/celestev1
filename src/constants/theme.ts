/**
 * SelfMax est une app dark-only (comme la plupart des apps de coaching physique/discipline) :
 * fond quasi-noir, accent bleu unique. `Colors.light` reste défini pour une bascule future,
 * mais `useTheme()` renvoie toujours `Colors.dark` aujourd'hui — voir src/hooks/use-theme.ts.
 */

import { Platform } from 'react-native';

export const Colors = {
  dark: {
    text: '#F5F6FA',
    textSecondary: '#8B8FA3',
    background: '#08090D',
    backgroundElement: '#15171F',
    backgroundSelected: '#1F2230',
    card: '#12141C',
    border: '#22242F',
    primary: '#3B82F6',
    primaryLight: '#132038',
    accent: '#FBBF24',
    accentLight: '#2B2412',
    success: '#22C55E',
    successLight: '#123320',
    warning: '#F59E0B',
    warningLight: '#332510',
    danger: '#EF4444',
    dangerLight: '#331414',
  },
  light: {
    text: '#0B0C10',
    textSecondary: '#6B6F7D',
    background: '#F5F6FA',
    backgroundElement: '#ECEDF4',
    backgroundSelected: '#DDE1F2',
    card: '#FFFFFF',
    border: '#E4E6EF',
    primary: '#2563EB',
    primaryLight: '#E4ECFE',
    accent: '#D97706',
    accentLight: '#FEF3E2',
    success: '#16A34A',
    successLight: '#E3F7EA',
    warning: '#D97706',
    warningLight: '#FEF3E2',
    danger: '#DC2626',
    dangerLight: '#FCE8E8',
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
