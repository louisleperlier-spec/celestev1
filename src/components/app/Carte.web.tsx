import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import type { Pt } from '@/lib/velo';
import { tracePlan } from '@/lib/velo';
import { colors, ui } from '@/theme';

import { CARTE_H, CARTE_W, CarteVide, Quadrillage, TagSource } from './CarteVide';

/** Carte du vélo dans le navigateur : tracé rose sur quadrillage, comme le prototype (mapSvg). */
export function Carte({ pts, gps }: { pts: readonly Pt[]; gps: boolean }) {
  const pp = tracePlan(pts, CARTE_W, CARTE_H);
  return (
    <View style={styles.map}>
      {pp.length < 2 ? (
        <CarteVide />
      ) : (
        <>
          <Svg width="100%" height="100%" viewBox={`0 0 ${CARTE_W} ${CARTE_H}`} preserveAspectRatio="xMidYMid slice">
            <Quadrillage />
            <Trace pp={pp} />
          </Svg>
          <TagSource gps={gps} />
        </>
      )}
    </View>
  );
}

function Trace({ pp }: { pp: [number, number][] }) {
  const d = 'M' + pp.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
  const l = pp[pp.length - 1];
  return (
    <>
      <Path d={d} fill="none" stroke={colors.pink} strokeWidth={7} strokeOpacity={0.25} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={d} fill="none" stroke={colors.pinkLight} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={pp[0][0]} cy={pp[0][1]} r={5} fill={colors.green} />
      <Circle cx={l[0]} cy={l[1]} r={9} fill={colors.pink} opacity={0.3} />
      <Circle cx={l[0]} cy={l[1]} r={5} fill={colors.text} stroke={colors.pink} strokeWidth={2} />
    </>
  );
}

const styles = StyleSheet.create({
  map: { marginTop: 12, marginHorizontal: 20, height: 230, overflow: 'hidden', borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: ui.carte },
});
