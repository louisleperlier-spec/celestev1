import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Fonts, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/ui/components/Card';
import { BarChart, BarChartDatum } from '@/ui/components/BarChart';
import { MetricCard } from '@/ui/components/MetricCard';
import { Screen } from '@/ui/components/Screen';

import { useHydration } from './hydration-context';
import { gradeFromScore } from './scoring';
import { DayStats, Grade, MetricId } from './types';

const GRADE_COLOR: Record<Grade, string> = {
  A: Colors.gradeA,
  B: Colors.gradeB,
  C: Colors.gradeC,
};

const PERIODS = [7, 30] as const;
type Period = (typeof PERIODS)[number];

export function TrendsView() {
  const { t } = useTranslation();
  const { statsForLastDays, settings } = useHydration();
  const [period, setPeriod] = useState<Period>(7);

  const days = useMemo(() => statsForLastDays(period), [statsForLastDays, period]);
  const activeDays = days.filter((d) => d.entries.length > 0);

  const averageScore = activeDays.length
    ? Math.round(activeDays.reduce((sum, d) => sum + d.globalScore, 0) / activeDays.length)
    : 0;
  const goodDays = activeDays.filter((d) => d.globalGrade !== 'C').length;
  const streak = useMemo(() => computeStreak(days), [days]);

  const scoreData: BarChartDatum[] = days.map((d) => ({
    key: d.date,
    label: shortDayLabel(d.date),
    value: d.entries.length > 0 ? d.globalScore : 0,
    color: d.entries.length > 0 ? GRADE_COLOR[d.globalGrade] : Colors.surfaceElevated,
  }));

  const volumeData: BarChartDatum[] = days.map((d) => ({
    key: d.date,
    label: shortDayLabel(d.date),
    value: d.hydratingMl,
    color: d.hydratingMl >= d.goalMl ? Colors.gradeA : Colors.accentSoft,
  }));

  const metricAverages = useMemo(() => computeMetricAverages(activeDays), [activeDays]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('trends.title')}</Text>
          <View style={styles.segmented}>
            {PERIODS.map((p) => (
              <Pressable key={p} onPress={() => setPeriod(p)} style={[styles.segment, period === p && styles.segmentActive]}>
                <Text style={[styles.segmentText, period === p && styles.segmentTextActive]}>
                  {t(p === 7 ? 'trends.period7' : 'trends.period30')}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{averageScore}</Text>
            <Text style={styles.statLabel}>{t('trends.averageScore')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{goodDays}</Text>
            <Text style={styles.statLabel}>{t('trends.goodDays')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{t('trends.streakDays', { count: streak })}</Text>
            <Text style={styles.statLabel}>{t('trends.streak')}</Text>
          </Card>
        </View>

        {activeDays.length === 0 ? (
          <Card>
            <Text style={styles.noData}>{t('trends.noData')}</Text>
          </Card>
        ) : (
          <>
            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>{t('trends.scoreHistory')}</Text>
              <BarChart data={scoreData} maxValue={100} referenceValue={60} />
            </Card>

            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>{t('trends.volumeHistory')}</Text>
              <BarChart
                data={volumeData}
                maxValue={Math.max(settings.dailyGoalMl, ...volumeData.map((d) => d.value)) * 1.1}
                referenceValue={settings.dailyGoalMl}
              />
            </Card>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('trends.metricBreakdown')}</Text>
              <View style={styles.metricsGrid}>
                {(Object.keys(metricAverages) as MetricId[]).map((id) => (
                  <MetricCard
                    key={id}
                    label={t(`metrics.${id}`)}
                    score={metricAverages[id]}
                    grade={gradeFromScore(metricAverages[id])}
                  />
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function shortDayLabel(dateKeyValue: string): string {
  const date = new Date(`${dateKeyValue}T00:00:00`);
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'numeric' });
}

function computeStreak(daysAscending: DayStats[]): number {
  let streak = 0;
  for (let i = daysAscending.length - 1; i >= 0; i--) {
    const day = daysAscending[i];
    if (day.entries.length > 0 && day.globalGrade !== 'C') {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

function computeMetricAverages(days: DayStats[]): Record<MetricId, number> {
  const ids: MetricId[] = ['volume', 'regularity', 'timing', 'quality'];
  const result = {} as Record<MetricId, number>;
  for (const id of ids) {
    result[id] = days.length ? Math.round(days.reduce((sum, d) => sum + d.metrics[id].score, 0) / days.length) : 0;
  }
  return result;
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  header: {
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.title2,
    fontWeight: '700',
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: Colors.accentSoft,
  },
  segmentText: {
    color: Colors.textMuted,
    fontSize: FontSize.footnote,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: Colors.accent,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    color: Colors.text,
    fontSize: FontSize.title3,
    fontFamily: Fonts.mono,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  chartCard: {
    gap: Spacing.three,
  },
  chartTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  section: {
    gap: Spacing.three,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  noData: {
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
});
