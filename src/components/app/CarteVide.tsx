import { StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { Icon, Text } from '@/components/ui';
import { colors, ui } from '@/theme';

export const CARTE_W = 340;
export const CARTE_H = 230;

/** Quadrillage de fond de la carte (grid du prototype, pas de 34). */
export function Quadrillage() {
  const l = [];
  for (let x = 0; x <= CARTE_W; x += 34) l.push(<Line key={'x' + x} x1={x} x2={x} y1={0} y2={CARTE_H} stroke={ui.grille} />);
  for (let y = 0; y <= CARTE_H; y += 34) l.push(<Line key={'y' + y} x1={0} x2={CARTE_W} y1={y} y2={y} stroke={ui.grille} />);
  return <>{l}</>;
}

/** Carte avant le départ : quadrillage et « Démarre pour tracer ton parcours ». */
export function CarteVide() {
  return (
    <>
      <Svg width="100%" height="100%" viewBox={`0 0 ${CARTE_W} ${CARTE_H}`} preserveAspectRatio="xMidYMid slice">
        <Quadrillage />
      </Svg>
      <View style={styles.empty}>
        <Icon name="pin" color={colors.textSecondary} />
        <Text style={styles.emptyTxt}>Démarre pour tracer ton parcours</Text>
      </View>
    </>
  );
}

/** Pastille GPS / Simulation (.tagsrc). */
export function TagSource({ gps }: { gps: boolean }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagTxt}>{gps ? 'GPS' : 'Simulation'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 4 },
  emptyTxt: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, textAlign: 'center' },
  tag: {
    position: 'absolute',
    left: 10,
    top: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: colors.border2,
  },
  tagTxt: { fontSize: 10.5, lineHeight: 14, color: ui.text3 },
});
