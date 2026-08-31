import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { PillButton } from '@/components/pill-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getCategory } from '@/constants/categories';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDayLong, formatTime, startOfWeek, toDateKey, WEEKDAY_LABELS_SHORT, addDays } from '@/lib/date';
import { useEntries } from '@/lib/entries-store';
import { computeDayScore } from '@/lib/score';
import type { Entry } from '@/lib/types';

export default function JournalScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { entries, removeEntry } = useEntries();
  const [selected, setSelected] = useState(() => new Date());
  const [now] = useState(() => Date.now());

  const week = useMemo(() => {
    const start = startOfWeek(selected);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selected]);

  const selectedKey = toDateKey(selected);
  const dayEntries = useMemo(
    () =>
      entries
        .filter((e) => e.dateKey === selectedKey)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [entries, selectedKey]
  );
  const dayScore = useMemo(() => computeDayScore(selectedKey, dayEntries), [selectedKey, dayEntries]);

  const renderItem = ({ item }: { item: Entry }) => {
    const category = getCategory(item.category);
    return (
      <Card style={styles.entryCard}>
        <View style={[styles.entryIcon, { backgroundColor: category.colorLight }]}>
          <Ionicons name={category.icon} size={18} color={category.color} />
        </View>
        <View style={styles.entryMiddle}>
          <ThemedText type="smallBold">{item.label}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatTime(item.createdAt)} · {category.label}
          </ThemedText>
        </View>
        <View style={styles.entryRight}>
          <ThemedText type="smallBold" style={{ color: category.color }}>
            +{item.points}
          </ThemedText>
          <Pressable hitSlop={10} onPress={() => removeEntry(item.id)}>
            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>
      </Card>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.headerRow}>
          <ThemedText type="title" style={styles.title}>
            Journal
          </ThemedText>
        </View>

        <View style={styles.weekRow}>
          {week.map((d) => {
            const key = toDateKey(d);
            const isSelected = key === selectedKey;
            const isFuture = d.getTime() > now;
            return (
              <Pressable
                key={key}
                disabled={isFuture}
                onPress={() => setSelected(d)}
                style={[
                  styles.dayPill,
                  isSelected && { backgroundColor: theme.primary },
                  isFuture && { opacity: 0.35 },
                ]}>
                <ThemedText
                  type="small"
                  themeColor={isSelected ? undefined : 'textSecondary'}
                  style={isSelected && styles.daySelectedText}>
                  {WEEKDAY_LABELS_SHORT[(d.getDay() + 6) % 7]}
                </ThemedText>
                <ThemedText
                  type="smallBold"
                  themeColor={isSelected ? undefined : 'text'}
                  style={isSelected && styles.daySelectedText}>
                  {d.getDate()}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <FlatList
          data={dayEntries}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <ThemedText themeColor="textSecondary" style={styles.dayLabel}>
              {formatDayLong(selected)}
            </ThemedText>
          }
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              Rien de loggé ce jour-là.
            </ThemedText>
          }
          ListFooterComponent={
            <View>
              <Card style={styles.totalCard}>
                <ThemedText type="smallBold">Total du jour</ThemedText>
                <ThemedText type="smallBold">{dayScore.total} / 100</ThemedText>
              </Card>
              <PillButton
                title="+ Ajouter une entrée"
                onPress={() =>
                  router.push({ pathname: '/add-entry', params: { dateKey: selectedKey } })
                }
                style={styles.cta}
              />
            </View>
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, alignItems: 'center', width: '100%' },
  headerRow: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
  },
  title: { fontSize: 28, lineHeight: 32 },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  dayPill: {
    width: 40,
    height: 56,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  daySelectedText: { color: '#FFFFFF' },
  dayLabel: {
    textTransform: 'capitalize',
    marginBottom: Spacing.two,
  },
  list: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.two,
  },
  empty: {
    textAlign: 'center',
    marginVertical: Spacing.five,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  entryIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryMiddle: { flex: 1, gap: 2 },
  entryRight: { alignItems: 'flex-end', gap: 6 },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  cta: { marginTop: Spacing.three },
});
