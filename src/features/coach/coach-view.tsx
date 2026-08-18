import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Fonts, Radius, Spacing } from '@/constants/theme';
import { useHydration } from '@/features/hydration/hydration-context';
import { usePremiumGate } from '@/features/premium/use-premium-gate';
import { useTheme } from '@/features/premium/theme-context';
import { Card } from '@/ui/components/Card';
import { Screen } from '@/ui/components/Screen';

import { CoachCopy, getCoachCopy } from './ai-copy';
import { ContentItem, RECOMMENDED_CONTENT } from './content';
import { loadManualMissionState, saveManualMissionState } from './mission-state';
import {
  choosePriorityAction,
  buildMissions,
  computeScorePotential,
  DEFAULT_MANUAL_MISSION_STATE,
  Mission,
  ManualMissionState,
  PriorityAction,
} from './rules-engine';

const GOOD_TARGET = 85;

const CATEGORY_LABEL_KEY: Record<ContentItem['category'], string> = {
  recipe: 'coach.recipeCategory',
  activity: 'coach.activityCategory',
  recovery: 'coach.recoveryCategory',
};

function actionParams(action: PriorityAction) {
  return { ml: action.targetMl ?? 0, hour: action.deadlineHour ?? 0 };
}

export function CoachView() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { todayStats } = useHydration();
  const { isPremium, guard } = usePremiumGate();

  const action = useMemo(() => choosePriorityAction(todayStats), [todayStats]);
  const potential = useMemo(() => computeScorePotential(todayStats, action), [todayStats, action]);

  const [copy, setCopy] = useState<CoachCopy | null>(null);
  useEffect(() => {
    let cancelled = false;
    void getCoachCopy(action, todayStats).then((result) => {
      if (!cancelled) setCopy(result);
    });
    return () => {
      cancelled = true;
    };
    // Régénère seulement quand l'action choisie change de nature — pas à chaque re-render de todayStats.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action.kind, action.targetMl, action.deadlineHour]);

  const [manual, setManual] = useState<ManualMissionState>(DEFAULT_MANUAL_MISSION_STATE);
  useEffect(() => {
    void loadManualMissionState().then(setManual);
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

  const explanation = copy?.priorityExplanation ?? t(`coach.fallback.${action.kind}`, actionParams(action));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{t('coach.greeting')}</Text>
          <Text style={styles.subtitle}>
            {todayStats.globalScore < GOOD_TARGET
              ? t('coach.subtitleGoalBelow', { target: GOOD_TARGET })
              : t('coach.subtitleGoalAbove', { target: GOOD_TARGET })}
          </Text>
        </View>

        <View style={styles.heroWrap}>
          <View style={[styles.halo, { backgroundColor: theme.accent, shadowColor: theme.accent }]} />
          <Card elevated style={styles.heroCard}>
            <Text style={styles.heroLabel}>{t('coach.priorityTitle')}</Text>
            <Text style={styles.heroAction}>{t(`coach.action.${action.kind}`, actionParams(action))}</Text>
            <Text style={styles.heroExplanation}>{explanation}</Text>
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
                <Text style={styles.ctaLabel}>{t('coach.actionCta')}</Text>
              </Pressable>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('coach.recommendedTitle')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendedRow}>
            {RECOMMENDED_CONTENT.map((item) => {
              const locked = item.premium && !isPremium;
              return (
                <Pressable key={item.id} onPress={() => openContent(item)} style={styles.contentCard}>
                  <View style={styles.contentCardTop}>
                    <SymbolView name={item.icon} size={20} tintColor={theme.accent} />
                    {locked && <SymbolView name="lock.fill" size={14} tintColor={Colors.textMuted} />}
                  </View>
                  <Text style={styles.contentCategory}>{t(CATEGORY_LABEL_KEY[item.category])}</Text>
                  <Text style={styles.contentTitle} numberOfLines={2}>
                    {t(`coach.content.${item.id}.title`)}
                  </Text>
                  <Text style={styles.contentDuration}>{t('coach.detailDuration', { minutes: item.durationMinutes })}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

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
  greeting: {
    color: Colors.text,
    fontSize: FontSize.title2,
    fontWeight: '700',
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
    color: '#000000',
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
  recommendedRow: {
    gap: Spacing.two,
    paddingRight: Spacing.three,
  },
  contentCard: {
    width: 150,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  contentCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentCategory: {
    color: Colors.textMuted,
    fontSize: FontSize.caption,
    fontWeight: '600',
    marginTop: Spacing.one,
  },
  contentTitle: {
    color: Colors.text,
    fontSize: FontSize.footnote,
    fontWeight: '700',
  },
  contentDuration: {
    color: Colors.textMuted,
    fontSize: FontSize.caption,
    fontFamily: Fonts.mono,
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
