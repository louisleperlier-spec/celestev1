import { StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';

type Props = {
  value: string;
  label: string;
};

export function StatTile({ value, label }: Props) {
  return (
    <Card style={styles.tile}>
      <ThemedText style={styles.value}>{value}</ThemedText>
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
    gap: 4,
    paddingVertical: 18,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
  },
  label: {
    textAlign: 'center',
  },
});
