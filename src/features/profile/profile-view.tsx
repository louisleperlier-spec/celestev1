import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/ui/components/button';
import { Card } from '@/ui/components/card';
import { IconSymbol } from '@/ui/components/icon-symbol';
import { Screen } from '@/ui/components/screen';
import { SectionLabel } from '@/ui/components/section-label';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { clearJournal, getPoints } from '@/lib/storage';

function SettingsRow({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: Parameters<typeof IconSymbol>[0]['name'];
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.settingsRow}>
      <IconSymbol name={icon} size={20} color={destructive ? theme.danger : theme.textSecondary} />
      <ThemedText style={{ flex: 1, marginLeft: Spacing.two }} themeColor={destructive ? 'danger' : 'text'}>
        {label}
      </ThemedText>
      <IconSymbol name="chevron.right" size={14} color={theme.textMuted} />
    </Pressable>
  );
}

export function ProfileView() {
  const router = useRouter();
  const theme = useTheme();
  const [points, setPoints] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getPoints().then(setPoints);
    }, [])
  );

  function comingSoon(label: string) {
    Alert.alert(label, 'Cette page arrive bientôt.');
  }

  function confirmClearJournal() {
    Alert.alert('Effacer le journal ?', 'Toutes tes entrées seront définitivement supprimées.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Effacer', style: 'destructive', onPress: () => clearJournal() },
    ]);
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
          <IconSymbol name="sparkles" size={28} color={theme.accent} />
        </View>
        <ThemedText type="heading" style={{ marginTop: Spacing.two }}>
          Ton espace
        </ThemedText>
        <ThemedText themeColor="textSecondary">{points} point{points > 1 ? 's' : ''} de régularité</ThemedText>
      </View>

      <Card style={{ alignItems: 'center' }}>
        <SectionLabel>Abonnement</SectionLabel>
        <ThemedText style={{ marginTop: 2, marginBottom: Spacing.two }} themeColor="textSecondary">
          Aucun abonnement actif
        </ThemedText>
        <Button label="Découvrir Céleste Premium" onPress={() => router.push('/paywall')} />
      </Card>

      <SectionLabel>Réglages</SectionLabel>
      <Card padded={false}>
        <SettingsRow icon="moon.stars" label="Thème — automatique (suit ton iPhone)" onPress={() => comingSoon('Thème')} />
        <SettingsRow icon="globe" label="Langue — Français" onPress={() => comingSoon('Langue')} />
        <SettingsRow icon="trash" label="Effacer mon journal" destructive onPress={confirmClearJournal} />
      </Card>

      <SectionLabel>À propos</SectionLabel>
      <Card padded={false}>
        <SettingsRow icon="doc.text" label="Confidentialité" onPress={() => comingSoon('Confidentialité')} />
        <SettingsRow icon="doc.text" label="Conditions d'utilisation" onPress={() => comingSoon("Conditions d'utilisation")} />
        <SettingsRow icon="questionmark.circle" label="Aide & support" onPress={() => comingSoon('Aide & support')} />
      </Card>

      <ThemedText themeColor="textMuted" style={{ textAlign: 'center', marginTop: Spacing.three }}>
        Céleste ✦ version 0.1.0
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: Spacing.three, marginBottom: Spacing.two },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
});
