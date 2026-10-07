import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Segmente, Text } from '@/components/ui';
import { colors, fonts, ui } from '@/theme';

export type Rubrique = { label: string; href: Href };

/** Rubriques de l'onglet « Programme » (la Randonnée y vit depuis la direction « nuit », 4 onglets). */
export const ENTRAINEMENT: Rubrique[] = [
  { label: 'Plan', href: '/programme' },
  { label: 'Calendrier', href: { pathname: '/programme', params: { vue: 'calendrier' } } },
  { label: 'Sorties', href: '/velo' },
  { label: 'Rando', href: '/rando' },
  { label: 'Yoga', href: '/yoga' },
];

/** En-tête d'onglet : grand titre (et sous-titre), bouton « + » (ajouter une activité : musculation libre, autres sports, séances prêtes), puis le contrôle segmenté des rubriques. */
export function EnTete({ titre, sous, rubriques, actif }: { titre: string; sous?: string; rubriques: readonly Rubrique[]; actif: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.ligne}>
        <View style={styles.flex}>
          <Text style={styles.h1} accessibilityRole="header">
            {titre}
          </Text>
          {!!sous && <Text style={styles.sous}>{sous}</Text>}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Ajouter une activité" onPress={() => router.push('/ajouter')} style={styles.plus}>
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

/** Rubriques seules (écran avec son propre en-tête, comme la Randonnée). */
export function Rubriques({ rubriques, actif, sansMarge = false }: { rubriques: readonly Rubrique[]; actif: string; sansMarge?: boolean }) {
  return (
    <View style={[styles.rubriques, sansMarge && styles.sansMarge]}>
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
  flex: { flex: 1, minWidth: 0 },
  rubriques: { paddingTop: 10, paddingHorizontal: 20 },
  sansMarge: { paddingHorizontal: 0 },
  h1: { ...fonts.bold, fontSize: 30, lineHeight: 36, letterSpacing: -0.4 },
  sous: { fontSize: 15, lineHeight: 20, color: colors.textSecondary, marginTop: 2 },
  plus: { width: 38, height: 38, borderRadius: 19, backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center' },
});
