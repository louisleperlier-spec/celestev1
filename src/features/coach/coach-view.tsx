import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Fonts, Radius, Spacing } from '@/constants/theme';
import { useHydration } from '@/features/hydration/hydration-context';
import { usePremiumGate } from '@/features/premium/use-premium-gate';
import { useTheme } from '@/features/premium/theme-context';
import { Card } from '@/ui/components/Card';
import { GradeBadge } from '@/ui/components/GradeBadge';
import { Mascot } from '@/ui/components/Mascot';
import { Screen } from '@/ui/components/Screen';

import { CoachCopy, getCoachCopy } from './ai-copy';
import { loadBookmarks, toggleBookmark } from './bookmarks';
import { CATEGORY_LABEL_KEY, ContentCategory, ContentItem, contentForCategory } from './content';
import { CATEGORY_TINT, HYDRATION_IMAGE, STREAK_COLOR } from './coach-theme';
import { computeWeeklyInsight } from './insight';
import { loadManualMissionState, saveManualMissionState } from './mission-state';
import { PhotoCard } from './photo-card';
import {
  choosePriorityAction,
  buildMissions,
  computeScorePotential,
  DEFAULT_MANUAL_MISSION_STATE,
  Mission,
  ManualMissionState,
  PriorityAction,
  PriorityActionKind,
} from './rules-engine';
import { computeStreak } from './streak';

const GOOD_TARGET = 85;
const CATEGORIES: ContentCategory[] = ['recipe', 'activity', 'recovery'];

const ACTION_ICON: Record<PriorityActionKind, SFSymbol> = {
  drink: 'drop.fill',
  diversify: 'arrow.triangle.2.circlepath',
  spreadOut: 'timer',
  startEarlier: 'sunrise.fill',
  reduceLate: 'moon.fill',
  maintain: 'checkmark.seal.fill',
  moveBody: 'figure.walk',
};

function actionParams(action: PriorityAction) {
  return { ml: action.targetMl ?? 0, hour: action.deadlineHour ?? 0 };
}

export function CoachView() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { todayStats, statsForLastDays } = useHydration();
  const { isPremium, guard } = usePremiumGate();

  const action = useMemo(() => choosePriorityAction(todayStats), [todayStats]);
  const potential = useMemo(() => computeScorePotential(todayStats, action), [todayStats, action]);

  const weekStats = useMemo(() => statsForLastDays(7), [statsForLastDays]);
  const streak = useMemo(() => computeStreak(weekStats), [weekStats]);
  const insight = useMemo(() => computeWeeklyInsight(weekStats), [weekStats]);

  const weeklyChallengeDays = useMemo(
    () => weekStats.filter((d) => d.entries.length > 0 && d.hydratingMl >= d.goalMl).length,
    [weekStats],
  );

  const [copy, setCopy] = useState<CoachCopy | null>(null);
  useEffect(() => {
    let cancelled = false;
    void getCoachCopy(action, todayStats, isPremium).then((result) => {
      if (!cancelled) setCopy(result);
    });
    return () => {
      cancelled = true;
    };
    // Régénère seulement quand l'action choisie change de nature — pas à chaque re-render de todayStats.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action.kind, action.targetMl, action.deadlineHour, isPremium]);

  const [manual, setManual] = useState<ManualMissionState>(DEFAULT_MANUAL_MISSION_STATE);
  useEffect(() => {
    void loadManualMissionState().then(setManual);
  }, []);

  const [bookmarks, setBookmarks] = useState<string[]>([]);
  useEffect(() => {
    void loadBookmarks().then(setBookmarks);
  }, []);

  const missions = useMemo(() => buildMissions(todayStats, manual), [todayStats, manual]);

  const toggleMission = (mission: Mission) => {
    if (mission.kind !== 'manual') return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next: ManualMissionState = {
      ...manual,
      walked: mission.id === 'walk' ? !manual.walked : manual.walked,
      noAddedSugar: mission.id === 'noAddedSugar' ? !manual.noAddedSugar : manual.noAddedSugar,
    };
    setManual(next);
    void saveManualMissionState(next);
  };

  const handleActionCta = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (action.kind === 'maintain' || action.kind === 'moveBody') return;
    router.push('/add-entry');
  };

  const openContent = (item: ContentItem) => {
    if (item.premium && !isPremium) {
      guard(() => {});
      return;
    }
    router.push({ pathname: '/coach-content', params: { id: item.id } });
  };

  const handleToggleBookmark = (id: string) => {
    void Haptics.selectionAsync();
    void toggleBookmark(id, bookmarks).then(setBookmarks);
  };

  const explanation = copy?.priorityExplanation ?? t(`coach.fallback.${action.kind}`, actionParams(action));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.greeting}>{t('coach.greeting')}</Text>
            <View style={styles.headerTopRight}>
              {streak > 0 && (
                <View style={styles.streakPill}>
                  <SymbolView name="flame.fill" size={13} tintColor={STREAK_COLOR} />
                  <Text style={[styles.streakText, { color: STREAK_COLOR }]}>{t('coach.streakDays', { count: streak })}</Text>
                </View>
              )}
              <View style={styles.avatarCircle}>
                <Mascot pose="sparkle" size={28} />
              </View>
            </View>
          </View>
          <Text style={styles.subtitle}>
            {todayStats.globalScore < GOOD_TARGET
              ? t('coach.subtitleGoalBelow', { target: GOOD_TARGET })
              : t('coach.subtitleGoalAbove', { target: GOOD_TARGET })}
          </Text>
        </View>

        <View style={styles.heroWrap}>
          <View style={[styles.halo, { backgroundColor: theme.accent, shadowColor: theme.accent }]} />
          <Card elevated style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View style={styles.heroTextCol}>
                <View style={styles.heroLabelRow}>
                  <View style={[styles.heroIconCircle, { backgroundColor: theme.accentSoft }]}>
                    <SymbolView name={ACTION_ICON[action.kind]} size={16} tintColor={theme.accent} />
                  </View>
                  <Text style={styles.heroLabel}>{t('coach.priorityTitle')}</Text>
                </View>
                <Text style={styles.heroAction}>{t(`coach.action.${action.kind}`, actionParams(action))}</Text>
                <Text style={styles.heroExplanation}>{explanation}</Text>
              </View>
              <View style={styles.heroImageWrap}>
                <Image source={HYDRATION_IMAGE} style={styles.heroImage} resizeMode="cover" />
              </View>
            </View>
            <View style={styles.heroFooter}>
              <View style={[styles.potentialBadge, { backgroundColor: theme.accentSoft }]}>
                <SymbolView name="arrow.up.forward" size={12} tintColor={theme.accent} />
                <Text style={[styles.potentialBadgeText, { color: theme.accent }]}>
                  {t('coach.potentialPoints', { points: action.potentialPoints })}
                </Text>
              </View>
              <Pressable
                onPress={handleActionCta}
                style={[styles.ctaButton, { backgroundColor: theme.accent }]}
                accessibilityLabel={t('coach.actionCta')}>
                <Text style={[styles.ctaLabel, { color: theme.accentText }]}>{t('coach.actionCta')}</Text>
              </Pressable>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('coach.recommendedTitle')}</Text>
          {CATEGORIES.map((category) => (
            <View key={category} style={styles.categoryGroup}>
              <View style={styles.categoryGroupHeader}>
                <Text style={styles.categoryGroupTitle}>{t(CATEGORY_LABEL_KEY[category])}</Text>
                <Pressable onPress={() => router.push({ pathname: '/coach-list', params: { category } })} hitSlop={8}>
                  <Text style={[styles.seeAllLink, { color: theme.accent }]}>{t('coach.seeAll')}</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendedRow}>
                {contentForCategory(category).map((item) => (
                  <PhotoCard
                    key={item.id}
                    item={item}
                    locked={item.premium && !isPremium}
                    bookmarked={bookmarks.includes(item.id)}
                    onPress={() => openContent(item)}
                    onToggleBookmark={() => handleToggleBookmark(item.id)}
                  />
                ))}
              </ScrollView>
              {category === 'recovery' && (
                <Pressable onPress={() => guard(() => router.push('/sleep-dashboard'))} style={styles.planTeaser}>
                  <View style={[styles.planTeaserIcon, { backgroundColor: `${CATEGORY_TINT.recovery}26` }]}>
                    <SymbolView name="moon.zzz.fill" size={18} tintColor={CATEGORY_TINT.recovery} />
                  </View>
                  <View style={styles.planTeaserText}>
                    <Text style={styles.planTeaserTitle}>{t('coach.sleep.entryTitle')}</Text>
                    <Text style={styles.planTeaserSubtitle}>{t('coach.sleep.entrySubtitle')}</Text>
                  </View>
                  {!isPremium && <SymbolView name="lock.fill" size={14} tintColor={Colors.textMuted} />}
                </Pressable>
              )}
            </View>
          ))}

          <Pressable onPress={() => guard(() => {})} style={styles.planTeaser}>
            <View style={styles.planTeaserIcon}>
              <SymbolView name="calendar" size={18} tintColor={theme.accent} />
            </View>
            <View style={styles.planTeaserText}>
              <Text style={styles.planTeaserTitle}>{t('coach.planTeaserTitle')}</Text>
              <Text style={styles.planTeaserSubtitle}>{t('coach.planTeaserSubtitle')}</Text>
            </View>
            {!isPremium && <SymbolView name="lock.fill" size={16} tintColor={Colors.textMuted} />}
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('coach.missionsTitle')}</Text>
          <Card style={styles.missionsCard}>
            {missions.map((mission, index) => (
              <Pressable
                key={mission.id}
                onPress={() => toggleMission(mission)}
                disabled={mission.kind === 'auto'}
                style={[styles.missionRow, index > 0 && styles.missionRowBorder]}>
                <SymbolView
                  name={mission.done ? 'checkmark.circle.fill' : 'circle'}
                  size={22}
                  tintColor={mission.done ? theme.accent : Colors.textMuted}
                />
                <Text style={[styles.missionLabel, mission.done && styles.missionLabelDone]}>
                  {mission.id === 'drinkGoal'
                    ? t('coach.missionDrinkGoal', {
                        current: (todayStats.hydratingMl / 1000).toFixed(1),
                        target: (todayStats.goalMl / 1000).toFixed(1),
                      })
                    : mission.id === 'walk'
                      ? t('coach.missionWalk')
                      : t('coach.missionNoAddedSugar')}
                </Text>
              </Pressable>
            ))}
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('coach.potentialTitle')}</Text>
          <View style={styles.potentialWrap}>
            <View style={[styles.halo, styles.haloSmall, { backgroundColor: theme.accent, shadowColor: theme.accent }]} />
            <Card elevated style={styles.potentialCard}>
              <View style={styles.potentialNumbers}>
                <Text style={styles.potentialCurrent}>{Math.round(potential.current)}</Text>
                <GradeBadge grade={todayStats.globalGrade} size="sm" />
                <SymbolView name="arrow.right" size={18} tintColor={Colors.textMuted} />
                <Text style={[styles.potentialTarget, { color: theme.accent }]}>{Math.round(potential.potential)}</Text>
              </View>
              <View style={styles.potentialTrack}>
                <View
                  style={[
                    styles.potentialFill,
                    { width: `${Math.max(4, Math.min(100, potential.current))}%`, backgroundColor: Colors.textMuted },
                  ]}
                />
                <View
                  style={[
                    styles.potentialFill,
                    styles.potentialFillTarget,
                    { width: `${Math.max(4, Math.min(100, potential.potential))}%`, backgroundColor: theme.accent },
                  ]}
                />
              </View>
              <Text style={styles.potentialLine}>{t('coach.potentialLine', { current: Math.round(potential.current), potential: Math.round(potential.potential) })}</Text>
              <Text style={styles.potentialEncouragement}>{t('coach.potentialEncouragement', { potential: Math.round(potential.potential) })}</Text>
            </Card>
          </View>
        </View>

        <Pressable onPress={() => router.push('/challenge')}>
          <Card elevated style={styles.challengeTeaser}>
            <View style={styles.challengeTeaserIcon}>
              <SymbolView name="trophy.fill" size={22} tintColor="#E0A63E" />
            </View>
            <View style={styles.challengeTeaserText}>
              <Text style={styles.challengeTeaserTitle}>{t('coach.weeklyChallengeTitle')}</Text>
              <Text style={styles.challengeTeaserSubtitle}>
                {t('coach.weeklyChallengeName')} · {t('coach.weeklyChallengeProgress', { done: weeklyChallengeDays, total: 7 })}
              </Text>
            </View>
            <SymbolView name="chevron.right" size={14} tintColor={Colors.textMuted} />
          </Card>
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('coach.insightTitle')}</Text>
          <Card style={styles.insightCard}>
            <View style={[styles.insightIconCircle, { backgroundColor: theme.accentSoft }]}>
              <SymbolView name="chart.line.uptrend.xyaxis" size={16} tintColor={theme.accent} />
            </View>
            <Text style={styles.insightText}>
              {insight
                ? t('coach.insightBody', { metric: t(`metrics.${insight.metric}`), avg: insight.averageScore })
                : t('coach.insightEmpty')}
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('coach.whyTitle')}</Text>
          <Card style={styles.whyCard}>
            <Text style={styles.whyText}>{t('coach.fallback.why')}</Text>
            <Pressable onPress={() => router.push('/score-info')} style={styles.understandLink}>
              <Text style={[styles.understandLinkText, { color: theme.accent }]}>{t('coach.understandScore')}</Text>
              <SymbolView name="chevron.right" size={12} tintColor={theme.accent} />
            </Pressable>
          </Card>
          <Text style={styles.disclaimer}>{t('coach.disclaimer')}</Text>
        </View>
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
    paddingTop: Spacing.two,
    gap: Spacing.half,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    color: Colors.text,
    fontSize: FontSize.title2,
    fontWeight: '700',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two,
    paddingVertical: 5,
  },
  streakText: {
    fontSize: FontSize.caption,
    fontWeight: '700',
  },
  headerTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  challengeTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  challengeTeaserIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(224, 166, 62, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeTeaserText: {
    flex: 1,
    gap: 2,
  },
  challengeTeaserTitle: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '700',
  },
  challengeTeaserSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.caption,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
  },
  heroWrap: {
    position: 'relative',
  },
  halo: {
    position: 'absolute',
    top: Spacing.three,
    left: '18%',
    right: '18%',
    height: 60,
    borderRadius: Radius.full,
    opacity: 0.35,
    shadowOpacity: 0.9,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
  },
  haloSmall: {
    top: Spacing.four,
    height: 40,
  },
  heroCard: {
    gap: Spacing.two,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  heroTextCol: {
    flex: 1,
    gap: Spacing.two,
  },
  heroImageWrap: {
    width: 76,
    height: 76,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  heroIconCircle: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.footnote,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroAction: {
    color: Colors.text,
    fontSize: FontSize.title3,
    fontWeight: '700',
  },
  heroExplanation: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    lineHeight: 22,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  potentialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
  potentialBadgeText: {
    fontSize: FontSize.caption,
    fontWeight: '700',
  },
  ctaButton: {
    paddingHorizontal: Spacing.four,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    fontSize: FontSize.footnote,
    fontWeight: '700',
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
  categoryGroup: {
    gap: Spacing.two,
  },
  categoryGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryGroupTitle: {
    color: Colors.text,
    fontSize: FontSize.footnote,
    fontWeight: '700',
  },
  seeAllLink: {
    fontSize: FontSize.caption,
    fontWeight: '700',
  },
  recommendedRow: {
    gap: Spacing.two,
    paddingRight: Spacing.three,
  },
  planTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
  },
  planTeaserIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTeaserText: {
    flex: 1,
    gap: 2,
  },
  planTeaserTitle: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '700',
  },
  planTeaserSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.caption,
  },
  missionsCard: {
    padding: 0,
  },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  missionRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  missionLabel: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  missionLabelDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  potentialWrap: {
    position: 'relative',
  },
  potentialCard: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  potentialNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  potentialCurrent: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: FontSize.title1,
    fontWeight: '700',
  },
  potentialTarget: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.title1,
    fontWeight: '700',
  },
  potentialTrack: {
    width: '100%',
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    overflow: 'hidden',
  },
  potentialFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: Radius.full,
    opacity: 0.4,
  },
  potentialFillTarget: {
    opacity: 1,
  },
  potentialLine: {
    color: Colors.text,
    fontSize: FontSize.footnote,
    fontWeight: '600',
    fontFamily: Fonts.mono,
  },
  potentialEncouragement: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    textAlign: 'center',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  insightIconCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    lineHeight: 20,
  },
  whyCard: {
    gap: Spacing.two,
  },
  whyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    lineHeight: 20,
  },
  understandLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
  understandLinkText: {
    fontSize: FontSize.footnote,
    fontWeight: '700',
  },
  disclaimer: {
    color: Colors.textMuted,
    fontSize: FontSize.caption,
    textAlign: 'center',
  },
});
