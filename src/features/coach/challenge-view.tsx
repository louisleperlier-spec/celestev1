import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { useHydration } from '@/features/hydration/hydration-context';
import { useTheme } from '@/features/premium/theme-context';
import { usePremiumGate } from '@/features/premium/use-premium-gate';
import { Card } from '@/ui/components/Card';
import { Mascot } from '@/ui/components/Mascot';
import { Screen } from '@/ui/components/Screen';

import { computeStreak } from './streak';
import { ROUTINES } from './routines';

const REWARD_MILESTONES = [7, 15, 30] as const;

export function ChallengeView() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { isPremium, guard } = usePremiumGate();
  const { statsForLastDays } = useHydration();

  const weekStats = useMemo(() => statsForLastDays(7), [statsForLastDays]);
  const weeklyChallengeDays = useMemo(
    () => weekStats.filter((d) => d.entries.length > 0 && d.hydratingMl >= d.goalMl).length,
    [weekStats],
  );
  const streak = useMemo(() => computeStreak(weekStats), [weekStats]);
  const monthStats = useMemo(() => (isPremium ? statsForLastDays(30) : []), [isPremium, statsForLastDays]);
  const longStreak = useMemo(() => (isPremium ? computeStreak(monthStats) : streak), [isPremium, monthStats, streak]);

  const isDoingWell = weeklyChallengeDays >= 4;

  const onShare = () => {
    void Share.share({ message: t('coach.challenge.shareMessage', { done: weeklyChallengeDays }) });
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <LinearGradient colors={['#8C7CF0', '#B79CF7']} style={styles.hero}>
        <View style={styles.heroTopRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <SymbolView name="chevron.left" size={18} tintColor="#FFFFFF" />
          </Pressable>
          <Pressable onPress={onShare} hitSlop={12}>
            <SymbolView name="square.and.arrow.up" size={18} tintColor="#FFFFFF" />
          </Pressable>
        </View>
        <Text style={styles.heroTitle}>
          {isDoingWell ? t('coach.challenge.heroTitleGood') : t('coach.challenge.heroTitleEncourage')}
        </Text>
        <Mascot pose={isDoingWell ? 'heart' : 'wave'} size={140} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('coach.weeklyChallengeTitle')}</Text>
          <Card elevated style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <SymbolView name="trophy.fill" size={20} tintColor="#E0A63E" />
              <Text style={styles.challengeName}>{t('coach.weeklyChallengeName')}</Text>
            </View>
            <View style={styles.challengeTrack}>
              <View
                style={[
                  styles.challengeFill,
                  { width: `${Math.max(4, (weeklyChallengeDays / 7) * 100)}%`, backgroundColor: theme.accent },
                ]}
              />
            </View>
            <Text style={styles.challengeProgress}>
              {t('coach.weeklyChallengeProgress', { done: weeklyChallengeDays, total: 7 })}
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('coach.rewardsTitle')}</Text>
          <View style={styles.rewardsRow}>
            {REWARD_MILESTONES.map((days) => {
              const locked = days > 7 && !isPremium;
              const unlocked = !locked && longStreak >= days;
              return (
                <Pressable
                  key={days}
                  onPress={locked ? () => guard(() => {}) : undefined}
                  disabled={!locked}
                  style={styles.rewardCard}>
                  <View style={[styles.rewardIconCircle, unlocked && { backgroundColor: theme.accentSoft }]}>
                    <SymbolView
                      name={unlocked ? 'checkmark.seal.fill' : locked ? 'lock.fill' : 'circle'}
                      size={18}
                      tintColor={unlocked ? theme.accent : Colors.textMuted}
                    />
                  </View>
                  <Text style={styles.rewardDays}>{t(`coach.reward${days}Title`)}</Text>
                  <Text style={styles.rewardLabel}>{t(`coach.reward${days}Label`)}</Text>
                </Pressable>
              );
            })}
          </View>
          {!isPremium && <Text style={styles.rewardsHint}>{t('coach.rewardsPremiumHint')}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('coach.routinesTitle')}</Text>
          <View style={styles.routinesList}>
            {ROUTINES.map((routine) => (
              <Pressable
                key={routine.id}
                onPress={() => router.push({ pathname: '/routine', params: { id: routine.id } })}
                style={styles.routineRow}>
                <View style={[styles.routineIconCircle, { backgroundColor: theme.accentSoft }]}>
                  <SymbolView name={routine.icon} size={18} tintColor={theme.accent} />
                </View>
                <View style={styles.routineInfo}>
                  <Text style={styles.routineTitle}>{t(`coach.routines.${routine.id}.title`)}</Text>
                  <Text style={styles.routineSubtitle}>
                    {t(`coach.routines.${routine.id}.subtitle`)} · {t('coach.routines.stepsCount', { count: routine.stepCount })} ·{' '}
                    {t('coach.detailDuration', { minutes: routine.durationMinutes })}
                  </Text>
                </View>
                <SymbolView name="chevron.right" size={14} tintColor={Colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    paddingHorizontal: Spacing.four,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.four,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.title2,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.five,
    paddingBottom: Spacing.six,
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
  challengeCard: {
    gap: Spacing.two,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  challengeName: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '700',
  },
  challengeTrack: {
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    overflow: 'hidden',
  },
  challengeFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  challengeProgress: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    fontWeight: '600',
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  rewardCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.three,
  },
  rewardIconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardDays: {
    color: Colors.text,
    fontSize: FontSize.footnote,
    fontWeight: '700',
  },
  rewardLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  rewardsHint: {
    color: Colors.textMuted,
    fontSize: FontSize.caption,
    textAlign: 'center',
  },
  routinesList: {
    gap: Spacing.two,
  },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  routineIconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineInfo: {
    flex: 1,
    gap: 2,
  },
  routineTitle: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '700',
  },
  routineSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.caption,
  },
});
