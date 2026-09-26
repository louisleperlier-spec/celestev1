import { View } from 'react-native';
import Svg, { Polygon, Text as SvgText } from 'react-native-svg';

import { Glow } from '@/components/ui';
import { colors, fonts } from '@/theme';

/** Hexagone du niveau, de la couleur du rang, avec sa lueur (.lvl, .lvl.big). */
export function Lvl({ n, color, big = false }: { n: number; color: string; big?: boolean }) {
  const s = big ? 56 : 40;
  const h = s / 2;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      <Glow width={s + 12} height={s + 12} color={color} intensity={0.45} />
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <Polygon points={`${h},0 ${s},${s / 4} ${s},${(s * 3) / 4} ${h},${s} 0,${(s * 3) / 4} 0,${s / 4}`} fill={color} />
        <SvgText x={h} y={h + (big ? 8 : 6)} fontSize={big ? 22 : 16} fontFamily={fonts.black} fill={colors.onPrimary} textAnchor="middle">
          {n}
        </SvgText>
      </Svg>
    </View>
  );
}
