import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Screen, SelectableCard, Text } from '@/components/ui';
import { COACHES, COACH_IMAGES } from '@/data';
import { colors, gradients, heartZones, radius, spacing } from '@/theme';

/**
 * Étape 1 — écran de vérification du design system.
 * Sera remplacé par l'onboarding à l'étape 2.
 */
const LEVELS = ['Débutant', 'Intermédiaire', 'Avancé'] as const;

const SWATCHES: { name: string; value: string }[] = [
  { name: 'Fond', value: colors.bg },
  { name: 'Surface', value: colors.surface },
  { name: 'Bordure', value: colors.border },
  { name: 'Rose néon', value: colors.pink },
  { name: 'Rose clair', value: colors.pinkLight },
  { name: 'Rose pâle', value: colors.pinkPale },
  { name: 'Texte 2', value: colors.textSecondary },
  { name: 'Calories', value: colors.kcal },
];

export default function DesignSystemScreen() {
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('Débutant');

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.hero}>
        <Text weight="light" style={styles.logo}>
          NÉA
        </Text>
        <Text weight="semibold" color={colors.pinkLight} style={styles.logoSub}>
          COACHING SPORTIF IA
        </Text>
        <Text variant="heading" style={styles.center}>
          Plus qu&apos;un programme. Un coach qui te connaît vraiment.
        </Text>
        <Text variant="caption" style={styles.center}>
          Ton meilleur toi, chaque jour.
        </Text>
      </View>

      <Text variant="title">Coachs</Text>
      <View style={styles.coaches}>
        {COACHES.map((c) => (
          <View key={c.id} style={styles.coach}>
            <Image source={COACH_IMAGES[c.id].tete} style={[styles.avatar, { borderColor: c.c }]} />
            <Text variant="caption">{c.nom}</Text>
          </View>
        ))}
      </View>

      <Text variant="title">Couleurs</Text>
      <View style={styles.swatches}>
        {SWATCHES.map((s) => (
          <View key={s.name} style={styles.swatch}>
            <View style={[styles.swatchColor, { backgroundColor: s.value }]} />
            <Text variant="caption">{s.name}</Text>
          </View>
        ))}
      </View>

      <Text variant="title">Zones cardio</Text>
      <View style={styles.zones}>
        {Object.entries(heartZones).map(([zone, color]) => (
          <View key={zone} style={[styles.zone, { backgroundColor: color }]}>
            <Text weight="black" color={colors.onPrimary}>
              {zone.toUpperCase()}
            </Text>
          </View>
        ))}
      </View>

      <Text variant="title">Boutons</Text>
      <Button label="Commencer" />
      <Button label="Plus tard" variant="secondary" />

      <Text variant="title">Sélection</Text>
      {LEVELS.map((l) => (
        <SelectableCard key={l} selected={level === l} onPress={() => setLevel(l)}>
          <Text variant="heading">{l}</Text>
        </SelectableCard>
      ))}

      <Text variant="title">Cartes</Text>
      <Card>
        <Text variant="heading">Carte standard</Text>
        <Text color={colors.textSecondary}>Surface #121215, bordure #26262B, radius 16.</Text>
        <View style={styles.kcal}>
          <Text weight="extrabold" color={colors.onPrimary} style={styles.small}>
            kcal
          </Text>
        </View>
      </Card>
      <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.plus}>
        <Text variant="heading" color={colors.onPrimary}>
          NÉA Plus
        </Text>
      </LinearGradient>

      <Text variant="title">Typo Inter</Text>
      {(['light', 'regular', 'medium', 'semibold', 'bold', 'extrabold', 'black'] as const).map((w) => (
        <Text key={w} weight={w}>
          Inter {w}
        </Text>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl * 2 },
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  // Logo du prototype (.logo / .logo-sub) : Inter 300, 42px, espacement 0,42em
  logo: { fontSize: 42, lineHeight: 50, letterSpacing: 42 * 0.42, paddingLeft: 42 * 0.42, textAlign: 'center' },
  logoSub: { fontSize: 10.5, lineHeight: 14, letterSpacing: 10.5 * 0.32, textAlign: 'center', marginBottom: spacing.md },
  center: { textAlign: 'center' },
  coaches: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  coach: { width: 72, alignItems: 'center', gap: spacing.xs },
  avatar: { width: 56, height: 56, borderRadius: radius.pill, borderWidth: 2 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  swatch: { width: 72, alignItems: 'center', gap: spacing.xs },
  swatchColor: {
    width: 56,
    height: 56,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  zones: { flexDirection: 'row', gap: spacing.sm },
  zone: { flex: 1, height: 44, borderRadius: radius.card, alignItems: 'center', justifyContent: 'center' },
  kcal: {
    alignSelf: 'flex-start',
    backgroundColor: colors.kcal,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  small: { fontSize: 12 },
  plus: { borderRadius: radius.card, padding: spacing.lg },
});
