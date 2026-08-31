import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { DonutChart } from '@/components/donut-chart';
import { LegendRow } from '@/components/legend-row';
import { StatTile } from '@/components/stat-tile';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TrendLineChart } from '@/components/trend-line-chart';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDays, WEEKDAY_LABELS_SHORT } from '@/lib/date';
import { useEntries } from '@/lib/entries-store';
import { computeCurrentStreak, computeScoresForRange } from '@/lib/score';

type Period = 7 | 30;

export default function TendancesScreen() {
  const theme = useTheme();
  const { entries } = useEntries();
  const [period, setPeriod] = useState<Period>(7);

  const scores = useMemo(() => {
    const start = addDays(new Date(), -(period - 1));
    return computeScoresForRange(entries, start, period);
  }, [entries, period]);

  const daysWithData = scores.filter((s) => s.total > 0);
  const avg =
    daysWithData.length > 0
      ? Math.round(daysWithData.reduce((sum, s) => sum + s.total, 0) / daysWithData.length)
      : 0;
  const goodDays = scores.filter((s) => s.total >= 60).length;
  const streak = useMemo(() => computeCurrentStreak(entries, new Date()), [entries]);

  const distribution = { A: 0, B: 0, C: 0, D: 0 };
  for (const s of scores) distribution[s.grade]++;

  const points = scores.map((s, i) => ({
    label:
      period === 7
        ? WEEKDAY_LABELS_SHORT[(addDays(new Date(), -(period - 1) + i).getDay() + 6) % 7]
        : i % 5 === 0
          ? String(addDays(new Date(), -(period - 1) + i).getDate())
          : '',
    value: s.total,
  }));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="title" style={styles.title}>
            Tendances
          </ThemedText>

          <View style={[styles.toggle, { backgroundColor: theme.backgroundElement }]}>
            {([7, 30] as Period[]).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                style={[
                  styles.toggleBtn,
                  period === p && { backgroundColor: theme.primary },
                ]}>
                <ThemedText
                  type="smallBold"
                  style={period === p ? styles.toggleTextActive : undefined}
                  themeColor={period === p ? undefined : 'textSecondary'}>
                  {p} jours
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <View style={styles.statsRow}>
            <StatTile value={String(avg)} label="Score moyen" />
            <StatTile value={String(goodDays)} label="Bons jours (≥ B)" />
            <StatTile value={`${streak} j`} label="Série actuelle" />
          </View>

          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Évolution du score
          </ThemedText>
          <Card>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TrendLineChart points={points} color={theme.primary} />
            </ScrollView>
          </Card>

          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Répartition des scores
          </ThemedText>
          <Card style={styles.donutCard}>
            <DonutChart
              segments={[
                { value: distribution.A, color: theme.success },
                { value: distribution.B, color: theme.primary },
                { value: distribution.C, color: theme.warning },
                { value: distribution.D, color: theme.danger },
              ]}
            />
            <View style={styles.legend}>
              <LegendRow color={theme.success} label="A (80-100)" value={String(distribution.A)} />
              <LegendRow color={theme.primary} label="B (60-79)" value={String(distribution.B)} />
              <LegendRow color={theme.warning} label="C (40-59)" value={String(distribution.C)} />
              <LegendRow color={theme.danger} label="D (< 40)" value={String(distribution.D)} />
            </View>
          </Card>
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
    gap: Spacing.three,
  },
  title: { fontSize: 28, lineHeight: 32 },
  toggle: {
    flexDirection: 'row',
    borderRadius: Radius.pill,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  toggleTextActive: { color: '#FFFFFF' },
  statsRow: { flexDirection: 'row', gap: Spacing.two },
  sectionTitle: { marginTop: Spacing.two },
  donutCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  legend: { flex: 1 },
});
