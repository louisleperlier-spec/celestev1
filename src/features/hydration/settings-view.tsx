import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { deleteAllScans, scanStorageStats } from '@/features/scan/scan';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Screen } from '@/ui/components/Screen';

import { useHydration } from './hydration-context';

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 Ko';
  const units = ['Ko', 'Mo', 'Go'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function SettingsView() {
  const { t } = useTranslation();
  const router = useRouter();
  const { settings, setDailyGoal, healthSupported, enableHealthSync, disableHealthSync } = useHydration();
  const [goal, setGoal] = useState(String(settings.dailyGoalMl));
  const [scanStats, setScanStats] = useState<{ count: number; bytes: number } | null>(null);

  const refreshScanStats = useCallback(() => {
    void scanStorageStats().then(setScanStats);
  }, []);

  useEffect(() => {
    refreshScanStats();
  }, [refreshScanStats]);

  const onSaveGoal = async () => {
    const value = Math.max(250, Math.round(Number(goal) || settings.dailyGoalMl));
    await setDailyGoal(value);
  };

  const onDeleteAllScans = () => {
    Alert.alert(t('settings.scanDeleteAllConfirmTitle'), t('settings.scanDeleteAllConfirmBody'), [
      { text: t('settings.scanDeleteAllCancel'), style: 'cancel' },
      {
        text: t('settings.scanDeleteAllConfirmAction'),
        style: 'destructive',
        onPress: () => {
          void deleteAllScans().then(refreshScanStats);
        },
      },
    ]);
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

      <Card style={styles.card}>
        <Text style={styles.label}>{t('settings.scanSection')}</Text>
        <Text style={styles.hint}>
          {scanStats
            ? t('settings.scanStorageCount', {
                count: scanStats.count,
                size: formatBytes(scanStats.bytes),
              })
            : ''}
        </Text>
        {scanStats && scanStats.count > 0 && (
          <Button label={t('settings.scanDeleteAll')} variant="danger" onPress={onDeleteAllScans} />
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
