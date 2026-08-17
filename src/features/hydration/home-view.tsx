import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Fonts, Radius, Spacing } from '@/constants/theme';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { DrinkIcon } from '@/ui/components/DrinkIcon';
import { MetricCard } from '@/ui/components/MetricCard';
import { Screen } from '@/ui/components/Screen';
import { ScoreRing } from '@/ui/components/ScoreRing';

import { useHydration } from './hydration-context';

export function HomeView() {
  const { t } = useTranslation();
  const router = useRouter();
  const { todayStats, addEntry, healthSupported, settings, syncing, lastSyncedAt, enableHealthSync, syncWithHealth } =
    useHydration();

  const quickAdd = (volumeMl: number) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void addEntry(volumeMl, 'water');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('home.greeting')}</Text>
            <Text style={styles.appName}>{t('app.name')}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={12}
            style={styles.settingsButton}
            accessibilityLabel={t('home.settings')}>
            <SymbolView name="gearshape.fill" size={20} tintColor={Colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.ringSection}>
          <ScoreRing score={todayStats.globalScore} grade={todayStats.globalGrade} />
          <Text style={styles.scoreLabel}>{t('home.scoreLabel')}</Text>
          <Text style={styles.goalProgress}>
            {t('home.goalProgress', { current: todayStats.hydratingMl, goal: todayStats.goalMl })}
          </Text>
        </View>

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
            <Pressable style={styles.quickAddButton} onPress={() => router.push('/add-entry')}>
              <SymbolView name="plus.circle.fill" size={22} tintColor={Colors.accent} />
              <Text style={styles.quickAddText}>{t('home.addCustom')}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.metricsTitle')}</Text>
          <View style={styles.metricsGrid}>
            <MetricCard label={t('metrics.volume')} score={todayStats.metrics.volume.score} grade={todayStats.metrics.volume.grade} />
            <MetricCard
              label={t('metrics.regularity')}
              score={todayStats.metrics.regularity.score}
              grade={todayStats.metrics.regularity.grade}
            />
            <MetricCard label={t('metrics.timing')} score={todayStats.metrics.timing.score} grade={todayStats.metrics.timing.grade} />
            <MetricCard label={t('metrics.quality')} score={todayStats.metrics.quality.score} grade={todayStats.metrics.quality.grade} />
          </View>
        </View>

        <Card style={styles.healthCard}>
          <View style={styles.healthHeader}>
            <SymbolView name="heart.fill" size={18} tintColor={Colors.accent} />
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
    gap: Spacing.five,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
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
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSection: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  scoreLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    fontWeight: '600',
    marginTop: Spacing.two,
  },
  goalProgress: {
    color: Colors.textMuted,
    fontSize: FontSize.footnote,
    fontFamily: Fonts.mono,
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
