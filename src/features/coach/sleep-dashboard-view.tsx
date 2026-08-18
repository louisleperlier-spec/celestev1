import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Fonts, Radius, Spacing } from '@/constants/theme';
import { addDays } from '@/lib/date';
import { isHealthKitSupported, readSleepSamples, requestSleepAuthorization } from '@/services/health/healthkit';
import { BarChart, BarChartDatum } from '@/ui/components/BarChart';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Screen } from '@/ui/components/Screen';

import { CATEGORY_TINT } from './coach-theme';
import { loadSleepConnected, setSleepConnected } from './sleep-state';
import { NightSleep, summarizeSleep } from './sleep-stats';

const WINDOW_DAYS = 7;
const TINT = CATEGORY_TINT.recovery;

function dayLabel(dateKeyValue: string): string {
  const date = new Date(`${dateKeyValue}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3);
}

function formatClock(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function SleepDashboardView() {
  const { t } = useTranslation();
  const router = useRouter();
  const supported = useMemo(() => isHealthKitSupported(), []);

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nights, setNights] = useState<NightSleep[]>([]);

  useEffect(() => {
    void loadSleepConnected().then(setConnected);
  }, []);

  const loadData = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    try {
      const start = addDays(new Date(), -WINDOW_DAYS);
      const samples = await readSleepSamples(start, new Date());
      setNights(summarizeSleep(samples).nights);
    } finally {
      setLoading(false);
    }
  }, [supported]);

  useEffect(() => {
    if (connected) void loadData();
  }, [connected, loadData]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await requestSleepAuthorization();
      await setSleepConnected(true);
      setConnected(true);
    } finally {
      setConnecting(false);
    }
  };

  const averageMinutes = nights.length > 0 ? Math.round(nights.reduce((t2, n) => t2 + n.asleepMinutes, 0) / nights.length) : 0;
  const lastNight = nights[nights.length - 1] ?? null;

  const chartData: BarChartDatum[] = useMemo(() => {
    const byDate = new Map(nights.map((n) => [n.date, n]));
    const keys: string[] = [];
    for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
      const d = addDays(new Date(), -i);
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    return keys.map((key) => {
      const night = byDate.get(key);
      return {
        key,
        label: dayLabel(key),
        value: night ? Math.round(night.asleepMinutes / 60) : 0,
        color: night ? TINT : Colors.surfaceElevated,
      };
    });
  }, [nights]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <SymbolView name="chevron.left" size={16} tintColor={Colors.textSecondary} />
          <Text style={styles.backLabel}>{t('coach.detailBack')}</Text>
        </Pressable>

        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: `${TINT}26` }]}>
            <SymbolView name="moon.zzz.fill" size={22} tintColor={TINT} />
          </View>
          <View>
            <Text style={styles.title}>{t('coach.sleep.title')}</Text>
            <Text style={styles.subtitle}>{t('coach.sleep.subtitle')}</Text>
          </View>
        </View>

        {!supported ? (
          <Card style={styles.stateCard}>
            <SymbolView name="iphone.gen3" size={22} tintColor={Colors.textMuted} />
            <Text style={styles.stateTitle}>{t('coach.sleep.unsupportedTitle')}</Text>
            <Text style={styles.stateBody}>{t('coach.sleep.unsupportedBody')}</Text>
          </Card>
        ) : !connected ? (
          <Card style={styles.stateCard}>
            <SymbolView name="heart.text.square.fill" size={22} tintColor={TINT} />
            <Text style={styles.stateTitle}>{t('coach.sleep.connectTitle')}</Text>
            <Text style={styles.stateBody}>{t('coach.sleep.connectBody')}</Text>
            <Button
              label={connecting ? t('coach.sleep.connecting') : t('coach.sleep.connectCta')}
              onPress={() => void handleConnect()}
              loading={connecting}
            />
          </Card>
        ) : loading ? (
          <Card style={styles.stateCard}>
            <ActivityIndicator color={TINT} />
            <Text style={styles.stateBody}>{t('coach.sleep.loading')}</Text>
          </Card>
        ) : nights.length === 0 ? (
          <Card style={styles.stateCard}>
            <SymbolView name="moon.zzz" size={22} tintColor={Colors.textMuted} />
            <Text style={styles.stateTitle}>{t('coach.sleep.emptyTitle')}</Text>
            <Text style={styles.stateBody}>{t('coach.sleep.emptyBody')}</Text>
          </Card>
        ) : (
          <>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{t('coach.sleep.averageLabel')}</Text>
              <Text style={[styles.summaryValue, { color: TINT }]}>
                {t('coach.sleep.durationValue', { h: Math.floor(averageMinutes / 60), m: String(averageMinutes % 60).padStart(2, '0') })}
              </Text>
            </Card>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('coach.sleep.chartTitle')}</Text>
              <Card>
                <BarChart data={chartData} maxValue={10} />
              </Card>
            </View>

            {lastNight && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('coach.sleep.lastNightTitle')}</Text>
                <Card style={styles.lastNightCard}>
                  <View style={styles.lastNightRow}>
                    <Text style={styles.lastNightLabel}>{t('coach.sleep.bedTimeLabel')}</Text>
                    <Text style={styles.lastNightValue}>{formatClock(lastNight.bedTime)}</Text>
                  </View>
                  <View style={styles.lastNightRow}>
                    <Text style={styles.lastNightLabel}>{t('coach.sleep.wakeTimeLabel')}</Text>
                    <Text style={styles.lastNightValue}>{formatClock(lastNight.wakeTime)}</Text>
                  </View>
                </Card>
              </View>
            )}
          </>
        )}

        <Text style={styles.disclaimer}>{t('coach.disclaimer')}</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.six,
    paddingTop: Spacing.two,
    gap: Spacing.four,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  backLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.title2,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.footnote,
  },
  stateCard: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
  stateTitle: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateBody: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryCard: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.footnote,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryValue: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.title1,
    fontWeight: '700',
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  lastNightCard: {
    gap: Spacing.two,
  },
  lastNightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastNightLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
  },
  lastNightValue: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '700',
    fontFamily: Fonts.mono,
  },
  disclaimer: {
    color: Colors.textMuted,
    fontSize: FontSize.caption,
    textAlign: 'center',
  },
});
