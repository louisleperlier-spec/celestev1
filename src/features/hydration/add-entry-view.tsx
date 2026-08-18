import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { addCustomDrink, listCustomDrinks } from '@/features/hydration/custom-drinks';
import { useTheme } from '@/features/premium/theme-context';
import { usePremiumGate } from '@/features/premium/use-premium-gate';
import { Button } from '@/ui/components/Button';
import { DrinkIcon } from '@/ui/components/DrinkIcon';
import { Screen } from '@/ui/components/Screen';

import { useHydration } from './hydration-context';
import { CustomDrink, DRINK_TYPES, DrinkType } from './types';

const PRESET_VOLUMES = [150, 250, 330, 500, 750];

type QualityChoice = 'water' | 'coffee';

export function AddEntryView() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { guard } = usePremiumGate();
  const { addEntry } = useHydration();
  const [volume, setVolume] = useState('250');
  const [drinkType, setDrinkType] = useState<DrinkType>('water');
  const [customDrinks, setCustomDrinks] = useState<CustomDrink[]>([]);
  const [selectedCustomDrinkId, setSelectedCustomDrinkId] = useState<string | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customQuality, setCustomQuality] = useState<QualityChoice>('water');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void listCustomDrinks().then(setCustomDrinks);
  }, []);

  const numericVolume = Math.max(0, Math.round(Number(volume) || 0));
  const selectedCustomDrink = customDrinks.find((d) => d.id === selectedCustomDrinkId) ?? null;
  const canSave = numericVolume > 0 && !saving && (drinkType !== 'custom' || selectedCustomDrink !== null);

  const selectBuiltIn = (type: DrinkType) => {
    setDrinkType(type);
    setSelectedCustomDrinkId(null);
    setShowCustomForm(false);
  };

  const selectCustomDrink = (drink: CustomDrink) => {
    setDrinkType('custom');
    setSelectedCustomDrinkId(drink.id);
    setShowCustomForm(false);
  };

  const onOpenCustomForm = () => {
    guard(() => {
      setShowCustomForm(true);
      setCustomName('');
      setCustomQuality('water');
    });
  };

  const onSaveCustomDrink = async () => {
    const name = customName.trim();
    if (!name) return;
    const drink = await addCustomDrink({
      name,
      hydrationFactor: customQuality === 'water' ? 1 : 0.85,
      lowersQuality: customQuality === 'coffee',
    });
    setCustomDrinks((current) => [...current, drink]);
    selectCustomDrink(drink);
  };

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    if (drinkType === 'custom' && selectedCustomDrink) {
      await addEntry(numericVolume, 'custom', undefined, {
        name: selectedCustomDrink.name,
        hydrationFactor: selectedCustomDrink.hydrationFactor,
        lowersQuality: selectedCustomDrink.lowersQuality,
      });
    } else {
      await addEntry(numericVolume, drinkType);
    }
    router.back();
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('addEntry.title')}</Text>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.cancel}>{t('addEntry.cancel')}</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('addEntry.volumeLabel')}</Text>
          <TextInput
            value={volume}
            onChangeText={setVolume}
            keyboardType="number-pad"
            style={styles.input}
            placeholder="250"
            placeholderTextColor={Colors.textMuted}
          />
          <View style={styles.presetsRow}>
            {PRESET_VOLUMES.map((preset) => {
              const active = numericVolume === preset;
              return (
                <Pressable
                  key={preset}
                  onPress={() => setVolume(String(preset))}
                  style={[styles.preset, active && { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
                  <Text style={[styles.presetText, active && { color: theme.accent }]}>{preset}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('addEntry.drinkTypeLabel')}</Text>
          <View style={styles.drinkGrid}>
            {DRINK_TYPES.map((type) => {
              const active = drinkType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => selectBuiltIn(type)}
                  style={[styles.drinkChip, active && { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
                  <DrinkIcon type={type} size={18} color={active ? theme.accent : Colors.textSecondary} />
                  <Text style={[styles.drinkChipText, active && { color: theme.accent }]}>{t(`drink.${type}`)}</Text>
                </Pressable>
              );
            })}
            {customDrinks.map((drink) => {
              const active = drinkType === 'custom' && selectedCustomDrinkId === drink.id;
              return (
                <Pressable
                  key={drink.id}
                  onPress={() => selectCustomDrink(drink)}
                  style={[styles.drinkChip, active && { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
                  <DrinkIcon type="custom" size={18} color={active ? theme.accent : Colors.textSecondary} />
                  <Text style={[styles.drinkChipText, active && { color: theme.accent }]}>{drink.name}</Text>
                </Pressable>
              );
            })}
            <Pressable onPress={onOpenCustomForm} style={styles.drinkChip}>
              <SymbolView name="plus" size={14} tintColor={Colors.textSecondary} />
              <Text style={styles.drinkChipText}>{t('addEntry.customDrinkAdd')}</Text>
            </Pressable>
          </View>

          {showCustomForm && (
            <View style={[styles.customForm, { borderColor: theme.border }]}>
              <Text style={styles.customFormLabel}>{t('addEntry.customDrinkNameLabel')}</Text>
              <TextInput
                value={customName}
                onChangeText={setCustomName}
                style={styles.input}
                placeholder={t('addEntry.customDrinkNamePlaceholder')}
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.customFormLabel}>{t('addEntry.customDrinkQualityLabel')}</Text>
              <View style={styles.qualityRow}>
                <QualityOption
                  active={customQuality === 'water'}
                  label={t('addEntry.customDrinkQualityWater')}
                  hint={t('addEntry.customDrinkQualityWaterHint')}
                  onPress={() => setCustomQuality('water')}
                />
                <QualityOption
                  active={customQuality === 'coffee'}
                  label={t('addEntry.customDrinkQualityCoffee')}
                  hint={t('addEntry.customDrinkQualityCoffeeHint')}
                  onPress={() => setCustomQuality('coffee')}
                />
              </View>

              <View style={styles.customFormActions}>
                <Button
                  label={t('addEntry.customDrinkSave')}
                  variant="ghost"
                  disabled={!customName.trim()}
                  onPress={() => void onSaveCustomDrink()}
                />
                <Pressable onPress={() => setShowCustomForm(false)} hitSlop={12} style={styles.customFormCancel}>
                  <Text style={styles.cancel}>{t('addEntry.customDrinkCancel')}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Button label={t('addEntry.save')} onPress={() => void onSave()} disabled={!canSave} loading={saving} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

interface QualityOptionProps {
  active: boolean;
  label: string;
  hint: string;
  onPress: () => void;
}

function QualityOption({ active, label, hint, onPress }: QualityOptionProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.qualityOption, { borderColor: active ? theme.accent : Colors.border }, active && { backgroundColor: theme.accentSoft }]}>
      <Text style={[styles.qualityLabel, active && { color: theme.accent }]}>{label}</Text>
      <Text style={styles.qualityHint}>{hint}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  cancel: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
  },
  section: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    color: Colors.text,
    fontSize: FontSize.title3,
    paddingHorizontal: Spacing.three,
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
  drinkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  drinkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  drinkChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    fontWeight: '600',
  },
  customForm: {
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.two,
  },
  customFormLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    fontWeight: '600',
  },
  qualityRow: {
    gap: Spacing.two,
  },
  qualityOption: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.two,
    gap: 2,
  },
  qualityLabel: {
    color: Colors.text,
    fontSize: FontSize.footnote,
    fontWeight: '700',
  },
  qualityHint: {
    color: Colors.textMuted,
    fontSize: FontSize.caption,
  },
  customFormActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  customFormCancel: {
    padding: Spacing.one,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: Spacing.three,
  },
});
