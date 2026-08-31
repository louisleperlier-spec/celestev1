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
          <View
            key={key}
            style={[
              styles.dot,
              done
                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                : { backgroundColor: 'transparent', borderColor: theme.borderStrong },
              isToday && !done && { borderColor: theme.primary },
            ]}>
            {done && <Ionicons name="checkmark" size={14} color={theme.onPrimary} />}
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
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});
