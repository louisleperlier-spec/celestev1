import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { addDays, toDateKey } from '@/lib/date';
import type { CheckIn } from '@/lib/types';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  checkIns: CheckIn[];
  today: Date;
  days?: number;
};

export function StreakRow({ checkIns, today, days = 7 }: Props) {
  const theme = useTheme();
  const start = addDays(today, -(days - 1));
  const cells = Array.from({ length: days }, (_, i) => addDays(start, i));

  return (
    <View style={styles.row}>
      {cells.map((d) => {
        const key = toDateKey(d);
        const done = checkIns.some((c) => c.dateKey === key && c.status !== 'missed');
        const isToday = key === toDateKey(today);
        return (
          <View key={key} style={styles.cell}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: done ? theme.primary : theme.backgroundElement,
                  borderColor: isToday ? theme.primary : 'transparent',
                },
              ]}>
              {done && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  cell: {
    alignItems: 'center',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
