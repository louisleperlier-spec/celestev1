import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { PillarMeta } from '@/constants/piliers';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  pillar: PillarMeta;
  value: number; // 0-100
};

export function PillarBar({ pillar, value }: Props) {
  const theme = useTheme();
  const pct = Math.max(0, Math.min(1, value / 100));

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
        <Ionicons name={pillar.icon} size={16} color={theme.primary} />
      </View>
      <View style={styles.middle}>
        <View style={styles.labelRow}>
          <ThemedText type="smallBold">{pillar.label}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {value}/100
          </ThemedText>
        </View>
        <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
          <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: theme.primary }]} />
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
