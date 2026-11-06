import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { COACH_IMAGES } from '@/data';
import type { CoachId } from '@/data/types';
import { colors, ui } from '@/theme';

/** Avatar rond du coach : tête cadrée à 50 % 75 %, agrandie ×1,35 (face() + .me du prototype). */
export function CoachFace({
  id,
  size = 46,
  borderColor = colors.border2,
  borderWidth = 1.5,
  style,
}: {
  id: CoachId;
  size?: number;
  borderColor?: string;
  borderWidth?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: size / 2, borderColor, borderWidth }, style]}>
      <Image
        source={COACH_IMAGES[id].tete}
        style={[StyleSheet.absoluteFill, styles.img]}
        contentFit="cover"
        contentPosition={{ top: '75%', left: '50%' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', backgroundColor: ui.avatarBg },
  img: { transform: [{ scale: 1.35 }, { translateY: 4 }] },
});
