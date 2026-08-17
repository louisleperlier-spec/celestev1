import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Fonts, Radius, Spacing } from '@/constants/theme';
import { todayKey } from '@/lib/date';
import { GradeBadge } from '@/ui/components/GradeBadge';
import { EntryRow } from '@/ui/components/EntryRow';
import { Screen } from '@/ui/components/Screen';

import { useHydration } from './hydration-context';
import { DayStats, HydrationEntry } from './types';

interface Section {
  title: string;
  stats: DayStats;
  data: HydrationEntry[];
}

const HISTORY_DAYS = 30;

export function JournalView() {
  const { t } = useTranslation();
  const router = useRouter();
  const { statsForLastDays, deleteEntry } = useHydration();

  const sections = useMemo<Section[]>(() => {
    const days = statsForLastDays(HISTORY_DAYS).slice().reverse();
    return days
      .filter((day) => day.entries.length > 0)
      .map((day) => ({
        title: day.date === todayKey() ? t('journal.today') : formatDayLabel(day.date),
        stats: day,
        data: [...day.entries].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()),
      }));
  }, [statsForLastDays, t]);

  const confirmDelete = (entry: HydrationEntry) => {
    Alert.alert(t('journal.delete'), undefined, [
      { text: t('addEntry.cancel'), style: 'cancel' },
      { text: t('journal.delete'), style: 'destructive', onPress: () => void deleteEntry(entry.id) },
    ]);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('journal.title')}</Text>
        <Pressable style={styles.addButton} onPress={() => router.push('/add-entry')} hitSlop={12}>
          <SymbolView name="plus.circle.fill" size={26} tintColor={Colors.accent} />
        </Pressable>
      </View>

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t('journal.empty')}</Text>
          <Text style={styles.emptyHint}>{t('journal.emptyHint')}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EntryRow entry={item} onDelete={() => confirmDelete(item)} />}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionMeta}>
                <Text style={styles.sectionTotal}>{t('journal.total', { total: section.stats.totalMl })}</Text>
                <GradeBadge grade={section.stats.globalGrade} size="sm" />
              </View>
            </View>
          )}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews
          initialNumToRender={12}
          windowSize={7}
        />
      )}
    </Screen>
  );
}

function formatDayLabel(dateKeyValue: string): string {
  const date = new Date(`${dateKeyValue}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.title2,
    fontWeight: '700',
  },
  addButton: {
    padding: Spacing.one,
  },
  listContent: {
    paddingBottom: Spacing.six,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.callout,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  sectionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sectionTotal: {
    color: Colors.textMuted,
    fontSize: FontSize.footnote,
    fontFamily: Fonts.mono,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingBottom: Spacing.six,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSize.callout,
    fontWeight: '600',
  },
  emptyHint: {
    color: Colors.textMuted,
    fontSize: FontSize.footnote,
  },
});
