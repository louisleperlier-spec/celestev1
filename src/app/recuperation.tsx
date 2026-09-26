import { router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoachFace } from '@/components/app/CoachFace';
import { DetailHead } from '@/components/app/Detail';
import { LivePills } from '@/components/app/LivePills';
import { BigNumber, Button, Card, Text } from '@/components/ui';
import { coachById } from '@/lib/plan';
import { useMesure } from '@/store/mesure';
import { useProfil } from '@/store/profil';
import { alpha, colors, fonts, glow, ui } from '@/theme';

/** Mesure de récupération d'1 minute (vHrv du prototype). */
export default function Recuperation() {
  const m = useMesure();
  const c = coachById(useProfil((s) => s.coach));
  const r = m.res;

  useEffect(() => {
    // Toujours repartir de l'écran de départ (data-mreset) ; la FC avance chaque seconde.
    useMesure.getState().remettre();
    const iv = setInterval(() => useMesure.getState().tick(), 1000);
    return () => {
      clearInterval(iv);
      useMesure.getState().remettre();
    };
  }, []);

  const conseil = !r
    ? ''
    : r.st[0] === 'Bien récupéré'
      ? c.prog
      : r.st[0] === 'Fatigue élevée'
        ? "On lève le pied aujourd'hui. Dors bien ce soir, on repart demain."
        : 'Hydrate-toi, mange bien, et reste en zone modérée.';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <DetailHead titre="Mesure de récupération" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {r ? (
          <>
            <Anneau couleur={r.st[1]} fini>
              <BigNumber value={r.hrv} size={52} />
              <Text style={styles.ringSmall}>ms de VFC</Text>
            </Anneau>
            <Text style={[styles.h1, styles.h1Res, { color: r.st[1] }]}>{r.st[0]}</Text>
            <Text style={styles.sub}>{r.st[2]}</Text>
            {/* .cplan */}
            <View style={styles.cplan}>
              <Case label="FC moyenne" value={`${r.bpm} bpm`} />
              <Case label="Ta moyenne VFC" value={`${r.base} ms`} />
              <Case label="Écart" value={`${r.diff >= 0 ? '+' : ''}${r.diff} %`} />
            </View>
            {/* .coachtip2 */}
            <Card style={styles.tip}>
              <CoachFace id={c.id} size={46} borderWidth={0} />
              <Text style={styles.tipTxt}>
                {conseil} — {c.nom}
              </Text>
            </Card>
          </>
        ) : (
          <>
            <Anneau couleur={colors.pink} run={m.run}>
              <BigNumber value={m.run ? m.left : 60} size={52} />
              <Text style={styles.ringSmall}>secondes</Text>
            </Anneau>
            <Text style={styles.h1}>Mesure ta VFC</Text>
            <Text style={styles.sub}>Assieds-toi ou allonge-toi, respire calmement par le nez et ne bouge pas pendant 1 minute.</Text>
          </>
        )}
        <View style={styles.live}>
          <LivePills bpm={m.bpm} zone={m.zone} hrv={m.hrv} />
        </View>
        <Text style={styles.note}>
          Sans capteur, la mesure est simulée. Avec une ceinture cardio Bluetooth (ou la montre dans la version native), elle sera réelle.
        </Text>
      </ScrollView>
      <View style={styles.foot}>
        {r ? (
          <Button label="Terminé" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/accueil'))} />
        ) : m.run ? (
          <Button label="Annuler" variant="dark" onPress={m.remettre} />
        ) : (
          <Button label="Lancer la mesure" iconAfter="play" onPress={m.lancer} />
        )}
      </View>
    </SafeAreaView>
  );
}

/** Anneau de mesure (.hring) : respire pendant la mesure, couleur du résultat à la fin. */
function Anneau({ couleur, run = false, fini = false, children }: { couleur: string; run?: boolean; fini?: boolean; children: ReactNode }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (run) t.value = withRepeat(withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }), -1, true);
    else {
      cancelAnimation(t);
      t.value = 0;
    }
  }, [run, t]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.07 * t.value }] }));
  return (
    <Animated.View
      style={[
        styles.ring,
        run && { borderColor: colors.pink, ...glow(alpha(colors.pink, 0.45), 40) },
        fini && { borderColor: couleur, ...glow(alpha(couleur, 0.45), 30) },
        anim,
      ]}
    >
      {children}
    </Animated.View>
  );
}

function Case({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.case}>
      <Text style={styles.caseSmall}>{label}</Text>
      <Text weight="bold" style={styles.caseB}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, alignItems: 'center' },
  ring: {
    width: 190,
    height: 190,
    borderRadius: 95,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.border,
  },
  ringSmall: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  h1: { fontFamily: fonts.black, fontSize: 22, lineHeight: 26, letterSpacing: -0.2, textTransform: 'uppercase', marginTop: 18, textAlign: 'center' },
  h1Res: { fontSize: 24, lineHeight: 28 },
  sub: { color: colors.textSecondary, fontSize: 14, lineHeight: 19.6, marginTop: 6, textAlign: 'center' },
  cplan: { flexDirection: 'row', gap: 8, marginTop: 16, alignSelf: 'stretch' },
  case: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: ui.dark, alignItems: 'center' },
  caseSmall: { fontSize: 10.5, lineHeight: 14, color: colors.textSecondary, textAlign: 'center' },
  caseB: { fontSize: 14, lineHeight: 18 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginTop: 14, alignSelf: 'stretch' },
  tipTxt: { flex: 1, fontSize: 13.5, lineHeight: 19 },
  live: { alignSelf: 'stretch', marginHorizontal: -20 },
  note: { alignSelf: 'stretch', fontSize: 11.5, lineHeight: 16, color: colors.textSecondary, paddingTop: 8 },
  foot: { paddingTop: 12, paddingHorizontal: 20, paddingBottom: 18 },
});
