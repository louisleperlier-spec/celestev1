import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/features/premium/theme-context';
import { Screen } from '@/ui/components/Screen';

import { Routine } from './routines';

interface RoutineViewProps {
  routine: Routine;
}

export function RoutineView({ routine }: RoutineViewProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [done, setDone] = useState<Record<number, boolean>>({});

  const steps = Array.from({ length: routine.stepCount }, (_, i) =>
    t(`coach.routines.${routine.id}.steps.${i}`),
  );
  const completedCount = Object.values(done).filter(Boolean).length;

  const toggleStep = (index: number) => setDone((prev) => ({ ...prev, [index]: !prev[index] }));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <SymbolView name="chevron.left" size={16} tintColor={Colors.textSecondary} />
          <Text style={styles.backLabel}>{t('coach.detailBack')}</Text>
        </Pressable>

        <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
          <SymbolView name={routine.icon} size={26} tintColor={theme.accent} />
        </View>

        <Text style={styles.title}>{t(`coach.routines.${routine.id}.title`)}</Text>
        <Text style={styles.subtitle}>{t(`coach.routines.${routine.id}.subtitle`)}</Text>
        <Text style={styles.meta}>
          {t('coach.routines.stepsCount', { count: routine.stepCount })} · {t('coach.detailDuration', { minutes: routine.durationMinutes })}
        </Text>

        <View style={styles.stepsList}>
          {steps.map((step, index) => (
            <Pressable key={index} onPress={() => toggleStep(index)} style={styles.stepRow}>
              <SymbolView
                name={done[index] ? 'checkmark.circle.fill' : 'circle'}
                size={22}
                tintColor={done[index] ? theme.accent : Colors.textMuted}
              />
              <Text style={[styles.stepText, done[index] && styles.stepTextDone]}>{step}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.progress}>
          {t('coach.routines.progress', { done: completedCount, total: routine.stepCount })}
        </Text>

        <Text style={styles.disclaimer}>{t('coach.disclaimer')}</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.six,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  backLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    fontWeight: '600',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.title2,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
  },
  meta: {
    color: Colors.textMuted,
    fontSize: FontSize.footnote,
    marginTop: Spacing.one,
    marginBottom: Spacing.three,
  },
  stepsList: {
    gap: Spacing.three,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  stepText: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.body,
    lineHeight: 22,
  },
  stepTextDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  progress: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    fontWeight: '600',
    marginTop: Spacing.four,
  },
  disclaimer: {
    color: Colors.textMuted,
    fontSize: FontSize.caption,
    marginTop: Spacing.five,
  },
});
