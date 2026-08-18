import { useCameraPermissions } from 'expo-camera';
import { Linking } from 'react-native';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Spacing } from '@/constants/theme';
import { Button } from '@/ui/components/Button';
import { Screen } from '@/ui/components/Screen';

import { hasAcknowledgedScanPrivacy, setScanPrivacyAcknowledged } from './scan-privacy';
import { ScanPrivacyView } from './scan-privacy-view';

/**
 * Étape 2 : porte de confidentialité + permission caméra. La vraie capture guidée (état A)
 * arrive à l'étape suivante — ce composant affiche pour l'instant un état d'attente une fois
 * la permission caméra obtenue.
 */
export function ScanView() {
  const { t } = useTranslation();
  const [acknowledged, setAcknowledged] = useState<boolean | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    void hasAcknowledgedScanPrivacy().then(setAcknowledged);
  }, []);

  if (acknowledged === null) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      </Screen>
    );
  }

  if (!acknowledged) {
    return (
      <ScanPrivacyView
        onAcknowledge={() => {
          void setScanPrivacyAcknowledged().then(() => {
            setAcknowledged(true);
            void requestPermission();
          });
        }}
        onLater={() => setAcknowledged(false)}
      />
    );
  }

  if (!permission) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen>
        <View style={styles.centered}>
          <SymbolView name="camera.fill" size={32} tintColor={Colors.textMuted} />
          <Text style={styles.message}>{t('scan.permission.denied')}</Text>
          {permission.canAskAgain ? (
            <Button label={t('scan.permission.request')} onPress={() => void requestPermission()} />
          ) : (
            <Button label={t('scan.permission.openSettings')} variant="ghost" onPress={() => void Linking.openSettings()} />
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.centered}>
        <SymbolView name="checkmark.circle.fill" size={32} tintColor={Colors.accent} />
        <Text style={styles.message}>{t('scan.permission.ready')}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  message: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    textAlign: 'center',
  },
});
