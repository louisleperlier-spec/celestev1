import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type Props = {
  color: string;
  label: string;
  value: string;
};

export function LegendRow({ color, label, value }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <ThemedText type="small">{label}</ThemedText>
      </View>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
