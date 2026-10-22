import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui';
import { MASCOTTE_IMAGES } from '@/data/images';
import type { ExpressionMascotte } from '@/lib/enrage';
import { colors } from '@/theme';

/** Liste vide : la mascotte NÉA et un petit mot. */
export function MascotteVide({ texte, expression = 'fatigue', style }: { texte: string; expression?: ExpressionMascotte; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.vide, style]}>
      <Image source={MASCOTTE_IMAGES[expression]} style={styles.img} contentFit="contain" accessibilityIgnoresInvertColors />
      <Text style={styles.txt}>{texte}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  vide: { alignItems: 'center', gap: 8, paddingVertical: 18, paddingHorizontal: 24 },
  img: { width: 84, height: 100 },
  txt: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, textAlign: 'center' },
});
