import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Spacing } from '@/constants/theme';
import { Card } from '@/ui/components/Card';
import { Screen } from '@/ui/components/Screen';

const METRICS = [
  { titleKey: 'coach.scoreInfo.volumeTitle', bodyKey: 'coach.scoreInfo.volumeBody' },
  { titleKey: 'coach.scoreInfo.qualityTitle', bodyKey: 'coach.scoreInfo.qualityBody' },
  { titleKey: 'coach.scoreInfo.regularityTitle', bodyKey: 'coach.scoreInfo.regularityBody' },
  { titleKey: 'coach.scoreInfo.timingTitle', bodyKey: 'coach.scoreInfo.timingBody' },
] as const;

export function ScoreInfoView() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <SymbolView name="chevron.left" size={16} tintColor={Colors.textSecondary} />
          <Text style={styles.backLabel}>{t('coach.detailBack')}</Text>
        </Pressable>

        <Text style={styles.title}>{t('coach.scoreInfo.title')}</Text>
        <Text style={styles.intro}>{t('coach.scoreInfo.intro')}</Text>

        <View style={styles.list}>
          {METRICS.map((metric) => (
            <Card key={metric.titleKey} style={styles.metricCard}>
              <Text style={styles.metricTitle}>{t(metric.titleKey)}</Text>
              <Text style={styles.metricBody}>{t(metric.bodyKey)}</Text>
            </Card>
          ))}
        </View>

        <Text style={styles.outro}>{t('coach.scoreInfo.outro')}</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.six,
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  backLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    fontWeight: '600',
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.title2,
    fontWeight: '700',
  },
  intro: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    lineHeight: 22,
  },
  list: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  metricCard: {
    gap: Spacing.one,
  },
  metricTitle: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '700',
  },
  metricBody: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    lineHeight: 20,
  },
  outro: {
    color: Colors.textMuted,
    fontSize: FontSize.caption,
    marginTop: Spacing.two,
    textAlign: 'center',
  },
});
