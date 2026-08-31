/**
 * Système de design SelfMax — dark-only, accent bleu athlétique.
 * Toute couleur/taille/rayon utilisée par un écran ou composant DOIT venir d'ici.
 */

import { Platform } from 'react-native';

export const Colors = {
  dark: {
    bg: '#08090C',
    surface: '#101218',
    surface2: '#171A22',
    border: 'rgba(255,255,255,0.07)',
    borderStrong: 'rgba(255,255,255,0.16)',
    chartGrid: 'rgba(255,255,255,0.10)',

    text: '#F4F6FB',
    textSecondary: '#A0A6B4',
    textTertiary: '#6B7280',

    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    onPrimary: '#FFFFFF',
    gradientStart: '#1D4ED8',
    gradientEnd: '#60A5FA',

    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
  },
} as const;

export type ThemeColor = keyof typeof Colors.dark;

/** rgba(hex, alpha) — pour les fonds teintés (tuiles d'icône, pills, chips de statut). */
export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Échelle typo. Les gros chiffres restent sur la police système, en 800 + letterSpacing serré. */
export const Typography = {
  display: { fontSize: 64, fontWeight: '800' as const, letterSpacing: -1.5 },
  displayMedium: { fontSize: 40, fontWeight: '800' as const, letterSpacing: -1 },
  sectionLabel: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 1.6, textTransform: 'uppercase' as const },
  title: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.3 },
  subtitle: { fontSize: 20, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  bodyBold: { fontSize: 15, fontWeight: '700' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  tile: 13,
  button: 15,
  card: 18,
  pill: 100,
} as const;

/** Élévation à 3 niveaux max : surface + hairline + ombre douce. */
export const Elevation = {
  level1: {
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  level2: {
    shadowColor: '#000000',
    shadowOpacity: 0.32,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  glow: {
    shadowColor: '#3B82F6',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 60, android: 80 }) ?? 0;
export const MaxContentWidth = 560;
