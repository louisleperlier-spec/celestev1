import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoachFace } from '@/components/app/CoachFace';
import { DemoSheet } from '@/components/app/DemoSheet';
import { LivePills } from '@/components/app/LivePills';
import { Recap } from '@/components/app/Recap';
import { ZoneBar } from '@/components/app/ZoneBar';
import { BigNumber, Button, Card, Glow, Icon, Text } from '@/components/ui';
import { EXERCICE_IMAGES } from '@/data';
import type { ExerciceId, SeanceId } from '@/data/types';
import { loadFor, rj } from '@/lib/charges';
import { mmss } from '@/lib/coeur';
import { coachById, exercice, exKcal } from '@/lib/plan';
import { catSession, seanceById, sessionForDay, type SeanceJour } from '@/lib/semaine';
import { selectProfil, useProfil, useSemaine } from '@/store/profil';
import { useSeance } from '@/store/seance';
import { colors, fonts, glow, ui } from '@/theme';

/** Séance en cours (vWorkout du prototype), puis récap (vRecap). FC simulée en attendant Apple Santé. */
export default function SeanceEnCours() {
  const { jour, cat } = useLocalSearchParams<{ jour?: string; cat?: SeanceId }>();
  const profil = useProfil();
  const p = selectProfil(profil);
  const sem = useSemaine();
  const c = coachById(p.coach);
  const seance = useSeance();
  const w = seance.w;
  const [demo, setDemo] = useState<ExerciceId | null>(null);

  // launchS : la séance est figée au lancement ; l'horloge tourne chaque seconde.
  useEffect(() => {
    const s: SeanceJour =
      cat != null ? catSession(seanceById(cat), null, p.weight, profil.wkMod[cat] ?? 0) : (sessionForDay(sem, Number(jour)) ?? sem.plan.sessions[0]);
    useSeance.getState().lancer(s);
    const iv = setInterval(() => useSeance.getState().tick(), 1000);
    return () => {
      clearInterval(iv);
      useSeance.getState().quitter();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!w) return <View style={styles.root} />;
  if (w.phase === 'done' && w.res) return <Recap coachId={c.id} res={w.res} />;

  const it = w.s.items[w.ex];
  const e = exercice(it.id);
  const ld = loadFor(it, p);
  const total = w.s.items.reduce((a, x) => a + x.sets, 0);
  const doneN = w.done.flat().length;
  const allDone = w.done[w.ex].length >= it.sets;
  const label = allDone
    ? w.ex < w.s.items.length - 1
      ? 'Exercice suivant'
      : 'Terminer la séance'
    : it.sec
      ? w.phase === 'work'
        ? 'Arrêter la série'
        : 'Lancer le chrono'
      : 'Terminer la série';

  const quitter = () => {
    if (!doneN) return router.back();
    Alert.alert('Quitter la séance ?', 'Elle ne sera pas enregistrée.', [
      { text: 'Continuer', style: 'cancel' },
      { text: 'Quitter', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      {/* .wh */}
      <View style={styles.wh}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quitter" onPress={quitter} style={styles.iconbtn}>
          <Icon name="left" />
        </Pressable>
        <Text weight="semibold" style={styles.whTitle} numberOfLines={1}>
          {w.s.titre}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel={w.paused ? 'Reprendre' : 'Pause'} onPress={seance.pause} style={styles.tmBtn}>
          <Text weight="bold" style={styles.tm}>
            {(w.paused ? '❚❚ ' : '') + mmss(w.elapsed)}
          </Text>
        </Pressable>
      </View>
      {/* .pbar */}
      <View style={styles.pbar}>
        <LinearGradient colors={[colors.green, '#9BF0B9']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.pfill, { width: `${(doneN / total) * 100}%` }]} />
      </View>
      <LivePills bpm={w.bpm} zone={w.zone} hrv={w.hrv} kcal={w.kc} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* .exostage */}
        <View style={styles.stage}>
          <Glow width={320} height={250} color="#50506E" intensity={0.35} />
          <Image source={EXERCICE_IMAGES[it.id]} style={styles.stageImg} contentFit="contain" accessibilityLabel={e.nom} />
        </View>
        <View style={styles.exotitle}>
          <Text weight="bold" style={styles.n}>
            {w.ex + 1}/{w.s.items.length}
          </Text>
          <Text weight="extrabold" style={styles.h2}>
            {e.nom}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => setDemo(it.id)} style={styles.howbtn}>
            <Icon name="play" size={16} color={colors.pinkPale} />
            <Text style={styles.howTxt}>Démo</Text>
          </Pressable>
        </View>
        <Text style={styles.meta}>
          <Text style={styles.metaB}>{it.sets} séries</Text> • {it.sec ? it.sec + ' s' : rj(it.reps!) + ' reps'} • {it.rest} s repos •{' '}
          <Text style={styles.metaB}>≈ {exKcal(it, p.weight)} kcal</Text> cet exercice
        </Text>
        <Card style={styles.load}>
          <View style={styles.lh}>
            <Text weight="extrabold" style={styles.lhB}>
              {ld.txt}
            </Text>
            <Text style={styles.lhSmall}>{ld.sub}</Text>
          </View>
          <ZoneBar it={it} cur={it.reps ? w.reps : undefined} />
        </Card>

        {/* .counter : reps ou minuteur */}
        <View style={styles.counter}>
          {it.sec ? (
            <Card style={styles.timer}>
              <BigNumber value={mmss(w.phase === 'work' ? w.left : it.sec)} size={26} color={colors.pinkLight} />
              <Text style={styles.cSmall}>{w.phase === 'work' ? 'effort en cours' : 'durée de la série'}</Text>
            </Card>
          ) : (
            <>
              <Rb icon="minus" label="Moins" onPress={() => seance.reps(-1)} />
              <Card style={styles.cval}>
                <BigNumber value={w.reps} size={22} />
                <Text style={styles.cSmall}>reps</Text>
              </Card>
              <Rb icon="plus" label="Plus" onPress={() => seance.reps(1)} />
            </>
          )}
        </View>
        <View style={styles.foot}>
          <BoutonRose label={label} onPress={seance.principal} />
        </View>

        {/* .series */}
        <Card style={styles.series}>
          <Text style={styles.seriesLbl}>Série</Text>
          {[...Array(it.sets)].map((_, i) => {
            const ok = w.done[w.ex].includes(i);
            const on = i === w.set && !allDone;
            return (
              <Pressable key={i} accessibilityRole="button" accessibilityLabel={`Série ${i + 1}${ok ? ', faite' : ''}`} onPress={() => seance.choisirSerie(i)}>
                {on ? (
                  <LinearGradient colors={['#FFB3D6', '#FF6FB5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.sn, styles.snOn, glow('rgba(255,79,163,0.6)', 12)]}>
                    <Text weight="bold" style={[styles.snTxt, { color: colors.onPrimary }]}>
                      {ok ? '✓' : i + 1}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.sn, ok && styles.snOk]}>
                    <Text weight="bold" style={[styles.snTxt, ok && { color: colors.pinkLight }]}>
                      {ok ? '✓' : i + 1}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </Card>
      </ScrollView>

      {/* restOverlay */}
      {w.phase === 'rest' && (
        <View style={styles.rest}>
          <Text style={styles.restP}>{w.nextMsg || 'Repos'}</Text>
          <View>
            <Glow width={200} height={120} intensity={0.35} />
            <BigNumber value={w.left} size={72} color={colors.pink} />
          </View>
          <LivePills bpm={w.bpm} zone={w.zone} hrv={w.hrv} centre />
          <View style={styles.tip}>
            <CoachFace id={c.id} size={54} borderColor={colors.pink} />
            <Text style={styles.tipTxt}>{w.tip}</Text>
          </View>
          <Button label="Passer le repos" onPress={seance.passerRepos} style={styles.restBtn} />
        </View>
      )}
      <DemoSheet id={demo} onClose={() => setDemo(null)} />
    </SafeAreaView>
  );
}

/** Bouton rond + / − (.rb). */
function Rb({ icon, label, onPress }: { icon: 'plus' | 'minus'; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      <LinearGradient colors={['#FFFFFF', '#FFC6E0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.rb, glow('rgba(255,79,163,0.45)', 16)]}>
        <Icon name={icon} strokeWidth={2.4} color={colors.onPrimary} />
      </LinearGradient>
    </Pressable>
  );
}

/** Bouton principal rose de la séance (.btn.pink). */
function BoutonRose({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}>
      <LinearGradient
        colors={['#FFB3D6', '#FF7FBD', '#FF9BCB']}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.pinkBtn, glow('rgba(255,79,163,0.45)', 28)]}
      >
        <Text weight="bold" style={styles.pinkTxt}>
          {label}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  wh: { flexDirection: 'row', alignItems: 'center', height: 48, paddingTop: 6, paddingHorizontal: 14 },
  iconbtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  whTitle: { flex: 1, textAlign: 'center', fontSize: 16, lineHeight: 20 },
  tmBtn: { width: 60, alignItems: 'flex-end' },
  tm: { color: colors.pink, fontSize: 15, lineHeight: 19, fontVariant: ['tabular-nums'] },
  pbar: { height: 4, borderRadius: 4, backgroundColor: colors.border, marginTop: 6, marginHorizontal: 20, overflow: 'hidden' },
  pfill: { height: '100%', borderRadius: 4 },
  stage: { height: 250, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  stageImg: { height: 250, width: '88%' },
  exotitle: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingTop: 6, paddingHorizontal: 20 },
  n: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    overflow: 'hidden',
    fontSize: 12,
    lineHeight: 15,
    backgroundColor: 'rgba(255,79,163,0.18)',
    color: colors.pinkLight,
    marginTop: 4,
  },
  h2: { flex: 1, fontSize: 20, lineHeight: 23 },
  howbtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,79,163,0.5)' },
  howTxt: { fontSize: 12.5, lineHeight: 16, color: colors.pinkPale },
  meta: { paddingTop: 6, paddingHorizontal: 20, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  metaB: { color: colors.pinkLight, fontFamily: fonts.medium },
  load: { marginTop: 12, marginHorizontal: 20, paddingVertical: 12, paddingHorizontal: 14 },
  lh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  lhB: { fontSize: 17, lineHeight: 22 },
  lhSmall: { fontSize: 11.5, lineHeight: 15, color: colors.textSecondary },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 18, paddingHorizontal: 20 },
  rb: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  cval: { flex: 1, height: 58, alignItems: 'center', justifyContent: 'center' },
  timer: { flex: 1, height: 58, alignItems: 'center', justifyContent: 'center' },
  cSmall: { fontSize: 11, lineHeight: 14, color: colors.textSecondary, marginTop: 1 },
  foot: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 18 },
  pinkBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  pinkTxt: { fontSize: 15, lineHeight: 19, color: colors.onPrimary },
  series: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, marginHorizontal: 20, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, flexWrap: 'wrap' },
  seriesLbl: { fontSize: 13, lineHeight: 17, color: colors.textSecondary, marginRight: 6 },
  sn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.iconBg, borderWidth: 1, borderColor: colors.border2 },
  snOn: { borderWidth: 0 },
  snOk: { borderColor: 'rgba(255,79,163,0.5)' },
  snTxt: { fontSize: 14, lineHeight: 18 },
  rest: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 40,
    backgroundColor: 'rgba(5,5,7,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 30,
  },
  restP: { color: colors.textSecondary, fontSize: 14, lineHeight: 19, textAlign: 'center' },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: 320 },
  tipTxt: { flex: 1, fontSize: 13.5, lineHeight: 19, color: ui.text4 },
  restBtn: { width: 260 },
});
