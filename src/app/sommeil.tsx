import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, G, Line, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { BarresVFC } from '@/components/app/BarresVFC';
import { bientot } from '@/components/app/bientot';
import { DetailHead } from '@/components/app/Detail';
import { NuitSheet } from '@/components/app/NuitSheet';
import { Row } from '@/components/app/Rows';
import { SectionHead } from '@/components/app/Section';
import { Button, Card, Icon, Text } from '@/components/ui';
import { dec } from '@/lib/charges';
import { JOURS } from '@/lib/semaine';
import { baseHrv, conseilNuit, lastNight, recovStatus, sleepScore, type Nuit } from '@/lib/sommeil';
import { useProfil } from '@/store/profil';
import { colors, fonts, heartZones, ui } from '@/theme';

/** Sommeil : score de la nuit, 7 dernières nuits, VFC nocturne, mesures de récupération (vSleep du prototype). */
export default function Sommeil() {
  const p = useProfil();
  const [feuille, setFeuille] = useState(false);
  const [now, setNow] = useState(Date.now);
  useFocusEffect(useCallback(() => setNow(Date.now()), []));

  const ns = p.nights.slice(-7);
  const base = baseHrv(p.nights, p.hrvChecks);
  const ln = lastNight(p.nights, new Date(now));
  const sc = sleepScore(ln, base);
  const avgH = ns.length ? ns.reduce((a, n) => a + n.h, 0) / ns.length : 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <DetailHead
        titre="Sommeil"
        droite={
          <Pressable accessibilityRole="button" accessibilityLabel="Réglages" onPress={() => bientot('notifications')} style={styles.iconbtn}>
            <Icon name="bell" />
          </Pressable>
        }
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* .sleephead */}
        <Card style={styles.head}>
          <Anneau score={sc} />
          <View style={styles.flex}>
            <Text weight="bold" style={styles.h3}>
              {ln ? 'Nuit dernière' : 'Pas encore de nuit notée'}
            </Text>
            <Text style={styles.p}>
              {ln
                ? `${dec(ln.h)} h • qualité ${ln.q}/5${ln.hrv ? ` • VFC ${ln.hrv} ms` : ''}${ln.rhr ? ` • FC repos ${ln.rhr}` : ''}`
                : 'Ajoute ta nuit pour obtenir ton score.'}
            </Text>
            {sc != null && <Text style={styles.conseil}>{conseilNuit(sc)}</Text>}
          </View>
        </Card>

        <Card style={styles.chart}>
          <View style={styles.h4}>
            <Text weight="bold" style={styles.h4Txt}>
              7 dernières nuits
            </Text>
            <Text style={styles.h4Small}>moy. {dec(avgH.toFixed(1))} h</Text>
          </View>
          <BarresNuits ns={ns} />
        </Card>

        <Card style={styles.chart}>
          <View style={styles.h4}>
            <Text weight="bold" style={styles.h4Txt}>
              VFC nocturne
            </Text>
            <Text style={styles.h4Small}>moy. {base} ms</Text>
          </View>
          <BarresVFC hl={ns.filter((n) => n.hrv).map((n) => ({ hrv: n.hrv!, type: 'nuit' as const }))} />
        </Card>

        <SectionHead title="Mesures de récupération" action="Mesurer" onAction={() => router.push('/recuperation')} />
        <View style={styles.list}>
          {p.hrvChecks
            .slice(-5)
            .reverse()
            .map((c) => {
              const s = recovStatus(c.hrv, base);
              const quand = new Date(c.d).toLocaleString('fr-CA', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
              return (
                <Row key={c.d}>
                  <View style={[styles.zone, { backgroundColor: s[1] }]} />
                  <View style={styles.flex}>
                    <Text weight="semibold" style={styles.h5}>
                      {c.hrv} ms • {s[0]}
                    </Text>
                    <Text style={styles.p5}>
                      {c.kind === 'post' ? 'Après entraînement' : 'Au réveil'} • {quand} • FC {c.bpm}
                    </Text>
                  </View>
                </Row>
              );
            })}
          {!p.hrvChecks.length && <Text style={styles.noteVide}>Aucune mesure : lance-en une après ta prochaine séance.</Text>}
        </View>
        <Text style={styles.note}>La VFC nocturne se lit dans l&apos;app Santé ou celle de ta montre ; la version native la récupérera automatiquement.</Text>
        <View style={styles.bas} />
      </ScrollView>
      <View style={styles.foot}>
        <Button label="Ajouter ma nuit" icon="plus" onPress={() => setFeuille(true)} />
      </View>
      <NuitSheet visible={feuille} onClose={() => setFeuille(false)} />
    </SafeAreaView>
  );
}

/** Anneau du score (.sring : dégradé conique #8f9bff sur #26262b, 78 px). */
function Anneau({ score }: { score: number | null }) {
  const R = 35.5;
  const C = 2 * Math.PI * R;
  return (
    <View style={styles.ring}>
      <Svg width={78} height={78} viewBox="0 0 78 78" style={StyleSheet.absoluteFill}>
        <Circle cx={39} cy={39} r={R} stroke={colors.border} strokeWidth={7} fill="none" />
        <Circle
          cx={39}
          cy={39}
          r={R}
          stroke={ui.sommeil}
          strokeWidth={7}
          fill="none"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - (score ?? 0) / 100)}
          transform="rotate(-90 39 39)"
        />
      </Svg>
      <Text weight="extrabold" style={styles.ringB}>
        {score ?? '--'}
      </Text>
      <Text style={styles.ringSmall}>/100</Text>
    </View>
  );
}

/** Durée des 7 dernières nuits, repère à 8 h (svg de vSleep, 320 × 110). */
function BarresNuits({ ns }: { ns: readonly Nuit[] }) {
  const { width } = useWindowDimensions();
  const W = 320;
  const H = 110;
  const bw = W / 7;
  const mx = 10;
  const w = width - 40 - 28;
  const y8 = H - (8 / mx) * H;
  return (
    <Svg width={w} height={(w * (H + 16)) / W} viewBox={`0 0 ${W} ${H + 16}`} style={styles.svg}>
      <Defs>
        <LinearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={ui.sommeil} />
          <Stop offset="1" stopColor={ui.sommeilFonce} />
        </LinearGradient>
      </Defs>
      <Line x1={0} x2={W} y1={y8} y2={y8} stroke={heartZones.z1} strokeDasharray="4 4" opacity={0.6} />
      <SvgText x={W - 2} y={y8 - 4} textAnchor="end" fill={ui.sommeil} fontSize={9} fontFamily={fonts.regular}>
        8 h
      </SvgText>
      {ns.map((n, i) => {
        const h = (n.h / mx) * H;
        return (
          <G key={n.d}>
            <Rect x={i * bw + bw * 0.22} y={H - h} width={bw * 0.56} height={h} rx={4} fill="url(#sg)" />
            <SvgText x={i * bw + bw / 2} y={H + 12} textAnchor="middle" fill={ui.axe} fontSize={9} fontFamily={fonts.regular}>
              {JOURS[(new Date(n.d + 'T12:00').getDay() + 6) % 7]}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  iconbtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 10, marginHorizontal: 20, padding: 16 },
  h3: { fontSize: 16, lineHeight: 20 },
  p: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary, marginTop: 3 },
  conseil: { fontSize: 12, lineHeight: 16, color: ui.sommeil, marginTop: 4 },
  ring: { width: 78, height: 78, alignItems: 'center', justifyContent: 'center' },
  ringB: { fontSize: 22, lineHeight: 26 },
  ringSmall: { fontSize: 10, lineHeight: 12, color: colors.textSecondary },
  chart: { marginTop: 10, marginHorizontal: 20, paddingTop: 14, paddingHorizontal: 14, paddingBottom: 8 },
  h4: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h4Txt: { fontSize: 14, lineHeight: 18 },
  h4Small: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  svg: { marginTop: 10 },
  list: { paddingHorizontal: 20 },
  zone: { width: 10, height: 10, borderRadius: 5 },
  h5: { fontSize: 14.5, lineHeight: 19 },
  p5: { fontSize: 12, lineHeight: 16, color: colors.textSecondary, marginTop: 2 },
  noteVide: { fontSize: 11.5, lineHeight: 16, color: colors.textSecondary },
  note: { fontSize: 11.5, lineHeight: 16, color: colors.textSecondary, paddingTop: 8, paddingHorizontal: 20 },
  bas: { height: 10 },
  foot: { paddingTop: 12, paddingHorizontal: 20, paddingBottom: 18 },
});
