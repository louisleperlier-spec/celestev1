import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, G, Line, LinearGradient as SvgGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { bientot } from '@/components/app/bientot';
import { BarresVFC } from '@/components/app/BarresVFC';
import { Kpi } from '@/components/app/Recap';
import { PeseeSheet as Pesee } from '@/components/app/PeseeSheet';
import { Card, Text } from '@/components/ui';
import { COACH_IMAGES } from '@/data';
import { dec, fmt } from '@/lib/charges';
import { coachById, hrMax } from '@/lib/plan';
import { baseHrv, lastNight, sleepScore } from '@/lib/sommeil';
import type { Log } from '@/lib/xp';
import { useProfil } from '@/store/profil';
import { colors, fonts } from '@/theme';

type Periode = 'Semaine' | 'Mois' | 'Année';
const JOURS_PERIODE: Record<Periode, number> = { Semaine: 7, Mois: 30, Année: 365 };

/** Activités des `days` derniers jours, décalées de `offset` jours (logsIn du prototype). */
function logsIn(logs: readonly Log[], now: number, days: number, offset = 0) {
  const a = now - (days + offset) * 864e5;
  const b = now - offset * 864e5;
  return logs.filter((l) => {
    const t = +new Date(l.d);
    return t > a && t <= b;
  });
}
const avgOf = (logs: readonly Log[], k: 'hrAvg' | 'hrv') => {
  const v = logs.map((l) => l[k] ?? 0).filter((x) => x > 0);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
};
const sum = (a: readonly Log[], k: 'min' | 'vol' | 'cal') => a.reduce((s, l) => s + (l[k] || 0), 0);
/** Évolution par rapport à la période précédente (« +12% », « nouveau »). */
const pc = (a: number, b: number) => {
  if (!b) return 'nouveau';
  const v = ((a - b) / b) * 100;
  return (v >= 0 ? '+' : '') + Math.round(v) + '%';
};

/** Onglet Progrès (vStats du prototype). */
export default function Progres() {
  const profil = useProfil();
  const c = coachById(profil.coach);
  const [p, setP] = useState<Periode>('Semaine');
  const [pesee, setPesee] = useState(false);
  // Instant de référence des périodes, remis à jour à chaque affichage de l'onglet.
  const [now, setNow] = useState(Date.now);
  useFocusEffect(useCallback(() => setNow(Date.now()), []));
  const days = JOURS_PERIODE[p];
  const base = baseHrv(profil.nights, profil.hrvChecks);
  const n7 = profil.nights.slice(-7);
  const cur = logsIn(profil.logs, now, days);
  const prev = logsIn(profil.logs, now, days, days);
  const t = sum(cur, 'min');
  const hl = profil.logs.filter((l) => (l.hrAvg ?? 0) > 0).slice(0, 12).reverse();
  const lim = now - days * 864e5;
  const wl = profil.wlog.filter((x) => +new Date(x.d + 'T12:00') >= lim);
  const ws = wl.map((x) => x.kg);
  const labels =
    wl.length < 2
      ? []
      : [0, 1, 2, 3].map((k) => {
          const x = wl[Math.round((k * (wl.length - 1)) / 3)];
          const d = new Date(x.d + 'T12:00');
          return p === 'Année' ? d.toLocaleDateString('fr-CA', { month: 'short' }) : d.getDate() + '/' + String(d.getMonth() + 1).padStart(2, '0');
        });

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text weight="bold" style={styles.ptitle}>
          Ta progression
        </Text>
        {/* .seg */}
        <View style={styles.seg}>
          {(['Semaine', 'Mois', 'Année'] as Periode[]).map((x) => (
            <Pressable key={x} accessibilityRole="tab" accessibilityState={{ selected: x === p }} onPress={() => setP(x)} style={styles.flex}>
              {x === p ? (
                <LinearGradient colors={['#FFC6E0', '#FF8CC6']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.segBtn, styles.segOn]}>
                  <Text weight="semibold" style={[styles.segTxt, { color: colors.onPrimary }]}>
                    {x}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.segBtn}>
                  <Text weight="semibold" style={styles.segTxt}>
                    {x}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
        <View style={styles.grid}>
          <Kpi icon="calcheck" label="Séances" value={String(cur.length)} em={pc(cur.length, prev.length)} emGris />
          <Kpi icon="trend" label="Volume" value={`${fmt(sum(cur, 'vol'))} kg`} em={pc(sum(cur, 'vol'), sum(prev, 'vol'))} />
          <Kpi icon="clock" label="Temps" value={`${Math.floor(t / 60)} h ${String(t % 60).padStart(2, '0')}`} em={pc(t, sum(prev, 'min'))} />
          <Kpi icon="flame" label="Calories" value={fmt(sum(cur, 'cal'))} em={pc(sum(cur, 'cal'), sum(prev, 'cal'))} />
        </View>

        {/* Cœur : moyenne générale */}
        <Card style={styles.chart}>
          <View style={styles.h4}>
            <Text weight="semibold" style={styles.h4Txt}>
              Cœur : moyenne générale
            </Text>
            {/* Capteur Bluetooth / Apple Santé : étape 6 */}
            <Pressable accessibilityRole="button" onPress={() => bientot('sante')}>
              <Text style={styles.h4Btn}>Connecter un capteur</Text>
            </Pressable>
          </View>
          <Trio
            items={[
              ['FC moyenne', `${avgOf(profil.logs, 'hrAvg')} bpm`],
              ['VFC moyenne', `${avgOf(profil.logs, 'hrv')} ms`],
              ['FC max théorique', String(hrMax(profil.age))],
            ]}
          />
          <BarresVFC hl={hl.map((l) => ({ hrv: l.hrv ?? 0, type: l.type }))} />
          <Text style={styles.note}>VFC (RMSSD) des {hl.length} dernières séances. Plus elle est haute au repos, mieux tu récupères.</Text>
        </Card>

        {/* Sommeil et récupération */}
        <Pressable accessibilityRole="button" onPress={() => router.push('/sommeil')}>
          <Card style={styles.chart}>
            <View style={styles.h4}>
              <Text weight="semibold" style={styles.h4Txt}>
                Sommeil et récupération
              </Text>
              <Text style={styles.voir}>Voir</Text>
            </View>
            <Trio
              items={[
                ['Score nuit', String(sleepScore(lastNight(profil.nights, new Date(now)), base) ?? '--')],
                ['Sommeil moy.', `${dec((n7.reduce((a, n) => a + n.h, 0) / Math.max(1, n7.length)).toFixed(1))} h`],
                ['VFC nuit', `${base} ms`],
              ]}
            />
          </Card>
        </Pressable>

        <Card style={styles.chart}>
          <View style={styles.h4}>
            <Text weight="semibold" style={styles.h4Txt}>
              Ton poids (kg)
            </Text>
            <Pressable accessibilityRole="button" onPress={() => setPesee(true)}>
              <Text style={styles.h4Btn}>+ Ajouter</Text>
            </Pressable>
          </View>
          <CourbePoids ws={ws} labels={labels} />
        </Card>

        {/* .qcard */}
        <LinearGradient colors={[colors.surface, colors.surface, '#2A1220']} locations={[0, 0.4, 1]} start={{ x: 0, y: 0.4 }} end={{ x: 1, y: 0.6 }} style={styles.qcard}>
          <Text style={styles.qText}>« {c.prog} »</Text>
          <Text style={styles.qEm}>— {c.nom}</Text>
          <Image source={COACH_IMAGES[c.id].tete} style={styles.qImg} contentFit="contain" />
        </LinearGradient>
      </ScrollView>
      <Pesee visible={pesee} onClose={() => setPesee(false)} />
    </SafeAreaView>
  );
}

function Trio({ items }: { items: [string, string][] }) {
  return (
    <View style={styles.cplan}>
      {items.map(([k, v]) => (
        <View key={k} style={styles.cplanCell}>
          <Text style={styles.cplanSmall}>{k}</Text>
          <Text weight="bold" style={styles.cplanB}>
            {v}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Courbe de poids datée (weightChart du prototype, 320 × 150). */
function CourbePoids({ ws, labels }: { ws: readonly number[]; labels: string[] }) {
  const { width } = useWindowDimensions();
  if (ws.length < 2)
    return (
      <Text style={[styles.note, styles.noteVide]}>
        {ws.length ? 'Ton poids de départ : ' + dec(ws[0]) + ' kg. ' : ''}Ajoute ton poids au moins une fois par semaine pour voir ta courbe.
      </Text>
    );
  const W = 320;
  const H = 150;
  const pl = 26;
  const pr = 10;
  const pt = 12;
  const pb = 22;
  const mn = Math.floor(Math.min(...ws) - 1);
  const mxv = Math.ceil(Math.max(...ws) + 0.5);
  const x = (i: number) => pl + (i * (W - pl - pr)) / (ws.length - 1);
  const y = (v: number) => pt + ((mxv - v) / (mxv - mn)) * (H - pt - pb);
  const pts = ws.map((v, i) => [x(i), y(v)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ` L${x(ws.length - 1)} ${H - pb} L${pl} ${H - pb} Z`;
  const last = pts[pts.length - 1];
  const diff = (ws[ws.length - 1] - ws[0]).toFixed(1).replace('.', ',');
  const ticks: number[] = [];
  for (let v = mn; v <= mxv; v += Math.max(1, Math.round((mxv - mn) / 4))) ticks.push(v);
  const w = width - 40 - 28;
  return (
    <Svg width={w} height={(w * H) / W} viewBox={`0 0 ${W} ${H}`} style={styles.svg} accessibilityLabel="Courbe de poids">
      <Defs>
        <SvgGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.pink} stopOpacity={0.45} />
          <Stop offset="1" stopColor={colors.pink} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      {ticks.map((v) => (
        <G key={v}>
          <Line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke="#222228" />
          <SvgText x={2} y={y(v) + 3} fill="#77777F" fontSize={9} fontFamily={fonts.regular}>
            {v}
          </SvgText>
        </G>
      ))}
      <Path d={area} fill="url(#ag)" />
      <Path d={line} fill="none" stroke="#FF6FB5" strokeWidth={2} strokeLinejoin="round" />
      <Circle cx={last[0]} cy={last[1]} r={4.5} fill="#FF8CC6" stroke="#FFFFFF" strokeWidth={1.5} />
      <G transform={`translate(${W - pr - 66},${Math.max(4, last[1] - 54)})`}>
        <Rect width={64} height={38} rx={8} fill="#1A1A1F" stroke="#34343A" />
        <SvgText x={32} y={16} textAnchor="middle" fill="#FFFFFF" fontSize={11} fontFamily={fonts.bold}>
          {dec(ws[ws.length - 1])} kg
        </SvgText>
        <SvgText x={32} y={29} textAnchor="middle" fill={colors.green} fontSize={9} fontFamily={fonts.regular}>
          {diff} kg
        </SvgText>
      </G>
      {labels.map((l, i) => (
        <SvgText
          key={i}
          x={pl + (i * (W - pl - pr)) / (labels.length - 1)}
          y={H - 6}
          textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}
          fill="#77777F"
          fontSize={9}
          fontFamily={fonts.regular}
        >
          {l}
        </SvgText>
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  ptitle: { fontSize: 24, lineHeight: 30, paddingTop: 14, paddingHorizontal: 20 },
  seg: { flexDirection: 'row', gap: 8, paddingTop: 14, paddingHorizontal: 20 },
  segBtn: { height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#17171B', borderWidth: 1, borderColor: colors.border },
  segOn: { borderWidth: 0, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 14, spreadDistance: 0, color: 'rgba(255,79,163,0.4)' }] },
  segTxt: { fontSize: 13, lineHeight: 17, color: '#C6C6CC' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 14, paddingHorizontal: 20 },
  chart: { marginTop: 10, marginHorizontal: 20, paddingTop: 14, paddingHorizontal: 14, paddingBottom: 8 },
  h4: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h4Txt: { fontSize: 14, lineHeight: 18 },
  h4Btn: { fontSize: 12, lineHeight: 16, color: colors.pinkLight, fontFamily: fonts.medium },
  voir: { fontSize: 12, lineHeight: 16, color: colors.pinkLight, fontFamily: fonts.medium },
  cplan: { flexDirection: 'row', gap: 8, marginTop: 10 },
  cplanCell: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: '#1A1A1F', alignItems: 'center' },
  cplanSmall: { fontSize: 10.5, lineHeight: 14, color: colors.textSecondary, textAlign: 'center' },
  cplanB: { fontSize: 14, lineHeight: 18 },
  svg: { marginTop: 10 },
  note: { fontSize: 11.5, lineHeight: 16, color: colors.textSecondary, paddingTop: 6 },
  noteVide: { paddingTop: 14, paddingBottom: 8 },
  qcard: {
    marginTop: 12,
    marginHorizontal: 20,
    marginBottom: 18,
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,79,163,0.4)',
    overflow: 'hidden',
  },
  qText: { fontSize: 13.5, lineHeight: 19.6 },
  qEm: { fontSize: 13.5, lineHeight: 19.6, color: colors.textSecondary, marginTop: 4 },
  qImg: { position: 'absolute', right: -10, bottom: -26, width: 124, height: 124 },
});
