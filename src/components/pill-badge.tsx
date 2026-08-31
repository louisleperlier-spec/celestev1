import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, withAlpha } from '@/constants/theme';

type Props = {
  label: string;
  color: string;
};

/** Petit badge pilule, fond teinté 15% de `color`. Utilisé pour "+X pts", statuts, etc. */
export function PillBadge({ label, color }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: withAlpha(color, 0.15) }]}>
      <ThemedText type="smallBold" style={[styles.label, { color }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
  },
  label: {
    fontSize: 13,
  },
});
