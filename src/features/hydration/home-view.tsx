import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/features/premium/theme-context';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { DrinkIcon } from '@/ui/components/DrinkIcon';
import { Mascot } from '@/ui/components/Mascot';
import { MetricCard } from '@/ui/components/MetricCard';
import { Screen } from '@/ui/components/Screen';
import { ZoneGauge } from '@/ui/components/ZoneGauge';

import { useHydration } from './hydration-context';

const GRADE_WORD_KEY = { A: 'grade.wordA', B: 'grade.wordB', C: 'grade.wordC', D: 'grade.wordD' } as const;

export function HomeView() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { todayStats, addEntry, healthSupported, settings, syncing, lastSyncedAt, enableHealthSync, syncWithHealth } =
    useHydration();

  const quickAdd = (volumeMl: number) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void addEntry(volumeMl, 'water');
  };

  const goalRatio = todayStats.goalMl > 0 ? Math.min(1, todayStats.hydratingMl / todayStats.goalMl) : 0;

  const onShareScore = () => {
    void Share.share({
      message: t('home.shareMessage', { score: todayStats.globalScore, grade: todayStats.globalGrade }),
    });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.push('/settings')} hitSlop={12} style={styles.iconButton} accessibilityLabel={t('home.menu')}>
            <SymbolView name="line.3.horizontal" size={18} tintColor={Colors.textSecondary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.greeting}>{t('home.greeting')}</Text>
            <Text style={styles.appName}>{t('app.name')}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={12}
            style={styles.iconButton}
            accessibilityLabel={t('home.settings')}>
            <SymbolView name="bell.fill" size={18} tintColor={Colors.textSecondary} />
          </Pressable>
        </View>

        <Card elevated style={styles.scoreCard}>
          <View style={styles.scoreCardHeader}>
            <Text style={styles.scoreCardTitle}>{t('home.scoreCardTitle')}</Text>
            <Pressable onPress={onShareScore} hitSlop={10}>
              <SymbolView name="square.and.arrow.up" size={16} tintColor={Colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.scoreWordRow}>
            <View style={styles.scoreWordCol}>
              <Text style={styles.scoreWord}>{t(GRADE_WORD_KEY[todayStats.globalGrade])}</Text>
              <Text style={styles.scoreNumber}>{todayStats.globalScore}/100</Text>
            </View>
            <Mascot pose="sparkle" size={56} />
          </View>

          <ZoneGauge value={todayStats.globalScore} />
        </Card>

        <Card style={styles.goalCard}>
          <View style={styles.goalCardText}>
            <Text style={styles.goalCardTitle}>{t('home.goalCardTitle')}</Text>
            <Text style={styles.goalProgress}>
              {t('home.goalProgress', { current: todayStats.hydratingMl, goal: todayStats.goalMl })}
            </Text>
            <View style={styles.goalTrack}>
              <View style={[styles.goalFill, { width: `${Math.max(4, goalRatio * 100)}%`, backgroundColor: theme.accent }]} />
            </View>
          </View>
          <View style={[styles.goalIconCircle, { backgroundColor: theme.accentSoft }]}>
            <DrinkIcon type="water" size={22} />
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.quickAdd')}</Text>
          <View style={styles.quickAddRow}>
            <Pressable style={styles.quickAddButton} onPress={() => quickAdd(250)}>
              <DrinkIcon type="water" size={22} />
              <Text style={styles.quickAddText}>{t('home.addGlass')}</Text>
            </Pressable>
            <Pressable style={styles.quickAddButton} onPress={() => quickAdd(500)}>
              <DrinkIcon type="water" size={22} />
              <Text style={styles.quickAddText}>{t('home.addBottle')}</Text>
            </Pressable>
            <Pressable style={styles.quickAddButton} onPress={() => quickAdd(750)}>
              <DrinkIcon type="water" size={22} />
              <Text style={styles.quickAddText}>{t('home.addLarge')}</Text>
            </Pressable>
            <Pressable style={styles.quickAddButton} onPress={() => router.push('/add-entry')}>
              <SymbolView name="plus.circle.fill" size={22} tintColor={theme.accent} />
              <Text style={styles.quickAddText}>{t('home.addCustom')}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.metricsTitle')}</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              metricId="volume"
              label={t('metrics.volume')}
              score={todayStats.metrics.volume.score}
              grade={todayStats.metrics.volume.grade}
            />
            <MetricCard
              metricId="regularity"
              label={t('metrics.regularity')}
              score={todayStats.metrics.regularity.score}
              grade={todayStats.metrics.regularity.grade}
            />
            <MetricCard
              metricId="timing"
              label={t('metrics.timing')}
              score={todayStats.metrics.timing.score}
              grade={todayStats.metrics.timing.grade}
            />
            <MetricCard
              metricId="quality"
              label={t('metrics.quality')}
              score={todayStats.metrics.quality.score}
              grade={todayStats.metrics.quality.grade}
            />
          </View>
        </View>

        <Card style={styles.healthCard}>
          <View style={styles.healthHeader}>
            <SymbolView name="heart.fill" size={18} tintColor={theme.accent} />
            <Text style={styles.healthTitle}>{t('home.healthTitle')}</Text>
          </View>

          {!healthSupported ? (
            <Text style={styles.healthMuted}>{t('home.healthUnsupported')}</Text>
          ) : settings.healthSyncEnabled ? (
            <>
              <Text style={styles.healthMuted}>
                {syncing
                  ? t('home.healthSyncing')
                  : lastSyncedAt
                    ? t('home.healthLastSynced', {
                        time: new Date(lastSyncedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
                      })
                    : t('home.healthEnabled')}
              </Text>
              <Button label={t('home.healthSyncNow')} variant="ghost" loading={syncing} onPress={() => void syncWithHealth()} />
            </>
          ) : (
            <Button label={t('home.healthEnable')} onPress={() => void enableHealthSync()} />
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  headerCenter: {
    alignItems: 'center',
  },
  greeting: {
    color: Colors.textMuted,
    fontSize: FontSize.footnote,
  },
  appName: {
    color: Colors.text,
    fontSize: FontSize.title2,
    fontWeight: '700',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCard: {
    gap: Spacing.three,
  },
  scoreCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  scoreCardTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    fontWeight: '700',
  },
  scoreWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreWordCol: {
    gap: 2,
  },
  scoreWord: {
    color: Colors.text,
    fontSize: FontSize.title1,
    fontWeight: '800',
  },
  scoreNumber: {
    color: Colors.textMuted,
    fontSize: FontSize.footnote,
    fontFamily: Fonts.mono,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  goalCardText: {
    flex: 1,
    gap: Spacing.one,
  },
  goalCardTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    fontWeight: '700',
  },
  goalProgress: {
    color: Colors.text,
    fontSize: FontSize.title3,
    fontWeight: '700',
    fontFamily: Fonts.mono,
  },
  goalTrack: {
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    overflow: 'hidden',
    marginTop: Spacing.one,
  },
  goalFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  goalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
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
  quickAddRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  quickAddButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickAddText: {
    color: Colors.text,
    fontSize: FontSize.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  healthCard: {
    gap: Spacing.two,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  healthTitle: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '700',
  },
  healthMuted: {
    color: Colors.textMuted,
    fontSize: FontSize.footnote,
  },
});
