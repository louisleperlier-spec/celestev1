import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, ui } from '@/theme';

type Props = {
  selected: boolean;
  /** Sans onPress, la carte n'est pas un bouton (simple mise en évidence). */
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** Case à cocher (plusieurs choix) plutôt que bouton radio. */
  multi?: boolean;
};

/** Carte sélectionnable : une fois choisie, bordure rose et fond rosé (maquettes). */
export function SelectableCard({ selected, onPress, children, style, accessibilityLabel, multi }: Props) {
  if (!onPress)
    return (
      <View accessibilityLabel={accessibilityLabel} style={[styles.base, selected && styles.selected, style]}>
        {children}
      </View>
    );
  return (
    <Pressable
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={multi ? { checked: selected } : { selected }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[styles.base, selected && styles.selected, style]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: radius.small + 4,
  },
  selected: { borderColor: colors.pink, backgroundColor: ui.selFond },
});
