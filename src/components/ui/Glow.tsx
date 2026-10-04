import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { colors } from '@/theme';

type Props = {
  width: number;
  height: number;
  color?: string;
  /** Opacité au centre (0 à 1). */
  intensity?: number;
};

/**
 * Lueur douce : dégradé radial qui s'éteint jusqu'à une opacité nulle,
 * donc sans bord visible. Se place en absolu, centrée derrière son parent,
 * et ne capte pas les touchers.
 */
export function Glow({ width, height, color = colors.pink, intensity = 0.45 }: Props) {
  // useId() contient des « : », invalides dans url(#…) côté SVG.
  const id = 'glow' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={color} stopOpacity={intensity} />
            <Stop offset="0.45" stopColor={color} stopOpacity={intensity * 0.45} />
            <Stop offset="0.75" stopColor={color} stopOpacity={intensity * 0.12} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={width / 2} cy={height / 2} rx={width / 2} ry={height / 2} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
