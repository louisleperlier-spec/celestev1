import { StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { Appui, Icon, Text } from '@/components/ui';
import { EXERCICES } from '@/data';
import { CARTE_MUSCLES } from '@/data/carteMuscles';
import { niveauPourcent, type Entree, type Muscle } from '@/lib/corps';
import { alpha, colors } from '@/theme';

/** Groupe NÉA d'un exercice (pour la dose par muscle des séances détaillées). */
export const groupeExercice = (id: string) => EXERCICES.find((e) => e.id === id)?.groupe;

/** Couleur d'un muscle : gris s'il n'a pas travaillé, sinon vert / jaune / rouge selon sa récupération, plus dense s'il est chargé. */
export function couleurMuscle(e: Entree | undefined): string {
  if (!e || e.charge < 0.05) return colors.surface2;
  const n = niveauPourcent(e.pourcent);
  const c = n === 'bon' ? colors.good : n === 'moyen' ? colors.warn : colors.error;
  return alpha(c, 0.45 + 0.55 * Math.min(1, e.charge / 0.85));
}

export const couleurPourcent = (p: number) => {
  const n = niveauPourcent(p);
  return n === 'bon' ? colors.good : n === 'moyen' ? colors.warn : colors.error;
};

/**
 * Silhouette musculaire de face ou de dos (polygones du paquet Process « Corps », react-body-highlighter, MIT), repère 100 × 200 ;
 * chaque muscle prend la couleur de sa récupération. `choisi` : muscle mis en avant (liseré blanc).
 */
export function CarteMuscles({ vue, entrees, largeur, choisi }: { vue: 'face' | 'dos'; entrees: readonly Entree[]; largeur: number; choisi?: Muscle | null }) {
  const par = new Map(entrees.map((e) => [e.muscle, e]));
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={largeur} height={largeur * 2} viewBox="0 0 100 200">
        {CARTE_MUSCLES.filter((p) => p.vue === vue).map((p, i) => (
          <Polygon
            key={i}
            points={p.points}
            fill={p.muscle ? couleurMuscle(par.get(p.muscle)) : colors.border}
            stroke={p.muscle && p.muscle === choisi ? colors.text : colors.bg}
            strokeWidth={p.muscle && p.muscle === choisi ? 0.9 : 0.5}
            strokeLinejoin="round"
          />
        ))}
      </Svg>
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
  entree: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, backgroundColor: colors.surface },
  mini: { flexDirection: 'row', gap: 4 },
  flex: { flex: 1, minWidth: 0, gap: 2 },
  titre: { fontSize: 16, lineHeight: 21 },
  sous: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
});
