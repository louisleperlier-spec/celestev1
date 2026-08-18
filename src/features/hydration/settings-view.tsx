import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { useAccentTheme, useTheme } from '@/features/premium/theme-context';
import { usePremiumGate } from '@/features/premium/use-premium-gate';
import { deleteCustomDrink, listCustomDrinks } from '@/features/hydration/custom-drinks';
import { addReminder, listReminders, removeReminder, Reminder } from '@/features/reminders/reminders';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Screen } from '@/ui/components/Screen';

import { useHydration } from './hydration-context';
import { CustomDrink } from './types';

const REMINDER_HOUR_PRESETS = [7, 8, 9, 12, 18, 20];

function formatHour(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function SettingsView() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { isPremium, guard } = usePremiumGate();
  const { accentThemeId, setAccentThemeId, options: accentOptions } = useAccentTheme();
  const {
    settings,
    setDailyGoal,
    setAdaptiveGoalEnabled,
    healthSupported,
    enableHealthSync,
    disableHealthSync,
  } = useHydration();

  const [goal, setGoal] = useState(String(settings.dailyGoalMl));
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [addingReminder, setAddingReminder] = useState(false);
  const [reminderDenied, setReminderDenied] = useState(false);
  const [customDrinks, setCustomDrinks] = useState<CustomDrink[]>([]);

  const refreshReminders = useCallback(() => {
    void listReminders().then(setReminders);
  }, []);

  useEffect(() => {
    refreshReminders();
    void listCustomDrinks().then(setCustomDrinks);
  }, [refreshReminders]);

  const onSaveGoal = async () => {
    const value = Math.max(250, Math.round(Number(goal) || settings.dailyGoalMl));
    await setDailyGoal(value);
  };

  const onOpenAddReminder = () => {
    if (reminders.length >= 1 && !isPremium) {
      guard(() => {});
      return;
    }
    setAddingReminder(true);
    setReminderDenied(false);
  };

  const onPickReminderHour = async (hour: number) => {
    const created = await addReminder(hour, 0);
    setReminderDenied(!created);
    if (created) {
      setReminders((current) => [...current, created]);
      setAddingReminder(false);
    }
  };

  const onRemoveReminder = (id: string) => {
    void removeReminder(id).then(refreshReminders);
  };

  const onToggleAdaptiveGoal = () => {
    if (settings.adaptiveGoalEnabled) {
      void setAdaptiveGoalEnabled(false);
      return;
    }
    guard(() => void setAdaptiveGoalEnabled(true));
  };

  const onDeleteCustomDrink = (drink: CustomDrink) => {
    Alert.alert(drink.name, undefined, [
      { text: t('addEntry.cancel'), style: 'cancel' },
      {
        text: t('journal.delete'),
        style: 'destructive',
        onPress: () => {
          void deleteCustomDrink(drink.id).then(() => {
            setCustomDrinks((current) => current.filter((d) => d.id !== drink.id));
          });
        },
      },
    ]);
  };

  const onSelectAccentTheme = (id: string) => {
    if (id === accentOptions[0].id) {
      void setAccentThemeId(id);
      return;
    }
    guard(() => void setAccentThemeId(id));
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{t('settings.title')}</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.close}>{t('settings.close')}</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Text style={[styles.label, { color: theme.text }]}>{t('settings.dailyGoal')}</Text>
          <Text style={styles.hint}>
            {settings.adaptiveGoalEnabled ? t('settings.adaptiveGoalDescription') : t('settings.dailyGoalHint')}
          </Text>
          {!settings.adaptiveGoalEnabled && (
            <>
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
            </>
          )}
        </Card>

        <Card style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.label, { color: theme.text }]}>{t('settings.adaptiveGoalSection')}</Text>
            {!isPremium && <PremiumBadge />}
          </View>
          <Text style={styles.hint}>{t('settings.adaptiveGoalDescription')}</Text>
          <Button
            label={
              settings.adaptiveGoalEnabled
                ? t('settings.adaptiveGoalEnabled', { goal: settings.dailyGoalMl })
                : t('settings.adaptiveGoalEnable')
            }
            variant={settings.adaptiveGoalEnabled ? 'ghost' : 'primary'}
            onPress={onToggleAdaptiveGoal}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.label, { color: theme.text }]}>{t('settings.healthSection')}</Text>
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
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.label, { color: theme.text }]}>{t('settings.reminderSection')}</Text>
            {!isPremium && <PremiumBadge />}
          </View>
          <Text style={styles.hint}>{t('settings.reminderDescription')}</Text>

          {reminders.length === 0 ? (
            <Text style={styles.hint}>{t('settings.reminderEmpty')}</Text>
          ) : (
            <View style={styles.reminderList}>
              {reminders.map((reminder) => (
                <View key={reminder.id} style={styles.reminderRow}>
                  <Text style={[styles.reminderTime, { color: theme.text }]}>{formatHour(reminder.hour, reminder.minute)}</Text>
                  <Pressable onPress={() => onRemoveReminder(reminder.id)} hitSlop={12}>
                    <SymbolView name="trash" size={16} tintColor={Colors.textMuted} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {reminderDenied && <Text style={styles.hint}>{t('settings.reminderPermissionDenied')}</Text>}

          {addingReminder ? (
            <View style={styles.presetsRow}>
              {REMINDER_HOUR_PRESETS.map((hour) => (
                <Pressable key={hour} onPress={() => void onPickReminderHour(hour)} style={styles.preset}>
                  <Text style={styles.presetText}>{formatHour(hour, 0)}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Button label={t('settings.reminderAdd')} variant="ghost" onPress={onOpenAddReminder} />
          )}
        </Card>

        <Card style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.label, { color: theme.text }]}>{t('settings.customDrinksSection')}</Text>
            {!isPremium && <PremiumBadge />}
          </View>
          <Text style={styles.hint}>{t('settings.customDrinksDescription')}</Text>
          {customDrinks.length === 0 ? (
            <Text style={styles.hint}>{t('settings.customDrinksEmpty')}</Text>
          ) : (
            <View style={styles.reminderList}>
              {customDrinks.map((drink) => (
                <View key={drink.id} style={styles.reminderRow}>
                  <Text style={[styles.reminderTime, { color: theme.text }]}>{drink.name}</Text>
                  <Pressable onPress={() => onDeleteCustomDrink(drink)} hitSlop={12}>
                    <SymbolView name="trash" size={16} tintColor={Colors.textMuted} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.label, { color: theme.text }]}>{t('settings.themeSection')}</Text>
            {!isPremium && <PremiumBadge />}
          </View>
          <Text style={styles.hint}>{t('settings.themeDescription')}</Text>
          <View style={styles.swatchRow}>
            {accentOptions.map((option) => {
              const active = option.id === accentThemeId;
              return (
                <Pressable key={option.id} onPress={() => onSelectAccentTheme(option.id)} style={styles.swatchWrap}>
                  <View
                    style={[
                      styles.swatch,
                      { backgroundColor: option.accent, borderColor: active ? theme.text : 'transparent' },
                    ]}>
                    {active && <SymbolView name="checkmark" size={14} tintColor="#000000" />}
                  </View>
                  <Text style={styles.swatchLabel}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function PremiumBadge() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View style={[styles.premiumBadge, { backgroundColor: theme.accentSoft }]}>
      <SymbolView name="crown.fill" size={10} tintColor={theme.accent} />
      <Text style={[styles.premiumBadgeText, { color: theme.accent }]}>{t('settings.premiumBadge')}</Text>
    </View>
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  label: {
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
  presetText: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    fontWeight: '600',
  },
  reminderList: {
    gap: Spacing.one,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
  },
  reminderTime: {
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  swatchRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  swatchWrap: {
    alignItems: 'center',
    gap: 4,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchLabel: {
    color: Colors.textMuted,
    fontSize: 11,
  },
});
