import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/ui/components/button';
import { FrostCard } from '@/ui/components/card';
import { IconSymbol } from '@/ui/components/icon-symbol';
import { NightSkyBackdrop } from '@/ui/components/backdrop';
import { Screen } from '@/ui/components/screen';
import { Spacing } from '@/constants/theme';

const BENEFITS = [
  'Toutes les méditations guidées',
  'Historique complet du journal',
  'Toutes les heures miroir expliquées',
  'Une nouvelle carte du jour, chaque jour',
];

export function PaywallView() {
  const router = useRouter();

  function handleSubscribe() {
    Alert.alert(
      'Abonnements bientôt disponibles',
      "Le paiement n'est pas encore connecté sur cette version. On l'activera avec ton compte RevenueCat/Apple.",
    );
  }

  function handleRestore() {
    Alert.alert('Restaurer les achats', "Rien à restaurer pour l'instant — l'abonnement n'est pas encore actif.");
  }

  return (
    <View style={styles.fill}>
      <NightSkyBackdrop starCount={40} />
      <Screen transparent contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.close}>
          <ThemedText themeColor="text">Fermer</ThemedText>
        </Pressable>

        <ThemedText type="hero" themeColor="text" style={{ textAlign: 'center', marginTop: Spacing.six }}>
          Céleste Premium ✦
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.one }}>
          Va plus loin dans ton rituel quotidien.
        </ThemedText>

        <FrostCard style={{ marginTop: Spacing.five, gap: Spacing.two }}>
          {BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
              <ThemedText themeColor="text" style={{ marginLeft: Spacing.two, flex: 1 }}>
                {benefit}
              </ThemedText>
            </View>
          ))}
        </FrostCard>

        <View style={{ marginTop: Spacing.five }}>
          <Button label="Continuer" variant="frost" onPress={handleSubscribe} />
          <Pressable onPress={handleRestore} style={{ marginTop: Spacing.three, alignItems: 'center' }}>
            <ThemedText themeColor="textSecondary">Restaurer les achats</ThemedText>
          </Pressable>
        </View>

        <View style={styles.legalRow}>
          <Pressable onPress={() => Alert.alert('Conditions', 'Bientôt disponible.')}>
            <ThemedText themeColor="textMuted" style={{ fontSize: 12 }}>
              Conditions
            </ThemedText>
          </Pressable>
          <ThemedText themeColor="textMuted" style={{ fontSize: 12 }}>
            ·
          </ThemedText>
          <Pressable onPress={() => Alert.alert('Confidentialité', 'Bientôt disponible.')}>
            <ThemedText themeColor="textMuted" style={{ fontSize: 12 }}>
              Confidentialité
            </ThemedText>
          </Pressable>
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center' },
  close: { position: 'absolute', top: Spacing.four, right: Spacing.four, zIndex: 1 },
  benefitRow: { flexDirection: 'row', alignItems: 'center' },
  legalRow: { flexDirection: 'row', gap: Spacing.two, justifyContent: 'center', marginTop: Spacing.four },
});
