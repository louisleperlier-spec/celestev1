/**
 * Céleste — design system (DA "ciel nocturne contemplatif").
 * Source unique de vérité du look : on modifie ICI, jamais une couleur en dur dans un écran.
 * Inspiré du kit "iOS-native frost" (immersif, apaisant) — adapté à une app de bien-être spirituel :
 * accent lune/lavande, surfaces frost sur les écrans signature, surfaces solides ailleurs.
 */
import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#F4F3FB',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    backgroundElement: '#ECEAF9',
    text: '#1C1B2E',
    textSecondary: '#5F5C79',
    textMuted: '#9694AC',
    accent: '#6C63E0',
    accentSoft: 'rgba(108,99,224,0.12)',
    gold: '#C9A15A',
    goldSoft: 'rgba(201,161,90,0.16)',
    border: 'rgba(28,27,46,0.08)',
    success: '#2FA36B',
    danger: '#D9544D',
    overlay: 'rgba(17,16,36,0.42)',
    // Contenu posé sur une surface "frost" (NightSkyBackdrop) — l'aube est claire, donc verre clair + texte sombre.
    onFrost: '#1C1B2E',
    frostSurface: 'rgba(255,255,255,0.55)',
    frostBorder: 'rgba(28,27,46,0.12)',
  },
  dark: {
    background: '#0E0C1B',
    surface: '#191730',
    surfaceElevated: '#221F3D',
    backgroundElement: '#1F1C38',
    text: '#F3F2FA',
    textSecondary: 'rgba(243,242,250,0.66)',
    textMuted: 'rgba(243,242,250,0.42)',
    accent: '#9C93F5',
    accentSoft: 'rgba(156,147,245,0.18)',
    gold: '#E4C27E',
    goldSoft: 'rgba(228,194,126,0.16)',
    border: 'rgba(255,255,255,0.10)',
    success: '#5BC08C',
    danger: '#FF6B61',
    overlay: 'rgba(4,3,14,0.66)',
    // Contenu posé sur une surface "frost" — ciel nocturne, donc verre sombre + texte clair.
    onFrost: '#FFFFFF',
    frostSurface: 'rgba(255,255,255,0.14)',
    frostBorder: 'rgba(255,255,255,0.4)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Dégradé "ciel nocturne" utilisé sur les écrans signature (Accueil, Onboarding, Paywall).
export const NightSky = {
  light: ['#DCE6FB', '#E9E4F9', '#F4F3FB'] as const,
  dark: ['#0A0818', '#141130', '#1C1840'] as const,
};

export const Radius = { sm: 8, md: 14, lg: 22, xl: 32, full: 9999 } as const;

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
  title3: 22,
  title2: 28,
  title1: 34,
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui',
    serif: 'Georgia, serif',
    rounded: 'system-ui',
    mono: 'ui-monospace',
  },
})!;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
