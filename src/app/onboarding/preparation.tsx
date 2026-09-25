import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Glow, Icon, RadialBackground, Text } from '@/components/ui';
import { COACH_IMAGES } from '@/data';
import { coachById, LVLN, lvlN, nextSession, prog } from '@/lib/plan';
import { usePlan, useProfil } from '@/store/profil';
import { colors, fonts, ui } from '@/theme';

/** Fond .ready : halo rose au centre, violet à droite. */
const FOND = [
  { rx: 80, ry: 50, cx: 50, cy: 45, color: 'rgba(255,79,163,0.28)' },
  { rx: 60, ry: 40, cx: 90, cy: 60, color: 'rgba(140,70,255,0.22)' },
] as const;

const dec = (n: number) => String(n).replace('.', ',');

/** Une étape qui apparaît en glissant depuis la gauche (animation stepin, 0,4 s). */
function Etape({ texte, delai }: { texte: string; delai: number }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delai, withTiming(1, { duration: 400 }));
  }, [v, delai]);
  const style = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ translateX: (v.value - 1) * 8 }] }));
  return (
    <Animated.View style={[styles.step, style]}>
      <View style={styles.stepCheck}>
        <Icon name="check" size={14} strokeWidth={3} color={colors.onPrimary} />
      </View>
      <Text style={styles.stepText}>{texte}</Text>
    </Animated.View>
  );
}

/** Après le choix du coach : « {coach} prépare ton programme » puis le résumé (vObBuild). */
export default function Preparation() {
  const profil = useProfil();
  const plan = usePlan();
  const [pret, setPret] = useState(false);
  const pese = useRef(false);

  // Comme le prototype : on note le poids du jour, puis le résultat apparaît après 2,6 s.
  useEffect(() => {
    if (!pese.current) {
      pese.current = true;
      profil.logWeight(profil.weight);
    }
    const t = setTimeout(() => setPret(true), 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const c = coachById(profil.coach);
  const s = nextSession(plan).s;
  const etapes = [
    'Analyse de tes objectifs',
    'Choix des exercices selon ton matériel',
    'Calcul des charges pour ' + dec(profil.weight) + ' kg',
    'Répartition sur ' + profil.days + ' jours',
    'Réglage de tes zones cardio',
  ];

  // Robot qui flotte (animation float, 3 s).
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [y]);
  const flotte = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  const commencer = () => {
    // Le paywall (étape 11) et la création de compte (étape 5) viendront s'insérer ici.
    profil.set({ onboarded: true });
    router.replace('/accueil');
  };

  return (
    <View style={styles.root}>
      <RadialBackground layers={FOND} />
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.botWrap}>
            <Glow width={260} height={260} color={c.c} intensity={0.5} />
            <Animated.View style={flotte}>
              <Image source={COACH_IMAGES[c.id].corps} style={styles.bot} contentFit="contain" />
            </Animated.View>
          </View>
          <Text style={styles.title}>{c.nom} prépare ton programme</Text>

          <View style={styles.steps}>
            {etapes.map((t, i) => (
              <Etape key={t} texte={t} delai={i * 450} />
            ))}
          </View>

          {pret && (
            <Animated.View entering={FadeIn.duration(500)} style={styles.bres}>
              <Text weight="semibold" style={styles.bresSmall}>
                TON PROGRAMME
              </Text>
              <Text weight="bold" style={styles.bresH3}>
                {prog(profil).nom}
              </Text>
              <Text style={styles.bresP}>
                {profil.days} séances par semaine{profil.dur ? ' • ≈ ' + profil.dur + ' min' : ''} •{' '}
                {LVLN[lvlN(profil.level) - 1]}
              </Text>
              <View style={styles.cplan}>
                {[
                  ['1re séance', s.titre.split(':')[0]],
                  ['Durée', s.min + ' min'],
                  ['Calories', '≈ ' + s.kcal],
                ].map(([k, v]) => (
                  <View key={k} style={styles.cplanCell}>
                    <Text style={styles.cplanSmall}>{k}</Text>
                    <Text weight="bold" style={styles.cplanB}>
                      {v}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}
        </ScrollView>
        <View style={[styles.foot, !pret && styles.hidden]} pointerEvents={pret ? 'auto' : 'none'}>
          <Button label="C'est parti" arrow onPress={commencer} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 16, alignItems: 'center' },
  botWrap: { width: 260, height: 236, alignItems: 'center', justifyContent: 'flex-end' },
  bot: { height: 200, width: 200, marginTop: 18 },
  title: { fontFamily: fonts.black, fontSize: 28, lineHeight: 31, letterSpacing: -0.28, marginTop: 6, textAlign: 'center' },
  // .bsteps
  steps: { gap: 10, marginTop: 22, width: '100%', maxWidth: 300 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepCheck: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center' },
  stepText: { flex: 1, fontSize: 14, lineHeight: 18, color: ui.text4 },
  // .bres
  bres: {
    alignSelf: 'stretch',
    marginTop: 22,
    padding: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.pink,
    borderRadius: 16,
  },
  bresSmall: { fontSize: 11, lineHeight: 14, letterSpacing: 0.66, color: colors.pinkLight },
  bresH3: { fontSize: 20, lineHeight: 25, marginTop: 4 },
  bresP: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, marginTop: 2 },
  cplan: { flexDirection: 'row', gap: 8, marginTop: 10 },
  cplanCell: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: ui.dark, alignItems: 'center' },
  cplanSmall: { fontSize: 10.5, lineHeight: 14, color: colors.textSecondary },
  cplanB: { fontSize: 14, lineHeight: 18, textAlign: 'center' },
  foot: { paddingTop: 12, paddingHorizontal: 20, paddingBottom: 18 },
  hidden: { opacity: 0 },
});
