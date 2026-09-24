import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors, glow, radius, spacing } from '@/theme';

type Props = {
  selected: boolean;
  onPress: () => void;
  children: ReactNode;
};

/** Élément sélectionnable : une fois choisi, bordure rose + glow. */
export function SelectableCard({ selected, onPress, children }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.base, selected && styles.selected]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  selected: { borderColor: colors.pink, ...glow('rgba(255, 79, 163, 0.55)') },
});
