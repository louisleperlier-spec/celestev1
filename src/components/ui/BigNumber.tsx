import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts } from '@/theme';

import { Text } from './Text';

type Props = {
  value: string | number;
  /** Unité affichée à côté, plus petite et grisée (« kg », « ans », « bpm »…). */
  unit?: string;
  size?: number;
  unitSize?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  /** Espace entre le chiffre et l'unité. */
  gap?: number;
};

/**
 * Grand chiffre (poids, âge, FC, compte à rebours, prix…).
 * Hauteur de ligne = hauteur naturelle d'Inter (1,21 × la taille), jamais moins, et pas de Text imbriqué :
 * sur iOS, un texte imbriqué prend la hauteur de ligne de son parent et le haut des chiffres est rogné.
 * Le chiffre et l'unité sont deux textes frères alignés sur la ligne de base.
 */
const haut = (size: number) => Math.ceil(size * 1.21);

export function BigNumber({ value, unit, size = 56, unitSize = 18, color = colors.text, style, gap = 4 }: Props) {
  return (
    <View style={[styles.row, { gap }, style]}>
      <Text style={[styles.value, { fontSize: size, lineHeight: haut(size), color }]}>{value}</Text>
      {unit ? <Text style={[styles.unit, { fontSize: unitSize, lineHeight: haut(unitSize) }]}>{unit}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' },
  value: { fontFamily: fonts.black, fontVariant: ['tabular-nums'], includeFontPadding: false },
  unit: { color: colors.textSecondary },
});
