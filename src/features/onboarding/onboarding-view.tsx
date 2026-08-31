import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FontSize, Fonts, Radius, Spacing } from '@/constants/theme';
import { useHydration } from '@/features/hydration/hydration-context';
import { WEIGHTS } from '@/features/hydration/scoring';
import { useTheme } from '@/features/premium/theme-context';
import { Button } from '@/ui/components/Button';
import { Mascot } from '@/ui/components/Mascot';
import { Screen } from '@/ui/components/Screen';

import { estimateDailyGoalMl } from './goal-estimate';
import { setOnboardingCompleted } from './onboarding-storage';
import { ActivityLevel, GoalFocus, SleepBucket } from './onboarding-types';

const TOTAL_STEPS = 7;
const DEFAULT_WEIGHT_KG = 70;

const GOAL_FOCUS_ICON: Record<GoalFocus, SFSymbol> = {
  consistency: 'arrow.triangle.2.circlepath',
  energy: 'bolt.fill',
  sleep: 'moon.stars.fill',
  tracking: 'chart.line.uptrend.xyaxis',
};

const ACTIVITY_ICON: Record<ActivityLevel, SFSymbol> = {
  sedentary: 'figure.stand',
  moderate: 'figure.walk',
  active: 'figure.run',
};

const SLEEP_ICON: Record<SleepBucket, SFSymbol> = {
  short: 'moon.fill',
  average: 'moon.stars.fill',
  long: 'bed.double.fill',
};

const METRIC_KEYS = ['volume', 'regularity', 'timing', 'quality'] as const;

export function OnboardingView() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { setDailyGoal, healthSupported, enableHealthSync } = useHydration();

  const [step, setStep] = useState(0);
  const [goalFocus, setGoalFocus] = useState<GoalFocus | null>(null);
  const [weightInput, setWeightInput] = useState(String(DEFAULT_WEIGHT_KG));
  const [activity, setActivity] = useState<ActivityLevel | null>(null);
  const [sleep, setSleep] = useState<SleepBucket | null>(null);
  const [healthGranted, setHealthGranted] = useState(false);
  const [requestingHealth, setRequestingHealth] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const weightKg = Number(weightInput.replace(',', '.'));
  const weightValid = Number.isFinite(weightKg) && weightKg >= 30 && weightKg <= 250;

  const estimatedGoal = useMemo(
    () => estimateDailyGoalMl(weightValid ? weightKg : DEFAULT_WEIGHT_KG, activity ?? 'moderate', sleep ?? 'average'),
    [weightKg, weightValid, activity, sleep],
  );

  const goToNext = () => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const onConnectHealth = async () => {
    setRequestingHealth(true);
    const granted = await enableHealthSync();
    setRequestingHealth(false);
    setHealthGranted(granted);
  };

  const onFinish = async () => {
    setFinishing(true);
    await setDailyGoal(estimatedGoal);
    await setOnboardingCompleted();
    router.replace('/(tabs)');
    router.push('/paywall');
  };

  const canAdvance =
    (step === 1 && goalFocus !== null) ||
    (step === 2 && weightValid) ||
    (step === 3 && activity !== null) ||
    (step === 4 && sleep !== null) ||
    step === 0 ||
    step === 5 ||
    step === 6;

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        {step > 0 ? (
          <Pressable onPress={goBack} hitSlop={12} style={styles.backButton}>
            <SymbolView name="chevron.left" size={16} tintColor={theme.textSecondary} />
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
        <View style={styles.dotsRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i <= step ? theme.accent : theme.border }]}
            />
          ))}
        </View>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        {step === 0 && <WelcomeStep />}
        {step === 1 && <GoalStep value={goalFocus} onChange={setGoalFocus} />}
        {step === 2 && <WeightStep value={weightInput} onChange={setWeightInput} valid={weightValid} />}
        {step === 3 && <ActivityStep value={activity} onChange={setActivity} />}
        {step === 4 && <SleepStep value={sleep} onChange={setSleep} />}
        {step === 5 && (
          <HealthStep
            supported={healthSupported}
            granted={healthGranted}
            requesting={requestingHealth}
            onConnect={() => void onConnectHealth()}
          />
        )}
        {step === 6 && <RevealStep goalFocus={goalFocus} estimatedGoal={estimatedGoal} />}
      </View>

      <View style={styles.footer}>
        {step === 6 ? (
          <Button label={t('onboarding.reveal.cta')} onPress={() => void onFinish()} loading={finishing} />
        ) : step === 5 ? (
          <Button
            label={healthGranted ? t('onboarding.continue') : t('onboarding.health.skip')}
            onPress={goToNext}
          />
        ) : (
          <Button
            label={step === 0 ? t('onboarding.welcome.cta') : t('onboarding.continue')}
            onPress={goToNext}
            disabled={!canAdvance}
          />
        )}
      </View>
    </Screen>
  );
}

function WelcomeStep() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View style={styles.centered}>
      <Mascot pose="wave" size={128} />
      <Text style={[styles.title, { color: theme.text, marginTop: Spacing.three }]}>
        {t('onboarding.welcome.greeting', { app: t('app.name') })}
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('onboarding.welcome.tagline')}</Text>
    </View>
  );
}

function GoalStep({ value, onChange }: { value: GoalFocus | null; onChange: (v: GoalFocus) => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const options: GoalFocus[] = ['consistency', 'energy', 'sleep', 'tracking'];

  return (
    <View style={styles.stepBlock}>
      <StepHeader title={t('onboarding.goal.title')} subtitle={t('onboarding.goal.subtitle')} />
      <View style={styles.optionList}>
        {options.map((opt) => (
          <SelectableCard
            key={opt}
            selected={value === opt}
            icon={GOAL_FOCUS_ICON[opt]}
            label={t(`onboarding.goal.options.${opt}.label`)}
            description={t(`onboarding.goal.options.${opt}.description`)}
            onPress={() => onChange(opt)}
          />
        ))}
      </View>
    </View>
  );
}

function WeightStep({ value, onChange, valid }: { value: string; onChange: (v: string) => void; valid: boolean }) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={styles.stepBlock}>
      <StepHeader title={t('onboarding.weight.title')} subtitle={t('onboarding.weight.subtitle')} />
      <View style={styles.weightRow}>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="number-pad"
          style={[styles.weightInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
          placeholderTextColor={theme.textMuted}
          maxLength={3}
        />
        <Text style={[styles.weightUnit, { color: theme.textMuted }]}>kg</Text>
      </View>
      {!valid && value.length > 0 && (
        <Text style={[styles.errorHint, { color: theme.textMuted }]}>{t('onboarding.weight.invalid')}</Text>
      )}
    </View>
  );
}

function ActivityStep({ value, onChange }: { value: ActivityLevel | null; onChange: (v: ActivityLevel) => void }) {
  const { t } = useTranslation();
  const options: ActivityLevel[] = ['sedentary', 'moderate', 'active'];

  return (
    <View style={styles.stepBlock}>
      <StepHeader title={t('onboarding.activity.title')} subtitle={t('onboarding.activity.subtitle')} />
      <View style={styles.optionList}>
        {options.map((opt) => (
          <SelectableCard
            key={opt}
            selected={value === opt}
            icon={ACTIVITY_ICON[opt]}
            label={t(`onboarding.activity.options.${opt}.label`)}
            description={t(`onboarding.activity.options.${opt}.description`)}
            onPress={() => onChange(opt)}
          />
        ))}
      </View>
    </View>
  );
}

function SleepStep({ value, onChange }: { value: SleepBucket | null; onChange: (v: SleepBucket) => void }) {
  const { t } = useTranslation();
  const options: SleepBucket[] = ['short', 'average', 'long'];

  return (
    <View style={styles.stepBlock}>
      <StepHeader title={t('onboarding.sleep.title')} subtitle={t('onboarding.sleep.subtitle')} />
      <View style={styles.optionList}>
        {options.map((opt) => (
          <SelectableCard
            key={opt}
            selected={value === opt}
            icon={SLEEP_ICON[opt]}
            label={t(`onboarding.sleep.options.${opt}.label`)}
            description={t(`onboarding.sleep.options.${opt}.description`)}
            onPress={() => onChange(opt)}
          />
        ))}
      </View>
    </View>
  );
}

function HealthStep({
  supported,
  granted,
  requesting,
  onConnect,
}: {
  supported: boolean;
  granted: boolean;
  requesting: boolean;
  onConnect: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={styles.stepBlock}>
      <StepHeader title={t('onboarding.health.title')} subtitle={t('onboarding.health.subtitle')} />
      <View style={[styles.healthIconWrap, { backgroundColor: theme.accentSoft }]}>
        <SymbolView name="heart.fill" size={28} tintColor={theme.accent} />
      </View>
      {!supported ? (
        <Text style={[styles.errorHint, { color: theme.textMuted }]}>{t('home.healthUnsupported')}</Text>
      ) : (
        <Button
          label={granted ? t('onboarding.health.connected') : t('onboarding.health.connect')}
          variant={granted ? 'ghost' : 'primary'}
          onPress={onConnect}
          loading={requesting}
          disabled={granted}
        />
      )}
    </View>
  );
}

function RevealStep({ goalFocus, estimatedGoal }: { goalFocus: GoalFocus | null; estimatedGoal: number }) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={styles.centered}>
      <Mascot pose="thumbsup" size={96} />
      <Text style={[styles.subtitle, { color: theme.textSecondary, marginTop: Spacing.two }]}>
        {t('onboarding.reveal.title')}
      </Text>
      <View style={styles.goalNumberRow}>
        <Text style={[styles.goalNumber, { color: theme.text }]}>{estimatedGoal}</Text>
        <Text style={[styles.goalUnit, { color: theme.textMuted }]}>ml</Text>
      </View>
      <Text style={[styles.goalHint, { color: theme.textMuted }]}>{t('onboarding.reveal.goalHint')}</Text>

      {goalFocus && (
        <Text style={[styles.focusLine, { color: theme.textSecondary }]}>
          {t(`onboarding.reveal.focusLine.${goalFocus}`)}
        </Text>
      )}

      <View style={styles.metricsRow}>
        {METRIC_KEYS.map((key) => (
          <View key={key} style={[styles.metricChip, { borderColor: theme.border }]}>
            <Text style={[styles.metricChipLabel, { color: theme.text }]}>{t(`metrics.${key}`)}</Text>
            <Text style={[styles.metricChipWeight, { color: theme.accent }]}>{Math.round(WEIGHTS[key] * 100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const theme = useTheme();
  return (
    <View style={styles.stepHeader}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
    </View>
  );
}

function SelectableCard({
  selected,
  icon,
  label,
  description,
  onPress,
}: {
  selected: boolean;
  icon: SFSymbol;
  label: string;
  description: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: selected ? theme.accent : theme.border },
        selected && { backgroundColor: theme.accentSoft },
      ]}>
      <View style={[styles.cardIconWrap, { backgroundColor: theme.accentSoft }]}>
        <SymbolView name={icon} size={18} tintColor={theme.accent} />
      </View>
      <View style={styles.cardTextWrap}>
        <Text style={[styles.cardLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.cardDescription, { color: theme.textMuted }]}>{description}</Text>
      </View>
      {selected && <SymbolView name="checkmark.circle.fill" size={20} tintColor={theme.accent} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    paddingBottom: Spacing.three,
  },
  centered: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    fontSize: FontSize.title1,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.body,
    textAlign: 'center',
  },
  stepBlock: {
    gap: Spacing.five,
  },
  stepHeader: {
    gap: Spacing.one,
  },
  optionList: {
    gap: Spacing.two,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.three,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
    gap: 2,
  },
  cardLabel: {
    fontSize: FontSize.body,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: FontSize.footnote,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  weightInput: {
    width: 140,
    height: 72,
    borderRadius: Radius.lg,
    borderWidth: 1,
    textAlign: 'center',
    fontFamily: Fonts.mono,
    fontSize: FontSize.title1,
    fontWeight: '700',
  },
  weightUnit: {
    fontSize: FontSize.callout,
  },
  errorHint: {
    fontSize: FontSize.footnote,
    textAlign: 'center',
  },
  healthIconWrap: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  goalNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: Spacing.three,
  },
  goalNumber: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.hero,
    fontWeight: '700',
  },
  goalUnit: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.callout,
  },
  goalHint: {
    fontSize: FontSize.footnote,
    textAlign: 'center',
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.four,
  },
  focusLine: {
    fontSize: FontSize.body,
    textAlign: 'center',
    marginTop: Spacing.four,
    paddingHorizontal: Spacing.three,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.five,
  },
  metricChip: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  metricChipLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricChipWeight: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.footnote,
    fontWeight: '700',
  },
});
