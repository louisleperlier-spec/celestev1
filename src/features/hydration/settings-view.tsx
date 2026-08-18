import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Screen } from '@/ui/components/Screen';

import { useHydration } from './hydration-context';

export function SettingsView() {
  const { t } = useTranslation();
  const router = useRouter();
  const { settings, setDailyGoal, healthSupported, enableHealthSync, disableHealthSync } = useHydration();
  const [goal, setGoal] = useState(String(settings.dailyGoalMl));

  const onSaveGoal = async () => {
    const value = Math.max(250, Math.round(Number(goal) || settings.dailyGoalMl));
    await setDailyGoal(value);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.close}>{t('settings.close')}</Text>
        </Pressable>
      </View>

      <Card style={styles.card}>
        <Text style={styles.label}>{t('settings.dailyGoal')}</Text>
        <Text style={styles.hint}>{t('settings.dailyGoalHint')}</Text>
        <View style={styles.goalRow}>
          <TextInput
            value={goal}
            onChangeText={setGoal}
            keyboardType="number-pad"
            style={styles.input}
            placeholderTextColor={Colors.textMuted}
          />
          <Text style={styles.unit}>ml</Text>
        </View>
        <Button label={t('settings.save')} variant="ghost" onPress={() => void onSaveGoal()} />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.label}>{t('settings.healthSection')}</Text>
        <Text style={styles.hint}>{t('settings.healthDescription')}</Text>
        {!healthSupported ? (
          <Text style={styles.hint}>{t('home.healthUnsupported')}</Text>
        ) : settings.healthSyncEnabled ? (
          <Button label={t('home.healthEnabled')} variant="ghost" onPress={() => void disableHealthSync()} />
        ) : (
          <Button label={t('home.healthEnable')} onPress={() => void enableHealthSync()} />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.title3,
    fontWeight: '700',
  },
  close: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
  },
  card: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  label: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '700',
  },
  hint: {
    color: Colors.textMuted,
    fontSize: FontSize.footnote,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
    color: Colors.text,
    fontSize: FontSize.callout,
    paddingHorizontal: Spacing.three,
  },
  unit: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
  },
});
