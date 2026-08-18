import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { DEFAULT_REMINDER_SETTINGS, enableReminder, disableReminder, loadReminderSettings, ReminderSettings } from '@/features/reminders/reminders';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Screen } from '@/ui/components/Screen';

import { useHydration } from './hydration-context';

const REMINDER_HOUR_PRESETS = [7, 8, 9, 12, 18, 20];

function formatHour(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function SettingsView() {
  const { t } = useTranslation();
  const router = useRouter();
  const { settings, setDailyGoal, healthSupported, enableHealthSync, disableHealthSync } = useHydration();
  const [goal, setGoal] = useState(String(settings.dailyGoalMl));
  const [reminder, setReminder] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [reminderDenied, setReminderDenied] = useState(false);

  useEffect(() => {
    void loadReminderSettings().then(setReminder);
  }, []);

  const onSaveGoal = async () => {
    const value = Math.max(250, Math.round(Number(goal) || settings.dailyGoalMl));
    await setDailyGoal(value);
  };

  const onToggleReminder = async () => {
    if (reminder.enabled) {
      await disableReminder();
      setReminder((r) => ({ ...r, enabled: false }));
      return;
    }
    const granted = await enableReminder(reminder.hour, reminder.minute);
    setReminderDenied(!granted);
    setReminder((r) => ({ ...r, enabled: granted }));
  };

  const onPickReminderHour = async (hour: number) => {
    setReminder((r) => ({ ...r, hour, minute: 0 }));
    if (reminder.enabled) {
      const granted = await enableReminder(hour, 0);
      setReminderDenied(!granted);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.close}>{t('settings.close')}</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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

        <Card style={styles.card}>
          <Text style={styles.label}>{t('settings.reminderSection')}</Text>
          <Text style={styles.hint}>{t('settings.reminderDescription')}</Text>

          <Text style={styles.subLabel}>{t('settings.reminderTimeLabel')}</Text>
          <View style={styles.presetsRow}>
            {REMINDER_HOUR_PRESETS.map((hour) => {
              const active = reminder.hour === hour;
              return (
                <Pressable
                  key={hour}
                  onPress={() => void onPickReminderHour(hour)}
                  style={[styles.preset, active && styles.presetActive]}>
                  <Text style={[styles.presetText, active && styles.presetTextActive]}>{formatHour(hour, 0)}</Text>
                </Pressable>
              );
            })}
          </View>

          {reminderDenied && <Text style={styles.hint}>{t('settings.reminderPermissionDenied')}</Text>}

          {reminder.enabled ? (
            <Button
              label={t('settings.reminderEnabled', { time: formatHour(reminder.hour, reminder.minute) })}
              variant="ghost"
              onPress={() => void onToggleReminder()}
            />
          ) : (
            <Button label={t('settings.reminderEnable')} onPress={() => void onToggleReminder()} />
          )}
        </Card>
      </ScrollView>
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
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  subLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    fontWeight: '600',
    marginTop: Spacing.one,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  preset: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetActive: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
  },
  presetText: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    fontWeight: '600',
  },
  presetTextActive: {
    color: Colors.accent,
  },
});
