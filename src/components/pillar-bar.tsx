import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { PillarMeta } from '@/constants/piliers';
import { Radius, Spacing, withAlpha } from '@/constants/theme';
import { useAnimatedNumber } from '@/hooks/use-animated-number';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  pillar: PillarMeta;
  value: number; // 0-100
};

export function PillarBar({ pillar, value }: Props) {
  const theme = useTheme();
  const animated = useAnimatedNumber(value);
  const pct = Math.max(0, Math.min(1, animated / 100));

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: withAlpha(theme.primary, 0.12) }]}>
        <Ionicons name={pillar.icon} size={16} color={theme.primary} />
      </View>
      <View style={styles.middle}>
        <View style={styles.labelRow}>
          <ThemedText type="smallBold">{pillar.label}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {Math.round(animated)}/100
          </ThemedText>
        </View>
        <View style={[styles.track, { backgroundColor: theme.surface2 }]}>
          <LinearGradient
            colors={[theme.gradientStart, theme.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fill, { width: `${pct * 100}%` }]}
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
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.tile,
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
