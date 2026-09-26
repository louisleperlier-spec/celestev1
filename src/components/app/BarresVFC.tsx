import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';

import { Text } from '@/components/ui';
import { colors, fonts, heartZones, ui } from '@/theme';

export type BarreVFC = { hrv: number; type: 'muscu' | 'velo' | 'nuit' };

const couleur = (t: BarreVFC['type']) => (t === 'velo' ? heartZones.z1 : t === 'nuit' ? ui.sommeil : colors.pink);

/** VFC en barres, 320 × 90 (vfcBars du prototype). Légende Muscu / Vélo sauf pour les nuits. */
export function BarresVFC({ hl }: { hl: readonly BarreVFC[] }) {
  const { width } = useWindowDimensions();
  if (!hl.length) return null;
  const W = 320;
  const H = 90;
  const mx = Math.max(...hl.map((l) => l.hrv)) * 1.15 || 1;
  const bw = W / hl.length;
  const w = width - 40 - 28;
  return (
    <>
      <Svg width={w} height={(w * (H + 14)) / W} viewBox={`0 0 ${W} ${H + 14}`} style={styles.svg}>
        {hl.map((l, i) => {
          const h = (l.hrv / mx) * H;
          return (
            <G key={i}>
              <Rect x={i * bw + bw * 0.2} y={H - h} width={bw * 0.6} height={h} rx={3} fill={couleur(l.type)} />
              <SvgText x={i * bw + bw / 2} y={H + 11} textAnchor="middle" fill={ui.axe} fontSize={8} fontFamily={fonts.regular}>
                {l.hrv}
              </SvgText>
            </G>
          );
        })}
      </Svg>
      {!hl.every((l) => l.type === 'nuit') && (
        <View style={styles.leg}>
          <View style={styles.legItem}>
            <View style={[styles.dot, { backgroundColor: colors.pink }]} />
            <Text style={styles.legTxt}>Muscu</Text>
          </View>
          <View style={styles.legItem}>
            <View style={[styles.dot, { backgroundColor: heartZones.z1 }]} />
            <Text style={styles.legTxt}>Vélo</Text>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  svg: { marginTop: 10 },
  leg: { flexDirection: 'row', gap: 14, marginTop: 8 },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legTxt: { fontSize: 10.5, lineHeight: 14, color: colors.textSecondary },
});
