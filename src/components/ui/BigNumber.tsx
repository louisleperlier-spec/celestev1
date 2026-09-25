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
 * Pas de lineHeight fixe et pas de Text imbriqué : sur iOS, un texte imbriqué prend la hauteur
 * de ligne de son parent et le haut des chiffres est rogné. Le chiffre et l'unité sont deux
 * textes frères alignés sur la ligne de base.
 */
export function BigNumber({ value, unit, size = 56, unitSize = 18, color = colors.text, style, gap = 4 }: Props) {
  return (
    <View style={[styles.row, { gap }, style]}>
      <Text style={[styles.value, { fontSize: size, color }]}>{value}</Text>
      {unit ? <Text style={[styles.unit, { fontSize: unitSize }]}>{unit}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' },
  // lineHeight: undefined → hauteur naturelle de la police, jamais rognée.
  value: { fontFamily: fonts.black, lineHeight: undefined, fontVariant: ['tabular-nums'], includeFontPadding: false },
  unit: { lineHeight: undefined, color: colors.textSecondary },
});
