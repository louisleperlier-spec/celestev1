import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Vibration, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { ObBar } from '@/components/onboarding/ObScaffold';
import { Glow, Icon, Text } from '@/components/ui';
import { COACH_IMAGES } from '@/data';
import { coachById } from '@/lib/plan';
import { useProfil } from '@/store/profil';
import { colors, fonts } from '@/theme';

/** Durée de l'appui pour s'engager. */
const APPUI_MS = 3000;
const ZONE = 200;
const RAYON = 92;
const TOUR = 2 * Math.PI * RAYON;

const CercleAnime = Animated.createAnimatedComponent(Circle);

/** Un engagement : gris au départ, il s'allume quand l'appui atteint son tiers. */
function Engagement({ texte, i, n, p }: { texte: string; i: number; n: number; p: SharedValue<number> }) {
  const rempli = (v: number) => {
    'worklet';
    return interpolate(v, [i / n, (i + 1) / n], [0, 1], Extrapolation.CLAMP);
  };
  const txt = useAnimatedStyle(() => ({
    opacity: 0.34 + 0.66 * rempli(p.value),
  }));
  const vide = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, rempli(p.value) * 1.4),
  }));
  const coche = useAnimatedStyle(() => ({
    opacity: rempli(p.value),
    transform: [{ scale: 0.35 + 0.65 * rempli(p.value) }],
  }));
  return (
    <View style={styles.engagement}>
      <View style={styles.pastille}>
        <Animated.View style={[styles.vide, vide]} />
        <Animated.View style={[styles.coche, coche]}>
          <Icon name="check" size={14} color={colors.onPrimary} />
        </Animated.View>
      </View>
      <Animated.Text style={[styles.engTxt, txt]}>{texte}</Animated.Text>
    </View>
  );
}

/** 7/7 — Engagement par appui long (design 10K « Appui long ») : maintenir 3 s sur le coach pour valider. */
export default function EngagementEcran() {
  const days = useProfil((s) => s.days);
  const c = coachById(useProfil((s) => s.coach));
  const p = useSharedValue(0);
  const appui = useSharedValue(1);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fait, setFait] = useState(false);

  const engagements = [`Faire mes ${days} séances par semaine`, 'Écouter mon corps et ma récupération', `Avancer avec ${c.nom}, à mon rythme`];

  const valider = () => {
    if (minuteur.current) clearTimeout(minuteur.current);
    setFait(true);
    p.value = withTiming(1, { duration: 200 });
    appui.value = withSpring(1);
    Vibration.vibrate();
    setTimeout(() => router.push('/onboarding/preparation'), 450);
  };
  const debut = () => {
    if (fait) return;
    const reste = APPUI_MS * (1 - p.value);
    appui.value = withSpring(1.06, { damping: 12 });
    p.value = withTiming(1, { duration: reste, easing: Easing.linear });
    minuteur.current = setTimeout(valider, reste);
  };
  const fin = () => {
    if (fait) return;
    if (minuteur.current) clearTimeout(minuteur.current);
    appui.value = withSpring(1);
    p.value = withSpring(0, { damping: 18 });
  };
  useEffect(
    () => () => {
      if (minuteur.current) clearTimeout(minuteur.current);
    },
    [],
  );

  const anneau = useAnimatedProps(() => ({
    strokeDashoffset: TOUR * (1 - p.value),
  }));
  const tete = useAnimatedStyle(() => ({
    transform: [{ scale: appui.value }],
  }));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <ObBar step="engagement" />
      <View style={styles.corps}>
        <Text style={styles.title}>{'Engage-toi\nenvers toi-même'}</Text>
        <Text style={styles.intro}>À partir d&apos;aujourd&apos;hui, je m&apos;engage à :</Text>
        <View style={styles.liste}>
          {engagements.map((t, i) => (
            <Engagement key={t} texte={t} i={i} n={engagements.length} p={p} />
          ))}
        </View>

        <View style={styles.bas}>
          <Pressable
            onPressIn={debut}
            onPressOut={fin}
            accessibilityRole="button"
            accessibilityLabel="Je m'engage"
            accessibilityHint="Maintiens 3 secondes, ou active pour valider"
            accessibilityActions={[{ name: 'activate' }]}
            onAccessibilityAction={valider}
            style={styles.zone}
          >
            <Glow width={ZONE} height={ZONE} color={c.c} intensity={0.35} />
            <Svg width={ZONE} height={ZONE} style={StyleSheet.absoluteFill}>
              <Circle cx={ZONE / 2} cy={ZONE / 2} r={RAYON} stroke={colors.border} strokeWidth={3} fill="none" />
              <CercleAnime
                cx={ZONE / 2}
                cy={ZONE / 2}
                r={RAYON}
                stroke={colors.pink}
                strokeWidth={4}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${TOUR} ${TOUR}`}
                animatedProps={anneau}
                transform={`rotate(-90 ${ZONE / 2} ${ZONE / 2})`}
              />
            </Svg>
            <Animated.View style={[styles.tete, tete]}>
              <Image source={COACH_IMAGES[c.id].tete} style={styles.teteImg} contentFit="cover" />
            </Animated.View>
          </Pressable>
          <Text style={styles.aide}>{fait ? "C'est noté. On y va !" : 'Maintiens le doigt pour t’engager'}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  corps: { flex: 1, paddingHorizontal: 28 },
  title: {
    ...fonts.bold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginTop: 28,
  },
  intro: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: 40,
  },
  liste: { gap: 14, marginTop: 18 },
  engagement: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pastille: { width: 24, height: 24 },
  vide: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border2,
  },
  coche: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  engTxt: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
    color: colors.text,
    ...fonts.medium,
  },
  bas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
  },
  zone: {
    width: ZONE,
    height: ZONE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tete: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  teteImg: { width: 150, height: 150 },
  aide: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: 22,
  },
});
