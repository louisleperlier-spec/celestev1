import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { CategoryBar } from '@/components/category-bar';
import { PillButton } from '@/components/pill-button';
import { QuickAddTile } from '@/components/quick-add-tile';
import { ScoreRing } from '@/components/score-ring';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CATEGORIES } from '@/constants/categories';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useEntries } from '@/lib/entries-store';
import { computeCurrentStreak, computeDayScore, GRADE_LABEL } from '@/lib/score';
import { todayKey } from '@/lib/date';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { entries } = useEntries();

  const dateKey = todayKey();
  const todayEntries = useMemo(
    () => entries.filter((e) => e.dateKey === dateKey),
    [entries, dateKey]
  );
  const dayScore = useMemo(() => computeDayScore(dateKey, todayEntries), [dateKey, todayEntries]);
  const streak = useMemo(() => computeCurrentStreak(entries, new Date()), [entries]);

  const gradeColor =
    dayScore.grade === 'A'
      ? theme.success
      : dayScore.grade === 'B'
        ? theme.primary
        : dayScore.grade === 'C'
          ? theme.warning
          : theme.danger;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <ThemedText themeColor="textSecondary">Bonjour 👋</ThemedText>
              <ThemedText type="title" style={styles.appName}>
                SelfMax
              </ThemedText>
            </View>
            {streak > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: theme.accentLight }]}>
                <ThemedText type="smallBold" style={{ color: theme.accent }}>
                  🔥 {streak} j
                </ThemedText>
              </View>
            )}
          </View>

          <Card style={styles.scoreCard}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Ton Self Score du jour
            </ThemedText>
            <ScoreRing value={dayScore.total} color={gradeColor} sublabel={dayScore.grade} />
            <ThemedText type="smallBold" style={{ color: gradeColor }}>
              {GRADE_LABEL[dayScore.grade]}
            </ThemedText>

            <View style={styles.bars}>
              {CATEGORIES.map((c) => (
                <CategoryBar key={c.id} category={c} points={dayScore.byCategory[c.id]} />
              ))}
            </View>
          </Card>

          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold">Ajout rapide</ThemedText>
          </View>
          <View style={styles.grid}>
            {CATEGORIES.map((c) => (
              <QuickAddTile
                key={c.id}
                category={c}
                points={dayScore.byCategory[c.id]}
                onPress={() =>
                  router.push({ pathname: '/add-entry', params: { category: c.id } })
                }
              />
            ))}
          </View>

          <PillButton
            title="+ Ajouter une entrée"
            onPress={() => router.push('/add-entry')}
            style={styles.cta}
          />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: Spacing.two,
  },
  appName: {
    fontSize: 30,
    lineHeight: 34,
  },
  streakBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 999,
  },
  scoreCard: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  bars: {
    alignSelf: 'stretch',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  sectionHeader: {
    marginTop: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  cta: {
    marginTop: Spacing.two,
  },
});
