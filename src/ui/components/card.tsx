import { StyleSheet, View, type ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = ViewProps & { padded?: boolean };

/** Carte solide — pour tous les écrans hors signature (listes, réglages, détail). */
export function Card({ style, padded = true, ...rest }: CardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.surface,
          borderRadius: Radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.border,
        },
        padded && { padding: Spacing.three },
        style,
      ]}
      {...rest}
    />
  );
}

/** Carte "verre dépoli" — réservée aux écrans signature posés sur le NightSkyBackdrop. */
export function FrostCard({ style, padded = true, ...rest }: CardProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return (
    <BlurView
      intensity={isDark ? 38 : 55}
      tint={isDark ? 'dark' : 'light'}
      style={[
        {
          borderRadius: Radius.lg,
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.6)',
        },
        padded && { padding: Spacing.three },
        style,
      ]}
      {...rest}
    />
  );
}
