// Archétype tracker-streak — écran LISTE : chaque habitude avec sa grosse coche du jour
// et son streak. Cocher fait bouger le streak immédiatement (le moment magique).
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';

import { type HabitWithStats } from './types';
import { useCreateHabit, useDeleteHabit, useHabits, useToggleToday } from './use-habits';

export function HabitsListView() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useHabits();
  const toggle = useToggleToday();
  const create = useCreateHabit();
  const remove = useDeleteHabit();

  function onNew() {
    Alert.prompt(t('habits.new'), t('habits.namePlaceholder'), (name) => {
      if (name?.trim()) create.mutate(name.trim());
    });
  }

  function renderRow({ item }: { item: HabitWithStats }) {
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/habit/[id]', params: { id: item.id } })}
        onLongPress={() =>
          Alert.alert(item.name, undefined, [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.delete'), style: 'destructive', onPress: () => remove.mutate(item.id) },
          ])
        }
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.5 }]}>
        <Pressable
          hitSlop={10}
          onPress={() => {
            haptics.tap();
            toggle.mutate({ habitId: item.id, done: !item.doneToday });
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.doneToday }}>
          <SymbolView
            name={item.doneToday ? 'checkmark.circle.fill' : 'circle'}
            size={28}
            tintColor={item.doneToday ? theme.accent : theme.textMuted}
          />
        </Pressable>
        <View style={styles.rowText}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {item.streak > 0 ? t('habits.streakLabel', { days: item.streak }) : t('habits.noStreak')}
          </ThemedText>
        </View>
        <SymbolView name="chevron.right" size={13} tintColor={theme.textMuted} />
      </Pressable>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <ThemedText type="title" numberOfLines={1} style={styles.flex}>
          {t('habits.title')}
        </ThemedText>
        <Pressable
          hitSlop={10}
          onPress={onNew}
          accessibilityRole="button"
          accessibilityLabel={t('habits.new')}>
          <SymbolView name="plus.circle.fill" size={30} tintColor={theme.accent} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : isError ? (
        <Pressable onPress={refetch} style={styles.center} accessibilityRole="button">
          <ThemedText type="small" themeColor="danger">
            {t('common.loadError')}
          </ThemedText>
          <ThemedText type="smallBold" themeColor="accent">
            {t('common.retry')}
          </ThemedText>
        </Pressable>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(h) => h.id}
          renderItem={renderRow}
          ItemSeparatorComponent={() => (
            <View style={[styles.sep, { backgroundColor: theme.border }]} />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                {t('habits.empty')}
              </ThemedText>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    minHeight: 60,
  },
  rowText: { flex: 1, gap: 2 },
  sep: { height: StyleSheet.hairlineWidth },
  center: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.six,
  },
  empty: { textAlign: 'center', maxWidth: 260 },
  listContent: { paddingBottom: Spacing.six, flexGrow: 1 },
});
