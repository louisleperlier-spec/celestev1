import { SymbolView } from 'expo-symbols';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Colors, FontSize, Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/features/premium/theme-context';
import { usePremiumGate } from '@/features/premium/use-premium-gate';
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
  D: Colors.gradeD,
};

const GRADE_ORDER: Grade[] = ['A', 'B', 'C', 'D'];
const GRADE_RANGE_LABEL: Record<Grade, string> = {
  A: '80-100',
  B: '60-79',
  C: '40-59',
  D: '<40',
};

const PERIODS = [7, 30] as const;
type Period = (typeof PERIODS)[number];

export function TrendsView() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isPremium, guard } = usePremiumGate();
  const { statsForLastDays, settings } = useHydration();
  const [period, setPeriod] = useState<Period>(7);

  const days = useMemo(() => statsForLastDays(period), [statsForLastDays, period]);
  const activeDays = days.filter((d) => d.entries.length > 0);

  const averageScore = activeDays.length
    ? Math.round(activeDays.reduce((sum, d) => sum + d.globalScore, 0) / activeDays.length)
    : 0;
  const goodDays = activeDays.filter((d) => d.globalGrade === 'A' || d.globalGrade === 'B').length;
  const streak = useMemo(() => computeStreak(days), [days]);

  const gradeCounts = useMemo(() => {
    const counts: Record<Grade, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const d of activeDays) counts[d.globalGrade]++;
    return counts;
  }, [activeDays]);

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
    color: d.hydratingMl >= d.goalMl ? Colors.gradeA : theme.accentSoft,
  }));

  const metricAverages = useMemo(() => computeMetricAverages(activeDays), [activeDays]);

  const onSelectPeriod = (p: Period) => {
    if (p === 30 && !isPremium) {
      guard(() => setPeriod(p));
      return;
    }
    setPeriod(p);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('trends.title')}</Text>
          <View style={[styles.segmented, { backgroundColor: Colors.surface }]}>
            {PERIODS.map((p) => {
              const active = period === p;
              const locked = p === 30 && !isPremium;
              return (
                <Pressable
                  key={p}
                  onPress={() => onSelectPeriod(p)}
                  style={[styles.segment, active && { backgroundColor: theme.accentSoft }]}>
                  {locked && <SymbolView name="lock.fill" size={10} tintColor={theme.textMuted} />}
                  <Text style={[styles.segmentText, active && { color: theme.accent }]}>
                    {t(p === 7 ? 'trends.period7' : 'trends.period30')}
                  </Text>
                </Pressable>
              );
            })}
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
                    metricId={id}
                    label={t(`metrics.${id}`)}
                    score={metricAverages[id]}
                    grade={gradeFromScore(metricAverages[id])}
                  />
                ))}
              </View>
            </View>

            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>{t('trends.gradeDistribution')}</Text>
              <GradeDistributionRing counts={gradeCounts} />
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function GradeDistributionRing({ counts }: { counts: Record<Grade, number> }) {
  const { t } = useTranslation();
  const total = GRADE_ORDER.reduce((sum, g) => sum + counts[g], 0);
  const size = 140;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulative = 0;
  const segments = GRADE_ORDER.filter((g) => counts[g] > 0).map((g) => {
    const fraction = total > 0 ? counts[g] / total : 0;
    const length = fraction * circumference;
    const offset = cumulative;
    cumulative += length;
    return { grade: g, length, offset };
  });

  return (
    <View style={styles.distributionRow}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={center} cy={center} r={radius} stroke={Colors.surfaceElevated} strokeWidth={strokeWidth} fill="none" />
          {segments.map((seg) => (
            <Circle
              key={seg.grade}
              cx={center}
              cy={center}
              r={radius}
              stroke={GRADE_COLOR[seg.grade]}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${seg.length} ${circumference - seg.length}`}
              strokeDashoffset={-seg.offset}
              rotation={-90}
              origin={`${center}, ${center}`}
            />
          ))}
        </Svg>
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.distributionCenter}>
            <Text style={styles.distributionTotal}>{total}</Text>
            <Text style={styles.distributionTotalLabel}>{t('trends.daysLogged')}</Text>
          </View>
        </View>
      </View>
      <View style={styles.legend}>
        {GRADE_ORDER.map((g) => (
          <View key={g} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: GRADE_COLOR[g] }]} />
            <Text style={styles.legendLabel}>
              {g} ({GRADE_RANGE_LABEL[g]})
            </Text>
            <Text style={styles.legendCount}>{counts[g]}</Text>
          </View>
        ))}
      </View>
    </View>
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
    if (day.entries.length > 0 && (day.globalGrade === 'A' || day.globalGrade === 'B')) {
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
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  segmentText: {
    color: Colors.textMuted,
    fontSize: FontSize.footnote,
    fontWeight: '600',
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
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  distributionCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distributionTotal: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.title2,
    fontWeight: '700',
  },
  distributionTotalLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },
  legend: {
    flex: 1,
    gap: Spacing.two,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  legendLabel: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
  },
  legendCount: {
    color: Colors.text,
    fontSize: FontSize.footnote,
    fontWeight: '700',
    fontFamily: Fonts.mono,
  },
});
