import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { Text } from '@/components/ui';
import { mmss, NOMS_ZONES } from '@/lib/coeur';
import { hrMax } from '@/lib/plan';
import { colors, heartZones } from '@/theme';

const ZC = [heartZones.z1, heartZones.z2, heartZones.z3, heartZones.z4, heartZones.z5];

/** Courbe de FC avec lignes des zones (hrChart du prototype, 320 × 110). */
export function CourbeFC({ samples, age }: { samples: readonly number[]; age: number }) {
  const { width } = useWindowDimensions();
  if (samples.length < 2) return null;
  const W = 320;
  const H = 110;
  const mn = Math.min(...samples) - 5;
  const mx = Math.max(...samples) + 5;
  const st = Math.max(1, Math.floor(samples.length / 160));
  const y = (v: number) => H - ((v - mn) / (mx - mn)) * (H - 10) - 5;
  const pts = samples.filter((_, i) => i % st === 0).map((v, i, a) => [(i / (a.length - 1)) * W, y(v)]);
  const d = pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L');
  const zl = [0.6, 0.7, 0.8, 0.9].map((p) => p * hrMax(age)).filter((v) => v > mn && v < mx);
  const w = width - 40 - 24;
  return (
    <Svg width={w} height={(w * H) / W} viewBox={`0 0 ${W} ${H}`} style={styles.svg}>
      <Defs>
        <LinearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FF3B5C" stopOpacity={0.4} />
          <Stop offset="1" stopColor="#FF3B5C" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {zl.map((v) => (
        <Line key={v} x1="0" x2={W} y1={y(v)} y2={y(v)} stroke="#26262C" strokeDasharray="3 4" />
      ))}
      <Path d={`M${d} L${W} ${H} L0 ${H}Z`} fill="url(#hg)" />
      <Path d={`M${d}`} fill="none" stroke="#FF4F6D" strokeWidth={1.8} />
    </Svg>
  );
}

/** Temps passé dans chaque zone (zonesList du prototype). */
export function ListeZones({ z }: { z: readonly number[] }) {
  const t = z.reduce((a, b) => a + b, 0) || 1;
  return (
    <View style={styles.zlist}>
      {z.map((v, i) => (
        <View key={i} style={styles.row}>
          <Text style={[styles.txt, styles.nom]}>
            Z{i + 1} {NOMS_ZONES[i]}
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(v / t) * 100}%`, backgroundColor: ZC[i] }]} />
          </View>
          <Text style={[styles.txt, styles.temps]}>{mmss(v)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  svg: { marginTop: 6 },
  zlist: { gap: 6, marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  txt: { fontSize: 11.5, lineHeight: 15, color: '#D6D6DB' },
  nom: { width: 92 },
  temps: { width: 44, textAlign: 'right' },
  track: { flex: 1, height: 6, borderRadius: 4, backgroundColor: '#222222' },
  fill: { height: '100%', borderRadius: 4 },
});

export const couleurZone = (i: number) => ZC[i] ?? colors.pink;
