import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import type { MissionTemplate } from '@/constants/missions';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { CheckInStatus } from '@/lib/types';

type Props = {
  mission: MissionTemplate;
  status?: CheckInStatus;
  onPress: () => void;
};

const STATUS_ICON: Record<CheckInStatus, keyof typeof Ionicons.glyphMap> = {
  missed: 'close-circle',
  partial: 'remove-circle',
  done: 'checkmark-circle',
};

export function MissionCard({ mission, status, onPress }: Props) {
  const theme = useTheme();
  const statusColor =
    status === 'done' ? theme.success : status === 'partial' ? theme.warning : status === 'missed' ? theme.danger : theme.textSecondary;

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={[styles.icon, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name={mission.icon} size={20} color={theme.text} />
        </View>
        <View style={styles.middle}>
          <ThemedText type="smallBold">{mission.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {mission.subtitle}
          </ThemedText>
        </View>
        <Ionicons
          name={status ? STATUS_ICON[status] : 'ellipse-outline'}
          size={26}
          color={statusColor}
        />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: { flex: 1, gap: 2 },
});
