import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { Button } from '@/ui/components/Button';
import { DrinkIcon } from '@/ui/components/DrinkIcon';
import { Screen } from '@/ui/components/Screen';

import { useHydration } from './hydration-context';
import { DRINK_TYPES, DrinkType } from './types';

const PRESET_VOLUMES = [150, 250, 330, 500, 750];

export function AddEntryView() {
  const { t } = useTranslation();
  const router = useRouter();
  const { addEntry } = useHydration();
  const [volume, setVolume] = useState('250');
  const [drinkType, setDrinkType] = useState<DrinkType>('water');
  const [saving, setSaving] = useState(false);

  const numericVolume = Math.max(0, Math.round(Number(volume) || 0));
  const canSave = numericVolume > 0 && !saving;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    await addEntry(numericVolume, drinkType);
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
            {PRESET_VOLUMES.map((preset) => (
              <Pressable
                key={preset}
                onPress={() => setVolume(String(preset))}
                style={[styles.preset, numericVolume === preset && styles.presetActive]}>
                <Text style={[styles.presetText, numericVolume === preset && styles.presetTextActive]}>{preset}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('addEntry.drinkTypeLabel')}</Text>
          <View style={styles.drinkGrid}>
            {DRINK_TYPES.map((type) => {
              const active = type === drinkType;
              return (
                <Pressable key={type} onPress={() => setDrinkType(type)} style={[styles.drinkChip, active && styles.drinkChipActive]}>
                  <DrinkIcon type={type} size={18} color={active ? Colors.accent : Colors.textSecondary} />
                  <Text style={[styles.drinkChipText, active && styles.drinkChipTextActive]}>{t(`drink.${type}`)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <Button label={t('addEntry.save')} onPress={() => void onSave()} disabled={!canSave} loading={saving} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
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
  drinkChipActive: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
  },
  drinkChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    fontWeight: '600',
  },
  drinkChipTextActive: {
    color: Colors.accent,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: Spacing.three,
  },
});
