import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { zonePct as p } from '@/lib/charges';
import type { PlanItem } from '@/lib/plan';
import { colors, glow } from '@/theme';

/** Barre de zone de répétitions : Force / Hypertrophie / Endurance, ou durée cible (zoneBar du prototype). */
/** `cur` : reps en cours, affichées par un repère blanc (séance en cours). */
export function ZoneBar({ it, cur }: { it: PlanItem; cur?: number }) {
  if (it.sec) {
    const mx = it.sec > 120 ? 1200 : 90;
    const a = it.sec;
    return (
      <>
        <View style={styles.wrap}>
          <View style={styles.zbar}>
            <View style={[styles.z3, { flex: 1 }]} />
          </View>
          <Cible left={0} width={Math.min(100, (a / mx) * 100)} />
        </View>
        <View style={styles.zlab}>
          <Text style={[styles.lab, styles.alignLeft]}>0 s</Text>
          <Text style={styles.lab}>Cible {it.sec >= 120 ? Math.round(it.sec / 60) + ' min' : it.sec + ' s'}</Text>
          <Text style={[styles.lab, styles.right]}>{mx >= 600 ? Math.round(mx / 60) + ' min' : mx + ' s'}</Text>
        </View>
      </>
    );
  }
  const [a, b] = it.reps!;
  return (
    <>
      <View style={styles.wrap}>
        <View style={styles.zbar}>
          <View style={[styles.z1, { width: `${p(6)}%` }]} />
          <View style={[styles.z2, { width: `${p(12) - p(6)}%` }]} />
          <View style={[styles.z3, { flex: 1 }]} />
        </View>
        <Cible left={p(a)} width={Math.max(3, p(b) - p(a))} />
        {cur != null && <View style={[styles.mark, { left: `${p(cur)}%` }, glow('#FFFFFF', 6)]} />}
      </View>
      <View style={styles.zlab}>
        <Text style={[styles.lab, styles.left, { width: `${p(6)}%` }]}>Force</Text>
        <Text style={[styles.lab, { width: `${p(12) - p(6)}%` }]}>Hypertrophie</Text>
        <Text style={[styles.lab, styles.right, styles.flex]}>Endurance</Text>
      </View>
    </>
  );
}

function Cible({ left, width }: { left: number; width: number }) {
  return (
    <LinearGradient
      colors={['#FF8CC6', colors.pink]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.target, { left: `${left}%`, width: `${width}%` }, glow('rgba(255,79,163,0.7)', 12)]}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  zbar: { height: 12, borderRadius: 8, flexDirection: 'row', overflow: 'hidden', marginTop: 12, backgroundColor: '#1E1E23' },
  z1: { height: '100%', backgroundColor: '#3B2A40' },
  z2: { height: '100%', backgroundColor: '#4A2C44' },
  z3: { height: '100%', backgroundColor: '#3A3048' },
  target: { position: 'absolute', top: 9, height: 18, borderRadius: 8 },
  mark: { position: 'absolute', top: 6, width: 3, height: 24, marginLeft: -1, borderRadius: 2, backgroundColor: colors.text },
  zlab: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  lab: { flex: 1, fontSize: 10.5, lineHeight: 14, color: colors.textSecondary, textAlign: 'center' },
  left: { flex: 0, textAlign: 'left' },
  right: { textAlign: 'right' },
  alignLeft: { textAlign: 'left' },
  flex: { flex: 1 },
});
