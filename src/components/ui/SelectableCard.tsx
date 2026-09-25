import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, ui } from '@/theme';

type Props = {
  selected: boolean;
  onPress: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** Case à cocher (plusieurs choix) plutôt que bouton radio. */
  multi?: boolean;
};

/**
 * Carte sélectionnable (.card.sel) : une fois choisie, bordure rose, halo
 * et fond rose très léger (.sel.on).
 */
export function SelectableCard({ selected, onPress, children, style, accessibilityLabel, multi }: Props) {
  return (
    <Pressable
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={multi ? { checked: selected } : { selected }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[styles.base, selected && styles.selected, style]}
    >
      {selected && (
        <LinearGradient
          colors={[ui.selTop, ui.selBottom]}
          style={[StyleSheet.absoluteFill, styles.bg]}
          pointerEvents="none"
        />
      )}
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
  },
  selected: {
    borderColor: colors.pink,
    boxShadow: [
      { offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: ui.pinkRing },
      { offsetX: 0, offsetY: 0, blurRadius: 18, spreadDistance: 0, color: 'rgba(255,79,163,0.28)' },
    ],
  },
  bg: { borderRadius: radius.card - 1 },
});
