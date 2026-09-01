import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { RadarChart } from '@/components/radar-chart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TrendLineChart, TrendLineChartEmpty } from '@/components/trend-line-chart';
import { PILLARS } from '@/constants/piliers';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDayLong, WEEKDAY_LABELS_SHORT } from '@/lib/date';
import { useCheckIns } from '@/lib/checkins-store';
import { computeDayScore, scoreHistory } from '@/lib/score';

type ProgresTab = 'apercu' | 'corps' | 'performances';

export default function ProgresScreen() {
  const theme = useTheme();
  const { checkIns, scans } = useCheckIns();
  const [tab, setTab] = useState<ProgresTab>('apercu');

  const today = useMemo(() => new Date(), []);
  const history = useMemo(() => scoreHistory(checkIns, 7, today), [checkIns, today]);
  const todayScore = useMemo(() => computeDayScore(checkIns, today), [checkIns, today]);

  const chartPoints = history.map((h) => {
    const [y, m, d] = h.dateKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return { label: WEEKDAY_LABELS_SHORT[(date.getDay() + 6) % 7], value: h.total };
  });

  const radarAxes = PILLARS.map((p) => ({ label: p.label, value: todayScore.byPillar[p.id] }));
  const hasHistory = history.some((h) => h.total > 0);

  const sortedScans = useMemo(
    () => [...scans].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [scans]
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="title">Progrès</ThemedText>

          <View style={[styles.toggle, { backgroundColor: theme.surface2 }]}>
            {([
              ['apercu', 'Aperçu'],
              ['corps', 'Corps'],
              ['performances', 'Performances'],
            ] as [ProgresTab, string][]).map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                style={[styles.toggleBtn, tab === key && { backgroundColor: theme.primary }]}>
                <ThemedText
                  type="small"
                  style={tab === key ? { color: theme.onPrimary } : undefined}
                  themeColor={tab === key ? undefined : 'textSecondary'}>
                  {label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {tab === 'apercu' && (
            <>
              <ThemedText type="sectionLabel">Évolution du Max Score</ThemedText>
              <Card>
                {hasHistory ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TrendLineChart points={chartPoints} color={theme.primary} />
                  </ScrollView>
                ) : (
                  <TrendLineChartEmpty />
                )}
              </Card>

              <ThemedText type="sectionLabel">Répartition des piliers</ThemedText>
              <Card style={styles.radarCard}>
                <RadarChart axes={radarAxes} color={theme.primary} size={220} />
                <View style={styles.legend}>
                  {PILLARS.map((p) => (
                    <View key={p.id} style={styles.legendRow}>
                      <View style={styles.legendLeft}>
                        <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
                        <ThemedText type="small">{p.label}</ThemedText>
                      </View>
                      <ThemedText type="smallBold">{todayScore.byPillar[p.id]}</ThemedText>
                    </View>
                  ))}
                </View>
              </Card>
            </>
          )}

          {tab === 'corps' && (
            <View style={{ gap: Spacing.sm }}>
              {sortedScans.length === 0 ? (
                <ThemedText themeColor="textSecondary" style={styles.empty}>
                  Aucun scan enregistré pour l&apos;instant. Va dans l&apos;onglet Scan pour ajouter
                  tes premières mesures.
                </ThemedText>
              ) : (
                sortedScans.map((s) => (
                  <Card key={s.id} style={styles.scanRow}>
                    <ThemedText type="smallBold">{formatDayLong(new Date(s.createdAt))}</ThemedText>
                    <View style={styles.scanValues}>
                      {s.weightKg != null && (
                        <ThemedText type="small" themeColor="textSecondary">
                          {s.weightKg} kg
                        </ThemedText>
                      )}
                      {s.bodyFatPct != null && (
                        <ThemedText type="small" themeColor="textSecondary">
                          {s.bodyFatPct}% masse grasse
                        </ThemedText>
                      )}
                      {s.waistCm != null && (
                        <ThemedText type="small" themeColor="textSecondary">
                          {s.waistCm} cm taille
                        </ThemedText>
                      )}
                    </View>
                  </Card>
                ))
              )}
            </View>
          )}

          {tab === 'performances' && (
            <Card>
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                Le suivi des performances (charges, séries, records) arrive dans une prochaine
                version.
              </ThemedText>
            </Card>
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: BottomTabInset + Spacing.lg,
    gap: Spacing.base,
  },
  toggle: { flexDirection: 'row', borderRadius: Radius.pill, padding: 4 },
  toggleBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: Radius.pill },
  radarCard: { alignItems: 'center', gap: Spacing.base },
  legend: { alignSelf: 'stretch', gap: 4 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  legendLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  empty: { textAlign: 'center', paddingVertical: Spacing.lg, lineHeight: 20 },
  scanRow: { gap: Spacing.sm },
  scanValues: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.base },
});
