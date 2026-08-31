import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import type { MissionTemplate } from '@/constants/missions';
import { Radius, Spacing, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { CheckInStatus } from '@/lib/types';

type Props = {
  mission: MissionTemplate;
  status?: CheckInStatus;
  onPress: () => void;
};

const STATUS_ICON: Record<CheckInStatus, keyof typeof Ionicons.glyphMap> = {
  missed: 'close',
  partial: 'remove',
  done: 'checkmark',
};

export function MissionCard({ mission, status, onPress }: Props) {
  const theme = useTheme();
  const statusColor =
    status === 'done' ? theme.success : status === 'partial' ? theme.warning : theme.danger;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.card}>
        <View style={[styles.icon, { backgroundColor: withAlpha(theme.primary, 0.12) }]}>
          <Ionicons name={mission.icon} size={18} color={theme.primary} />
        </View>
        <View style={styles.middle}>
          <ThemedText type="smallBold" style={styles.title}>
            {mission.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {mission.subtitle}
          </ThemedText>
        </View>
        <View
          style={[
            styles.status,
            status
              ? { backgroundColor: statusColor, borderColor: statusColor }
              : { backgroundColor: 'transparent', borderColor: theme.borderStrong },
          ]}>
          {status && <Ionicons name={STATUS_ICON[status]} size={16} color={theme.onPrimary} />}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: Radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15 },
  middle: { flex: 1, gap: 2 },
  status: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
