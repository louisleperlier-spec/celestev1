import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { MissionCard } from '@/components/mission-card';
import { PillButton } from '@/components/pill-button';
import { StatTile } from '@/components/stat-tile';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MISSION_TEMPLATES } from '@/constants/missions';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDays, toDateKey, WEEKDAY_LABELS_SHORT } from '@/lib/date';
import { useCheckIns } from '@/lib/checkins-store';
import { computeDayScore } from '@/lib/score';
import { TIPS } from '@/lib/tips';
import type { CheckInStatus } from '@/lib/types';

type PlanView = 'jour' | 'semaine' | 'mois';

export default function PlanScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { checkIns } = useCheckIns();
  const [view, setView] = useState<PlanView>('jour');

  const today = useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);

  const statusByMission = useMemo(() => {
    const map = new Map<string, CheckInStatus>();
    for (const c of checkIns) {
      if (c.dateKey === todayKey) map.set(c.missionId, c.status);
    }
    return map;
  }, [checkIns, todayKey]);

  const pendingMission = MISSION_TEMPLATES.find((m) => !statusByMission.has(m.id));
  const tip = TIPS[new Date().getDate() % TIPS.length];

  const weekScores = useMemo(() => {
    const start = addDays(today, -6);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      return { date: d, score: computeDayScore(checkIns, d) };
    });
  }, [checkIns, today]);

  const monthScores = useMemo(() => {
    const start = addDays(today, -29);
    return Array.from({ length: 30 }, (_, i) => computeDayScore(checkIns, addDays(start, i)));
  }, [checkIns, today]);
  const monthAvg = Math.round(monthScores.reduce((s, d) => s + d.total, 0) / monthScores.length);
  const monthGoodDays = monthScores.filter((d) => d.total >= 60).length;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="title" style={styles.title}>
            Ton plan
          </ThemedText>

          <View style={[styles.toggle, { backgroundColor: theme.backgroundElement }]}>
            {([
              ['jour', 'Jour'],
              ['semaine', 'Semaine'],
              ['mois', 'Mois'],
            ] as [PlanView, string][]).map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => setView(key)}
                style={[styles.toggleBtn, view === key && { backgroundColor: theme.primary }]}>
                <ThemedText
                  type="smallBold"
                  style={view === key ? styles.toggleTextActive : undefined}
                  themeColor={view === key ? undefined : 'textSecondary'}>
                  {label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {view === 'jour' && (
            <>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                TES MISSIONS DU JOUR
              </ThemedText>
              <View style={styles.missions}>
                {MISSION_TEMPLATES.map((m) => (
                  <MissionCard
                    key={m.id}
                    mission={m}
                    status={statusByMission.get(m.id)}
                    onPress={() =>
                      router.push({ pathname: '/check-in', params: { missionId: m.id } })
                    }
                  />
                ))}
              </View>

              <Card style={styles.tipCard}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                  CONSEIL DU JOUR
                </ThemedText>
                <ThemedText style={styles.tipBody}>{tip.body}</ThemedText>
              </Card>

              <PillButton
                title={
                  pendingMission ? 'Démarrer ma journée' : 'Journée complétée ✓'
                }
                onPress={() => {
                  if (pendingMission) {
                    router.push({ pathname: '/check-in', params: { missionId: pendingMission.id } });
                  }
                }}
                disabled={!pendingMission}
                style={styles.cta}
              />
            </>
          )}

          {view === 'semaine' && (
            <View style={styles.weekRow}>
              {weekScores.map(({ date, score }) => (
                <Card key={score.dateKey} style={styles.weekCell}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {WEEKDAY_LABELS_SHORT[(date.getDay() + 6) % 7]}
                  </ThemedText>
                  <ThemedText type="smallBold" style={{ color: theme.primary }}>
                    {score.total}
                  </ThemedText>
                </Card>
              ))}
            </View>
          )}

          {view === 'mois' && (
            <View style={styles.statsRow}>
              <StatTile value={String(monthAvg)} label="Score moyen (30j)" />
              <StatTile value={String(monthGoodDays)} label="Bons jours (≥ 60)" />
            </View>
          )}
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
  sectionLabel: { letterSpacing: 1 },
  missions: { gap: Spacing.two },
  tipCard: { gap: Spacing.two },
  tipBody: { lineHeight: 20 },
  cta: { marginTop: Spacing.two },
  weekRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  weekCell: { flexBasis: '12%', flexGrow: 1, alignItems: 'center', gap: 4, paddingVertical: Spacing.two },
  statsRow: { flexDirection: 'row', gap: Spacing.two },
});
