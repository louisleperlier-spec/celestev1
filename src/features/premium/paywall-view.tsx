import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FontSize, Radius, Spacing } from '@/constants/theme';
import { Button } from '@/ui/components/Button';
import { Screen } from '@/ui/components/Screen';

import { annualSavingsPercent, trialDaysFor } from './plan-pricing';
import { usePremium } from './premium-context';
import { useTheme } from './theme-context';

type PlanId = 'monthly' | 'annual';

const MONTHLY_TRIAL_DAYS_FALLBACK = 7;
const ANNUAL_TRIAL_DAYS_FALLBACK = 14;
const ANNUAL_SAVINGS_FALLBACK = 50;

export function PaywallView() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { supported, offering, purchase, restore } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('annual');
  const [busy, setBusy] = useState(false);

  const monthlyPackage = offering?.monthly ?? null;
  const annualPackage = offering?.annual ?? null;

  const monthlyPrice = monthlyPackage?.product.priceString ?? t('paywall.monthlyPriceFallback');
  const annualPrice = annualPackage?.product.priceString ?? t('paywall.annualPriceFallback');

  const monthlyTrialDays = trialDaysFor(monthlyPackage) ?? MONTHLY_TRIAL_DAYS_FALLBACK;
  const annualTrialDays = trialDaysFor(annualPackage) ?? ANNUAL_TRIAL_DAYS_FALLBACK;
  const savingsPercent = annualSavingsPercent(monthlyPackage, annualPackage) ?? ANNUAL_SAVINGS_FALLBACK;

  const onSubscribe = async () => {
    const pkg = selectedPlan === 'monthly' ? monthlyPackage : annualPackage;
    if (!supported || !pkg) {
      Alert.alert(t('paywall.unavailableTitle'), t('paywall.unavailableBody'));
      return;
    }
    setBusy(true);
    const outcome = await purchase(pkg);
    setBusy(false);
    if (outcome === 'purchased') router.back();
    else if (outcome === 'error') Alert.alert(t('paywall.purchaseError'));
  };

  const onRestore = async () => {
    if (!supported) {
      Alert.alert(t('paywall.unavailableTitle'), t('paywall.unavailableBody'));
      return;
    }
    setBusy(true);
    const restored = await restore();
    setBusy(false);
    Alert.alert(restored ? t('paywall.restoreSuccess') : t('paywall.restoreNone'));
    if (restored) router.back();
  };

  const benefits = [
    t('paywall.benefitHistory'),
    t('paywall.benefitHealthSync'),
    t('paywall.benefitCoachAI'),
    t('paywall.benefitRemindersAdaptive'),
    t('paywall.benefitDrinksThemes'),
  ];

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeButton}>
            <SymbolView name="xmark" size={16} tintColor={theme.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={[styles.crownWrap, { backgroundColor: theme.accentSoft }]}>
            <SymbolView name="crown.fill" size={28} tintColor={theme.accent} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>{t('paywall.title')}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('paywall.subtitle')}</Text>
        </View>

        <View style={styles.benefits}>
          {benefits.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <SymbolView name="checkmark.circle.fill" size={18} tintColor={theme.accent} />
              <Text style={[styles.benefitText, { color: theme.text }]}>{benefit}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          <PlanCard
            selected={selectedPlan === 'monthly'}
            onPress={() => setSelectedPlan('monthly')}
            label={t('paywall.monthly')}
            price={monthlyPrice}
            perUnit={t('paywall.perMonth')}
            trialLabel={t('paywall.trialLabel', { days: monthlyTrialDays })}
          />
          <PlanCard
            selected={selectedPlan === 'annual'}
            onPress={() => setSelectedPlan('annual')}
            label={t('paywall.annual')}
            price={annualPrice}
            perUnit={t('paywall.perYear')}
            trialLabel={t('paywall.trialLabel', { days: annualTrialDays })}
            badge={t('paywall.bestValueBadge')}
            savingsLabel={t('paywall.saveBadge', { percent: savingsPercent })}
          />
        </View>

        <Button label={t('paywall.cta')} onPress={() => void onSubscribe()} loading={busy} />
        <Pressable onPress={() => void onRestore()} hitSlop={12} style={styles.restoreButton}>
          <Text style={[styles.restoreText, { color: theme.textSecondary }]}>{t('paywall.restore')}</Text>
        </Pressable>

        <Text style={[styles.legal, { color: theme.textMuted }]}>{t('paywall.legal')}</Text>
      </ScrollView>
    </Screen>
  );
}

interface PlanCardProps {
  selected: boolean;
  onPress: () => void;
  label: string;
  price: string;
  perUnit: string;
  trialLabel: string;
  badge?: string;
  savingsLabel?: string;
}

function PlanCard({ selected, onPress, label, price, perUnit, trialLabel, badge, savingsLabel }: PlanCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.planCard,
        { backgroundColor: theme.surface, borderColor: selected ? theme.accent : theme.border },
        selected && { backgroundColor: theme.accentSoft },
      ]}>
      {badge && (
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: theme.accent }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        </View>
      )}
      <Text style={[styles.planLabel, { color: theme.text }]}>{label}</Text>
      <View style={styles.planPriceRow}>
        <Text style={[styles.planPrice, { color: theme.text }]}>{price}</Text>
        <Text style={[styles.planPriceUnit, { color: theme.textMuted }]}>{perUnit}</Text>
        {savingsLabel && <Text style={[styles.savingsLabel, { color: theme.accent }]}>{savingsLabel}</Text>}
      </View>
      <Text style={[styles.planTrial, { color: theme.accent }]}>{trialLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.six,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: Spacing.two,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
    marginBottom: Spacing.five,
  },
  crownWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: FontSize.title1,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: FontSize.body,
    textAlign: 'center',
  },
  benefits: {
    gap: Spacing.two,
    marginBottom: Spacing.five,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  benefitText: {
    fontSize: FontSize.body,
    flex: 1,
  },
  plans: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  planCard: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  badgeRow: {
    position: 'absolute',
    top: -10,
    right: Spacing.two,
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '700',
  },
  planLabel: {
    fontSize: FontSize.footnote,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  planPrice: {
    fontSize: FontSize.title3,
    fontWeight: '700',
  },
  savingsLabel: {
    fontSize: FontSize.caption,
    fontWeight: '700',
  },
  planPriceUnit: {
    fontSize: FontSize.caption,
  },
  planTrial: {
    fontSize: FontSize.caption,
    fontWeight: '600',
  },
  restoreButton: {
    alignItems: 'center',
    marginTop: Spacing.three,
    padding: Spacing.two,
  },
  restoreText: {
    fontSize: FontSize.footnote,
    fontWeight: '600',
  },
  legal: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: Spacing.four,
    lineHeight: 16,
  },
});
