import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { PillBadge } from '@/components/pill-badge';
import { PillarBar } from '@/components/pillar-bar';
import { PillButton } from '@/components/pill-button';
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
  const router = useRouter();
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
          <ThemedText type="sectionLabel" style={styles.brand}>
            SelfMax
          </ThemedText>

          <ThemedText type="sectionLabel" style={styles.sectionLabel}>
            Max Score
          </ThemedText>

          <View style={styles.ringWrap}>
            <ScoreRing value={todayScore.total} />
            {delta !== 0 && (
              <PillBadge
                label={`${delta > 0 ? '+' : ''}${delta} pts depuis hier`}
                color={delta > 0 ? theme.primary : theme.textSecondary}
              />
            )}
          </View>

          <Card style={styles.card}>
            <View style={styles.streakHeader}>
              <ThemedText type="sectionLabel">Série actuelle</ThemedText>
              <ThemedText type="smallBold">🔥 {streak} j</ThemedText>
            </View>
            <StreakRow checkIns={checkIns} today={today} />
          </Card>

          <Card style={styles.card}>
            <ThemedText type="sectionLabel">Piliers</ThemedText>
            <View style={styles.bars}>
              {PILLARS.map((p) => (
                <PillarBar key={p.id} pillar={p} value={todayScore.byPillar[p.id]} />
              ))}
            </View>
          </Card>

          <PillButton
            title="Lancer un scan"
            icon="scan"
            variant="secondary"
            onPress={() => router.push('/add-scan')}
            style={styles.scanCta}
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: BottomTabInset + Spacing.lg,
    gap: Spacing.base,
    alignItems: 'center',
  },
  brand: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  sectionLabel: {
    marginTop: Spacing.sm,
  },
  ringWrap: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  card: {
    alignSelf: 'stretch',
    gap: Spacing.base,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bars: {
    gap: Spacing.base,
  },
  scanCta: {
    alignSelf: 'stretch',
  },
});
