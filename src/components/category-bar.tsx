import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { CategoryMeta } from '@/constants/categories';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  category: CategoryMeta;
  points: number; // 0-20
  max?: number;
};

export function CategoryBar({ category, points, max = 20 }: Props) {
  const theme = useTheme();
  const pct = Math.max(0, Math.min(1, points / max));

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: category.colorLight }]}>
        <Ionicons name={category.icon} size={16} color={category.color} />
      </View>
      <View style={styles.middle}>
        <View style={styles.labelRow}>
          <ThemedText type="smallBold">{category.label}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {points}/{max}
          </ThemedText>
        </View>
        <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
          <View
            style={[
              styles.fill,
              { width: `${pct * 100}%`, backgroundColor: category.color },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  track: {
    height: 8,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
});
