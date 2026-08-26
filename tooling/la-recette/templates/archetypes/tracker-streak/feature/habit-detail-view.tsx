// Archétype tracker-streak — écran DÉTAIL : le streak en grand, les 7 derniers jours,
// et le bouton pour cocher/décocher aujourd'hui. Corps monté par `app/habit/[id].tsx`.
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/ui/components/button';

import { dayKey } from './streak';
import { useDeleteHabit, useHabits, useToggleToday } from './use-habits';

/** Les 7 derniers jours (clés YYYY-MM-DD), du plus ancien au plus récent. */
function lastSevenDays(): string[] {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(dayKey(d));
  }
  return out;
}

export function HabitDetailView({ id, onBack }: { id: string; onBack: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data } = useHabits();
  const toggle = useToggleToday();
  const remove = useDeleteHabit();

  const habit = data.find((h) => h.id === id);
  if (!habit) {
    return (
      <ThemedText type="small" themeColor="textSecondary" style={styles.pad}>
        {t('habits.notFound')}
      </ThemedText>
    );
  }

  const checked = new Set(habit.days);
  const week = lastSevenDays();

  function confirmDelete() {
    Alert.alert(t('habits.deleteConfirm'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          remove.mutate(id);
          onBack();
        },
      },
    ]);
  }

  return (
    <View style={styles.content}>
      <ThemedText type="title" numberOfLines={2}>
        {habit.name}
      </ThemedText>
      <ThemedText type="subtitle" themeColor="accent">
        {habit.streak > 0 ? t('habits.streakLabel', { days: habit.streak }) : t('habits.noStreak')}
      </ThemedText>

      <View style={styles.week}>
        {week.map((d) => (
          <View
            key={d}
            style={[
              styles.dot,
              {
                backgroundColor: checked.has(d) ? theme.accent : theme.surfaceElevated,
                borderColor: theme.border,
              },
            ]}
          />
        ))}
      </View>

      <Button
        label={habit.doneToday ? t('habits.uncheckToday') : t('habits.checkToday')}
        variant={habit.doneToday ? 'secondary' : 'primary'}
        onPress={() => toggle.mutate({ habitId: id, done: !habit.doneToday })}
      />
      <Button label={t('common.delete')} variant="ghost" onPress={confirmDelete} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, gap: Spacing.four, paddingTop: Spacing.four },
  week: { flexDirection: 'row', gap: Spacing.two },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1 },
  pad: { padding: Spacing.four },
});
