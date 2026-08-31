import { StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type Props = {
  value: string;
  label: string;
};

export function StatTile({ value, label }: Props) {
  return (
    <Card style={styles.tile}>
      <ThemedText type="displayMedium" style={styles.value}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
        {label}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.base + 2,
  },
  value: {
    fontSize: 28,
    lineHeight: 32,
  },
  label: {
    textAlign: 'center',
  },
});
