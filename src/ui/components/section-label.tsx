import { StyleSheet, Text } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Petit libellé de section en majuscules — le même partout (accueil, cartes, listes). */
export function SectionLabel({ children }: { children: string }) {
  const theme = useTheme();
  return <Text style={[styles.label, { color: theme.textMuted }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: FontSize.caption,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
