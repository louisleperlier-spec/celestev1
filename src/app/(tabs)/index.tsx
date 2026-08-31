import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { PillarBar } from '@/components/pillar-bar';
import { ScoreRing } from '@/components/score-ring';
import { StreakRow } from '@/components/streak-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PILLARS } from '@/constants/piliers';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDays } from '@/lib/date';
import { useCheckIns } from '@/lib/checkins-store';
import { computeCurrentStreak, computeDayScore } from '@/lib/score';

export default function HomeScreen() {
  const theme = useTheme();
  const { checkIns } = useCheckIns();

  const today = useMemo(() => new Date(), []);
  const yesterday = useMemo(() => addDays(today, -1), [today]);

  const todayScore = useMemo(() => computeDayScore(checkIns, today), [checkIns, today]);
  const yesterdayScore = useMemo(() => computeDayScore(checkIns, yesterday), [checkIns, yesterday]);
  const delta = todayScore.total - yesterdayScore.total;
  const streak = useMemo(() => computeCurrentStreak(checkIns, today), [checkIns, today]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.brand}>
            SELFMAX
          </ThemedText>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            MAX SCORE
          </ThemedText>

          <View style={styles.ringWrap}>
            <ScoreRing value={todayScore.total} color={theme.primary} />
            {delta !== 0 && (
              <ThemedText type="smallBold" style={{ color: theme.primary, marginTop: Spacing.two }}>
                {delta > 0 ? '+' : ''}
                {delta} pts depuis hier
              </ThemedText>
            )}
          </View>

          <Card style={styles.card}>
            <View style={styles.streakHeader}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                SÉRIE ACTUELLE
              </ThemedText>
              <ThemedText type="smallBold">🔥 {streak} j</ThemedText>
            </View>
            <StreakRow checkIns={checkIns} today={today} />
          </Card>

          <Card style={styles.card}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.pillarsLabel}>
              PILIERS
            </ThemedText>
            <View style={styles.bars}>
              {PILLARS.map((p) => (
                <PillarBar key={p.id} pillar={p} value={todayScore.byPillar[p.id]} />
              ))}
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
    alignItems: 'center',
  },
  brand: {
    alignSelf: 'flex-start',
    letterSpacing: 1,
    marginTop: Spacing.two,
  },
  sectionLabel: {
    letterSpacing: 1,
    marginTop: Spacing.two,
  },
  ringWrap: {
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  card: {
    alignSelf: 'stretch',
    gap: Spacing.three,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pillarsLabel: {
    letterSpacing: 1,
  },
  bars: {
    gap: Spacing.three,
  },
});
