import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FontSize, Fonts, Radius, Spacing } from '@/constants/theme';
import { usePremiumGate } from '@/features/premium/use-premium-gate';
import { useTheme } from '@/features/premium/theme-context';
import { addDays, dateKey, todayKey } from '@/lib/date';
import { GradeBadge } from '@/ui/components/GradeBadge';
import { EntryRow } from '@/ui/components/EntryRow';
import { Screen } from '@/ui/components/Screen';

import { useHydration } from './hydration-context';
import { HydrationEntry } from './types';

const FREE_HISTORY_DAYS = 7;

function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = dimanche
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

export function JournalView() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { isPremium, guard } = usePremiumGate();
  const { statsForDate, deleteEntry } = useHydration();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(todayKey());

  const weekDays = useMemo(() => {
    const monday = mondayOf(addDays(new Date(), weekOffset * 7));
    return Array.from({ length: 7 }, (_, i) => dateKey(addDays(monday, i)));
  }, [weekOffset]);

  const freeCutoff = useMemo(() => dateKey(addDays(new Date(), -(FREE_HISTORY_DAYS - 1))), []);

  const stats = statsForDate(selectedDate);
  const entries = [...stats.entries].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
  const isLocked = !isPremium && selectedDate < freeCutoff;

  const selectDay = (day: string) => {
    if (!isPremium && day < freeCutoff) {
      guard(() => setSelectedDate(day));
      return;
    }
    setSelectedDate(day);
  };

  const goToPreviousWeek = () => {
    const targetMonday = dateKey(mondayOf(addDays(new Date(), (weekOffset - 1) * 7)));
    if (!isPremium && targetMonday < freeCutoff) {
      guard(() => setWeekOffset(weekOffset - 1));
      return;
    }
    setWeekOffset(weekOffset - 1);
  };

  const jumpToToday = () => {
    setWeekOffset(0);
    setSelectedDate(todayKey());
  };

  const confirmDelete = (entry: HydrationEntry) => {
    Alert.alert(t('journal.delete'), undefined, [
      { text: t('addEntry.cancel'), style: 'cancel' },
      { text: t('journal.delete'), style: 'destructive', onPress: () => void deleteEntry(entry.id) },
    ]);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{t('journal.title')}</Text>
        <Pressable style={styles.calendarButton} onPress={jumpToToday} hitSlop={12} accessibilityLabel={t('journal.today')}>
          <SymbolView name="calendar" size={20} tintColor={theme.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        <Pressable onPress={goToPreviousWeek} hitSlop={10} style={styles.weekArrow}>
          <SymbolView name="chevron.left" size={14} tintColor={theme.textMuted} />
        </Pressable>
        <View style={styles.dayStrip}>
          {weekDays.map((day) => {
            const isSelected = day === selectedDate;
            const locked = !isPremium && day < freeCutoff;
            const date = new Date(`${day}T00:00:00`);
            return (
              <Pressable key={day} onPress={() => selectDay(day)} style={styles.dayCell}>
                <Text style={[styles.dayLetter, { color: theme.textMuted }]}>
                  {date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3)}
                </Text>
                <View style={[styles.dayNumberWrap, isSelected && { backgroundColor: theme.accent }]}>
                  {locked ? (
                    <SymbolView name="lock.fill" size={10} tintColor={isSelected ? theme.accentText : theme.textMuted} />
                  ) : (
                    <Text style={[styles.dayNumber, { color: theme.text }, isSelected && { color: theme.accentText }]}>
                      {date.getDate()}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={() => weekOffset < 0 && setWeekOffset(weekOffset + 1)} hitSlop={10} style={styles.weekArrow}>
          {weekOffset < 0 && <SymbolView name="chevron.right" size={14} tintColor={theme.textMuted} />}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {isLocked ? (
          <Pressable style={styles.lockCard} onPress={() => router.push('/paywall')}>
            <SymbolView name="lock.fill" size={16} tintColor={theme.accent} />
            <Text style={[styles.lockText, { color: theme.textSecondary }]}>{t('journal.historyLockedHint')}</Text>
            <Text style={[styles.lockAction, { color: theme.accent }]}>{t('journal.unlockHistory')}</Text>
          </Pressable>
        ) : entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('journal.empty')}</Text>
            <Text style={[styles.emptyHint, { color: theme.textMuted }]}>{t('journal.emptyHint')}</Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{formatDayLabel(selectedDate)}</Text>
              <GradeBadge grade={stats.globalGrade} size="sm" />
            </View>
            {entries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} onDelete={() => confirmDelete(entry)} />
            ))}
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.text }]}>{t('journal.total', { total: stats.totalMl })}</Text>
              <Text style={[styles.goalLine, { color: theme.textMuted }]}>{t('journal.goalLine', { goal: stats.goalMl })}</Text>
            </View>
          </>
        )}

        <Pressable
          style={[styles.addButton, { backgroundColor: theme.accent }]}
          onPress={() => router.push('/add-entry')}>
          <SymbolView name="plus" size={16} tintColor={theme.accentText} />
          <Text style={[styles.addButtonText, { color: theme.accentText }]}>{t('journal.addEntryCta')}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function formatDayLabel(dateKeyValue: string): string {
  const date = new Date(`${dateKeyValue}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
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
    fontSize: FontSize.title2,
    fontWeight: '700',
  },
  calendarButton: {
    padding: Spacing.one,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  weekArrow: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayStrip: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    alignItems: 'center',
    gap: 6,
  },
  dayLetter: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dayNumberWrap: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: FontSize.footnote,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: Spacing.six,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: FontSize.callout,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  totalRow: {
    marginTop: Spacing.three,
    gap: 2,
  },
  totalLabel: {
    fontSize: FontSize.title3,
    fontWeight: '700',
    fontFamily: Fonts.mono,
  },
  goalLine: {
    fontSize: FontSize.footnote,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 52,
    borderRadius: Radius.md,
    marginTop: Spacing.four,
  },
  addButtonText: {
    fontSize: FontSize.body,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.six,
  },
  emptyTitle: {
    fontSize: FontSize.callout,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: FontSize.footnote,
  },
  lockCard: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.five,
  },
  lockText: {
    fontSize: FontSize.footnote,
    textAlign: 'center',
  },
  lockAction: {
    fontSize: FontSize.footnote,
    fontWeight: '700',
  },
});
