import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { BigNumber, Card, Text } from '@/components/ui';
import type { Nuit } from '@/lib/sommeil';
import { colors } from '@/theme';

/** Petite courbe des dernières valeurs (sans axes). */
function Courbe({ v, couleur, w = 120, h = 36 }: { v: readonly number[]; couleur: string; w?: number; h?: number }) {
  if (v.length < 2) return <View style={{ width: w, height: h }} />;
  const mn = Math.min(...v);
  const mx = Math.max(...v);
  const pas = w / (v.length - 1);
  const y = (x: number) => (mx === mn ? h / 2 : 4 + (1 - (x - mn) / (mx - mn)) * (h - 8));
  const d = v.map((x, i) => `${i ? 'L' : 'M'}${(i * pas).toFixed(1)} ${y(x).toFixed(1)}`).join(' ');
  return (
    <Svg width={w} height={h}>
      <Path d={d} stroke={couleur} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={(v.length - 1) * pas} cy={y(v[v.length - 1])} r={3} fill={couleur} />
    </Svg>
  );
}

type Serie = { nom: string; unite: string; v: number[]; couleur: string; aide: string };

/** « Tes repères » : VFC nocturne et FC au repos des 7 dernières nuits, avec leur courbe. Ouvre Sommeil. */
export function Reperes({ nights }: { nights: readonly Nuit[] }) {
  const dern = nights.slice(-7);
  const series: Serie[] = [
    { nom: 'VFC nocturne', unite: 'ms', v: dern.map((n) => n.hrv).filter((x): x is number => !!x), couleur: colors.pink, aide: 'Plus haute, mieux tu récupères' },
    { nom: 'FC au repos', unite: 'bpm', v: dern.map((n) => n.rhr).filter((x): x is number => !!x), couleur: colors.mauve, aide: 'Plus basse, plus tu es reposé' },
  ];
  return (
    <View style={styles.liste}>
      {series.map((s) => {
        const der = s.v[s.v.length - 1];
        const moy = s.v.length ? Math.round(s.v.reduce((a, b) => a + b, 0) / s.v.length) : 0;
        return (
          <Pressable key={s.nom} accessibilityRole="button" accessibilityLabel={`${s.nom} : ${der ?? 'aucune mesure'}`} onPress={() => router.push('/sommeil')}>
            <Card style={styles.carte}>
              <View style={styles.flex}>
                <Text style={styles.nom}>{s.nom}</Text>
                {der ? (
                  <BigNumber value={der} unit={s.unite} size={26} unitSize={14} style={styles.val} />
                ) : (
                  <Text weight="semibold" style={styles.vide}>
                    Pas encore de mesure
                  </Text>
                )}
                <Text style={styles.aide} numberOfLines={1}>
                  {s.v.length > 1 ? `Moyenne sur ${s.v.length} nuits : ${moy} ${s.unite}` : s.aide}
                </Text>
              </View>
              <Courbe v={s.v} couleur={s.couleur} />
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  liste: { gap: 10 },
  carte: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  nom: { fontSize: 14, lineHeight: 18, color: colors.textSecondary },
  val: { justifyContent: 'flex-start', marginTop: 2 },
  vide: { fontSize: 16, lineHeight: 21, marginTop: 4 },
  aide: { fontSize: 12, lineHeight: 16, color: colors.textTertiary, marginTop: 2 },
});
