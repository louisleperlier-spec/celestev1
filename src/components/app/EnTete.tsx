import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Segmente, Text } from '@/components/ui';
import { colors, fonts, ui } from '@/theme';

export type Rubrique = { label: string; href: Href };

/** Rubriques de l'onglet « Entraînement ». */
export const ENTRAINEMENT: Rubrique[] = [
  { label: 'Programme', href: '/programme' },
  { label: 'Calendrier', href: { pathname: '/programme', params: { vue: 'calendrier' } } },
  { label: 'Vélo', href: '/velo' },
];

/** En-tête d'onglet : grand titre, bouton « + » (séances prêtes), puis le contrôle segmenté des rubriques. */
export function EnTete({ titre, rubriques, actif }: { titre: string; rubriques: readonly Rubrique[]; actif: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.ligne}>
        <Text style={styles.h1} accessibilityRole="header">
          {titre}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Ajouter une séance" onPress={() => router.push('/seances')} style={styles.plus}>
          <Icon name="plus" size={20} color={colors.text} />
        </Pressable>
      </View>
      <Segmente
        options={rubriques.map((r) => r.label)}
        value={actif}
        onChange={(l) => {
          const r = rubriques.find((x) => x.label === l);
          if (r && l !== actif) router.navigate(r.href);
        }}
      />
    </View>
  );
}

/** Grand titre d'un onglet sans rubriques (Progrès, Coach). */
export function TitreOnglet({ titre, droite }: { titre: string; droite?: React.ReactNode }) {
  return (
    <View style={[styles.ligne, styles.titreSeul]}>
      <Text style={styles.h1} accessibilityRole="header">
        {titre}
      </Text>
      {droite}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 6, gap: 14 },
  ligne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titreSeul: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 4 },
  h1: { ...fonts.semibold, fontSize: 30, lineHeight: 36, letterSpacing: -0.3 },
  plus: { width: 38, height: 38, borderRadius: 19, backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center' },
});
