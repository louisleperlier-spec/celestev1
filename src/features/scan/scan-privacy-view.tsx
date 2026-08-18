import { SymbolView } from 'expo-symbols';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { Button } from '@/ui/components/Button';
import { Screen } from '@/ui/components/Screen';

interface ScanPrivacyViewProps {
  onAcknowledge: () => void;
  onLater: () => void;
}

export function ScanPrivacyView({ onAcknowledge, onLater }: ScanPrivacyViewProps) {
  const { t } = useTranslation();

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <SymbolView name="lock.fill" size={28} tintColor={Colors.accent} />
        </View>
        <Text style={styles.title}>{t('scan.privacy.title')}</Text>
        <Text style={styles.body}>{t('scan.privacy.body')}</Text>
        <View style={styles.actions}>
          <Button label={t('scan.privacy.acknowledge')} onPress={onAcknowledge} />
          <Button label={t('scan.privacy.later')} variant="ghost" onPress={onLater} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.title2,
    fontWeight: '700',
  },
  body: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    lineHeight: 22,
  },
  actions: {
    marginTop: Spacing.five,
    gap: Spacing.two,
  },
});
