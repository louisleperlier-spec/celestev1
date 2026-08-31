import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { PillButton } from '@/components/pill-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getCategory } from '@/constants/categories';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { todayKey } from '@/lib/date';
import { useEntries } from '@/lib/entries-store';
import { computeDayScore, potentialScore, weakestCategory } from '@/lib/score';
import { TIPS, tipsForCategory } from '@/lib/tips';

export default function CoachScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { entries } = useEntries();

  const dateKey = todayKey();
  const todayEntries = useMemo(
    () => entries.filter((e) => e.dateKey === dateKey),
    [entries, dateKey]
  );
  const dayScore = useMemo(() => computeDayScore(dateKey, todayEntries), [dateKey, todayEntries]);
  const weak = useMemo(() => weakestCategory(dayScore), [dayScore]);
  const weakCategory = getCategory(weak);
  const potential = potentialScore(dayScore);
  const gain = potential - dayScore.total;
  const featuredTip = tipsForCategory(weak)[0] ?? TIPS[0];
  const otherTips = TIPS.filter((t) => t.id !== featuredTip.id).slice(0, 3);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="title" style={styles.title}>
            Coach
          </ThemedText>

          <ThemedText type="smallBold" themeColor="textSecondary">
            Recommandé pour toi
          </ThemedText>

          <Card style={[styles.featured, { backgroundColor: weakCategory.colorLight }]}>
            <View style={styles.featuredHeader}>
              <View style={styles.featuredTextWrap}>
                <ThemedText type="subtitle" style={[styles.featuredTitle, { color: weakCategory.color }]}>
                  {weakCategory.question}
                </ThemedText>
                <ThemedText style={styles.featuredBody}>
                  C&apos;est ta catégorie la plus faible aujourd&apos;hui ({dayScore.byCategory[weak]}/20).
                  {gain > 0 ? ` En la travaillant, tu peux gagner jusqu'à +${gain} points.` : ''}
                </ThemedText>
              </View>
              <View style={[styles.featuredIcon, { backgroundColor: '#FFFFFF88' }]}>
                <Ionicons name={weakCategory.icon} size={28} color={weakCategory.color} />
              </View>
            </View>
            {gain > 0 && (
              <View style={styles.gainBadge}>
                <ThemedText type="smallBold" style={{ color: theme.success }}>
                  ↗ +{gain} pts potentiels
                </ThemedText>
              </View>
            )}
            <PillButton
              title="Logger une action"
              onPress={() =>
                router.push({ pathname: '/add-entry', params: { category: weak } })
              }
              style={styles.featuredCta}
            />
          </Card>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
            Conseils du jour
          </ThemedText>

          <View style={{ gap: Spacing.two }}>
            <TipRow tip={featuredTip} />
            {otherTips.map((t) => (
              <TipRow key={t.id} tip={t} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function TipRow({ tip }: { tip: (typeof TIPS)[number] }) {
  const category = getCategory(tip.category);
  return (
    <Card style={styles.tipCard}>
      <View style={[styles.tipIcon, { backgroundColor: category.colorLight }]}>
        <Ionicons name={tip.icon as never} size={18} color={category.color} />
      </View>
      <View style={styles.tipMiddle}>
        <ThemedText type="smallBold">{tip.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {tip.body}
        </ThemedText>
      </View>
    </Card>
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
    gap: Spacing.two,
  },
  title: { fontSize: 28, lineHeight: 32, marginBottom: Spacing.two },
  featured: { borderWidth: 0, gap: Spacing.two },
  featuredHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  featuredTextWrap: { flex: 1 },
  featuredTitle: { fontSize: 19, lineHeight: 24, marginBottom: 6 },
  featuredBody: { lineHeight: 20 },
  featuredIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gainBadge: { alignSelf: 'flex-start' },
  featuredCta: { marginTop: Spacing.two },
  sectionTitle: { marginTop: Spacing.three },
  tipCard: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipMiddle: { flex: 1, gap: 4 },
});
