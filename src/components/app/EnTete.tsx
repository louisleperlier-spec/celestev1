import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, fonts } from '@/theme';

export type Rubrique = { label: string; href: Href };

/** Rubriques de l'onglet « Entraînement » et de l'onglet « Moi ». */
export const ENTRAINEMENT: Rubrique[] = [
  { label: 'Programme', href: '/programme' },
  { label: 'Calendrier', href: { pathname: '/programme', params: { vue: 'calendrier' } } },
  { label: 'Vélo', href: '/velo' },
];
export const MOI: Rubrique[] = [
  { label: 'Progrès', href: '/progres' },
  { label: 'Profil', href: '/profil' },
];

/**
 * En-tête d'un onglet qui regroupe plusieurs écrans : la rubrique ouverte en grand titre, les autres à côté,
 * comme « Programme  Calendrier » dans le prototype (.phd).
 */
export function EnTete({ rubriques, actif }: { rubriques: readonly Rubrique[]; actif: string }) {
  // Trois rubriques : un peu plus petit pour tenir sur une ligne.
  const serre = rubriques.length > 2;
  return (
    <View style={[styles.phd, serre && styles.phdSerre]} accessibilityRole="tablist">
      {rubriques.map((r) =>
        r.label === actif ? (
          <Text key={r.label} style={[styles.h1, serre && styles.h1Serre]} accessibilityRole="header">
            {r.label}
          </Text>
        ) : (
          <Pressable key={r.label} accessibilityRole="tab" accessibilityState={{ selected: false }} onPress={() => router.navigate(r.href)} hitSlop={6}>
            <Text weight="bold" style={[styles.btn, serre && styles.btnSerre]}>
              {r.label}
            </Text>
          </Pressable>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  phd: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 16, paddingTop: 14, paddingHorizontal: 20 },
  h1: { ...fonts.black, fontSize: 32, lineHeight: 39, letterSpacing: -0.64 },
  btn: { fontSize: 21, lineHeight: 26, color: colors.textTertiary },
  phdSerre: { columnGap: 14 },
  h1Serre: { fontSize: 28, lineHeight: 34, letterSpacing: -0.56 },
  btnSerre: { fontSize: 18, lineHeight: 23 },
});
