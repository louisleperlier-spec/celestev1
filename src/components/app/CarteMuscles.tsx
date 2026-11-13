import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { Appui, Icon, Text } from '@/components/ui';
import { EXERCICES } from '@/data';
import { CORPS_IMAGES } from '@/data/corpsImages';
import { niveauPourcent, type Entree, type Muscle } from '@/lib/corps';
import { colors, mix } from '@/theme';

/** Groupe NÉA d'un exercice (pour la dose par muscle des séances détaillées). */
export const groupeExercice = (id: string) => EXERCICES.find((e) => e.id === id)?.groupe;

/** Couleur d'un muscle : gris s'il n'a pas travaillé, sinon vert / jaune / rouge selon sa récupération, plus dense s'il est chargé. */
export function couleurMuscle(e: Entree | undefined): string {
  if (!e || e.charge < 0.05) return colors.border2;
  const n = niveauPourcent(e.pourcent);
  const c = n === 'bon' ? colors.good : n === 'moyen' ? colors.warn : colors.error;
  return mix(c, Math.round(45 + 55 * Math.min(1, e.charge / 0.85)), colors.border2);
}

export const couleurPourcent = (p: number) => {
  const n = niveauPourcent(p);
  return n === 'bon' ? colors.good : n === 'moyen' ? colors.warn : colors.error;
};

/**
 * Silhouette musculaire de face ou de dos (planche de l'utilisateur, `data/corpsImages.ts`) : silhouette grise, chaque muscle teinté
 * selon sa récupération, contours par-dessus. `choisi` : muscle mis en avant (éclairci).
 */
export function CarteMuscles({ vue, entrees, largeur, choisi }: { vue: 'face' | 'dos'; entrees: readonly Entree[]; largeur: number; choisi?: Muscle | null }) {
  const par = new Map(entrees.map((e) => [e.muscle, e]));
  const v = CORPS_IMAGES[vue];
  const taille = { width: largeur, height: Math.round(largeur * v.ratio) };
  const calque = [StyleSheet.absoluteFill, taille];
  return (
    <View style={taille} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Image source={v.silhouette} style={calque} tintColor={colors.border} contentFit="contain" />
      {(Object.keys(v.muscles) as Muscle[]).map((m) => (
        <Image key={m} source={v.muscles[m]} style={calque} tintColor={couleurMuscle(par.get(m))} contentFit="contain" />
      ))}
      {choisi && v.muscles[choisi] ? <Image source={v.muscles[choisi]} style={[calque, styles.choisi]} tintColor={colors.text} contentFit="contain" /> : null}
      <Image source={v.lignes} style={[calque, styles.lignes]} tintColor={colors.bg} contentFit="contain" />
    </View>
  );
}

/** Entrée « Ton corps » (Progrès, Programme) : petite silhouette colorée, récupération moyenne, muscles prêts. */
export function EntreeCorps({ entrees, onPress }: { entrees: readonly Entree[]; onPress: () => void }) {
  const moyenne = Math.floor(entrees.reduce((a, e) => a + e.pourcent, 0) / Math.max(1, entrees.length));
  const prets = entrees.filter((e) => e.etat === 'pret').length;
  return (
    <Appui accessibilityRole="button" accessibilityLabel={`Ton corps : ${moyenne} % de récupération musculaire`} onPress={onPress}>
      <View style={styles.entree}>
        <View style={styles.mini}>
          <CarteMuscles vue="face" entrees={entrees} largeur={30} />
          <CarteMuscles vue="dos" entrees={entrees} largeur={30} />
        </View>
        <View style={styles.flex}>
          <Text variant="label">Ton corps</Text>
          <Text weight="semibold" style={styles.titre}>
            {moyenne} % de récupération musculaire
          </Text>
          <Text style={styles.sous}>
            {prets} muscles sur {entrees.length} prêts pour une séance intense
          </Text>
        </View>
        <Icon name="right" size={16} color={colors.textSecondary} />
      </View>
    </Appui>
  );
}

const styles = StyleSheet.create({
  choisi: { opacity: 0.35 },
  lignes: { opacity: 0.55 },
  entree: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, backgroundColor: colors.surface },
  mini: { flexDirection: 'row', gap: 4 },
  flex: { flex: 1, minWidth: 0, gap: 2 },
  titre: { fontSize: 16, lineHeight: 21 },
  sous: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
});
