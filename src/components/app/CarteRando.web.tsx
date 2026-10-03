import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Icon, Text } from '@/components/ui';
import { tracePlan, type Pt } from '@/lib/velo';
import { colors } from '@/theme';

import { CARTE_H, CARTE_W, Quadrillage } from './CarteVide';

/** Secteur d'un sentier dans le navigateur (pas d'Apple Plans) : quadrillage et point de départ. */
export function CarteSentier({ hauteur = 220 }: { lat: number; lng: number; hauteur?: number }) {
  return (
    <View style={[styles.map, { height: hauteur }]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${CARTE_W} ${CARTE_H}`} preserveAspectRatio="xMidYMid slice">
        <Quadrillage />
        <Circle cx={CARTE_W / 2} cy={CARTE_H / 2} r={7} fill={colors.pink} stroke={colors.text} strokeWidth={2.5} />
      </Svg>
      <View style={styles.tag}>
        <Icon name="pin" size={14} color={colors.textSecondary} />
        <Text style={styles.tagTxt}>Carte disponible sur iPhone</Text>
      </View>
    </View>
  );
}

/** Rando en cours dans le navigateur : tracé orange sur quadrillage. */
export function CarteRando({ pts }: { pts: readonly Pt[] }) {
  const pp = tracePlan(pts, CARTE_W, CARTE_H);
  const d = pp.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  const fin = pp[pp.length - 1];
  return (
    <View style={[StyleSheet.absoluteFill, styles.fond]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${CARTE_W} ${CARTE_H}`} preserveAspectRatio="xMidYMid slice">
        <Quadrillage />
        {pp.length > 1 && <Path d={d} stroke={colors.pink} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        {fin && <Circle cx={fin[0]} cy={fin[1]} r={6} fill={colors.text} stroke={colors.pink} strokeWidth={3} />}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { borderRadius: 20, overflow: 'hidden', backgroundColor: colors.surface },
  fond: { backgroundColor: colors.surface },
  tag: { position: 'absolute', left: 12, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tagTxt: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
});
