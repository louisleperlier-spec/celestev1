import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { CoachFace } from '@/components/app/CoachFace';
import { Sheet } from '@/components/app/Sheet';
import { TexteTape } from '@/components/onboarding/Discussion';
import { ObBar, Retour } from '@/components/onboarding/ObScaffold';
import { Button, Glow, Icon, Text, toast } from '@/components/ui';
import { COACHES, COACH_IMAGES } from '@/data';
import type { Coach as CoachT } from '@/data/types';
import { coachById, recoCoach } from '@/lib/plan';
import { useProfil } from '@/store/profil';
import { alpha, colors, fonts } from '@/theme';

const ORDRE = COACHES.map((c) => c.id);
const N = ORDRE.length;
/** « PERFORMANCE » → « Performance ». */
const casse = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
const approche = (c: CoachT) => `${c.traits[0]} et ${c.traits[1].toLowerCase()}`;
/** Ce que le coach dit dans sa bulle, à tour de rôle (ses phrases des données). */
const repliques = (c: CoachT) => [c.quote, c.daily, c.prog];
const RESSORT = { damping: 20, stiffness: 160, mass: 0.9 };

/**
 * Une mascotte : changer de coach est une transformation (fondu, échelle), jamais un glissement de côté.
 * `pos` = coach affiché, en nombre à virgule pendant le geste.
 */
function Mascotte({ c, i, pos, taille, souffle }: { c: CoachT; i: number; pos: SharedValue<number>; taille: number; souffle: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const pres = Math.max(0, 1 - Math.min(Math.abs(i - pos.value), 1));
    // Il respire : monte de 6 pt et grandit à peine, sur 2,4 s.
    return {
      opacity: pres,
      transform: [{ translateY: -6 * souffle.value }, { scale: (0.92 + 0.08 * pres) * (1 + 0.015 * souffle.value) }],
      zIndex: Math.round(pres * 10),
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.centre, style]}>
      <Glow width={taille * 1.1} height={taille} color={c.c} intensity={0.32} />
      <Image source={COACH_IMAGES[c.id].corps} style={{ width: taille, height: taille }} contentFit="contain" />
    </Animated.View>
  );
}

/** Petite orbe qui pulse pendant que le coach « réfléchit ». */
function Orbe({ couleur }: { couleur: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [t]);
  const style = useAnimatedStyle(() => ({ opacity: 0.55 + 0.45 * t.value, transform: [{ scale: 0.85 + 0.25 * t.value }] }));
  return <Animated.View style={[styles.orbe, { backgroundColor: couleur, shadowColor: couleur }, style]} />;
}

/** La bulle de verre à pointe, sous la mascotte : le coach réfléchit, puis sa réplique s'écrit ; trois répliques qui tournent. */
function BulleCoach({ c }: { c: CoachT }) {
  const reduit = useReducedMotion();
  const [etat, setEtat] = useState({ coach: c.id, n: 0, pense: !reduit });
  const lignes = repliques(c);
  const courant = etat.coach === c.id ? etat : { coach: c.id, n: 0, pense: !reduit };
  const ligne = lignes[courant.n % lignes.length];

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    let n = 0;
    const tour = () => {
      setEtat({ coach: c.id, n, pense: !reduit });
      t = setTimeout(
        () => {
          setEtat({ coach: c.id, n, pense: false });
          // Le temps d'écrire la réplique, puis de la lire.
          t = setTimeout(
            () => {
              n++;
              tour();
            },
            lignes[n % lignes.length].length * 22 + 3600,
          );
        },
        reduit ? 0 : 900,
      );
    };
    t = setTimeout(tour, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.id, reduit]);

  return (
    <Animated.View key={c.id} entering={FadeInDown.duration(380)} style={styles.bulle}>
      <Svg width={26} height={12} style={styles.pointe}>
        <Path d="M0 12 Q10 6 13 0 Q16 6 26 12 Z" fill={colors.surface} />
      </Svg>
      {courant.pense ? (
        <View style={styles.pense}>
          <Orbe couleur={c.c} />
          <Text style={styles.penseTxt}>{c.nom} réfléchit…</Text>
        </View>
      ) : (
        <Animated.View key={`${c.id}${courant.n}`} entering={FadeIn.duration(200)}>
          <TexteTape texte={ligne} style={styles.replique} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

/** Ruban en arc avec les têtes des coachs ; la pastille du coach choisi glisse le long de l'arc. */
function Ruban({ index, pos, onChoix }: { index: number; pos: SharedValue<number>; onChoix: (i: number) => void }) {
  const { width } = useWindowDimensions();
  const EP = 62;
  const CREUX = 18;
  const demi = width / 2 - EP / 2 - 14;
  const r = (demi * demi + CREUX * CREUX) / (2 * CREUX);
  const theta = Math.asin(Math.min(demi / r, 1));
  const cx = width / 2;
  const cy = 3 + EP / 2 + r;
  const angle = (k: number) => theta * 0.72 * ((k * 2) / (N - 1) - 1);
  const point = (a: number) => ({ x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) });
  const p0 = point(-theta);
  const p3 = point(theta);
  const sommet = point(0);
  const H = EP + CREUX + 8;
  const choisi = colors.pink;

  const pastille = useAnimatedStyle(() => {
    const a = interpolate(pos.value, [0, N - 1], [angle(0), angle(N - 1)]);
    return {
      transform: [{ translateX: cx + r * Math.sin(a) - 42 }, { translateY: cy - r * Math.cos(a) - 24 }, { rotate: `${a}rad` }],
    };
  });

  return (
    <View style={{ height: H }}>
      <Svg width={width} height={H} style={StyleSheet.absoluteFill}>
        <Path
          d={`M${p0.x} ${p0.y} Q${sommet.x} ${2 * sommet.y - (p0.y + p3.y) / 2} ${p3.x} ${p3.y}`}
          stroke={colors.surface}
          strokeWidth={EP}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <Animated.View pointerEvents="none" style={[styles.pastilleArc, { borderColor: alpha(choisi, 0.7), shadowColor: choisi }, pastille]} />
      {COACHES.map((x, k) => {
        const a = angle(k);
        const p = point(a);
        return (
          <Pressable
            key={x.id}
            accessibilityRole="button"
            accessibilityLabel={`Coach ${x.nom}`}
            accessibilityState={{ selected: k === index }}
            onPress={() => onChoix(k)}
            style={[styles.case, { left: p.x - 42, top: p.y - 24, transform: [{ rotate: `${a}rad` }] }]}
          >
            <View style={[styles.teteArc, k !== index && styles.teteLoin]}>
              <CoachFace id={x.id} size={36} borderColor={k === index ? x.c : 'transparent'} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Choix du coach (design 10K « Choix du coach ») : mascotte en grand, bulle où il parle, nom à sa couleur, ruban en arc. */
export default function Coach() {
  const name = useProfil((s) => s.name);
  const goals = useProfil((s) => s.goals);
  const level = useProfil((s) => s.level);
  const coachId = useProfil((s) => s.coach);
  const obCoachSet = useProfil((s) => s.obCoachSet);
  const set = useProfil((s) => s.set);
  const pickCoach = useProfil((s) => s.pickCoach);
  const { width, height } = useWindowDimensions();
  const [comparer, setComparer] = useState(false);

  // Depuis le Profil (« Changer de coach ») : pas de présélection, retour au programme (vCoach du prototype).
  const depuisProfil = useLocalSearchParams<{ depuis?: string }>().depuis === 'profil';
  const rc = recoCoach(goals, level);
  // À la première arrivée (ou si objectifs/niveau ont changé), on présélectionne le coach recommandé.
  useEffect(() => {
    if (!obCoachSet && !depuisProfil) set({ coach: rc, obCoachSet: true });
  }, [obCoachSet, rc, set, depuisProfil]);
  const c = coachById(obCoachSet || depuisProfil ? coachId : rc);
  const reco = !depuisProfil && c.id === rc;
  const idx = ORDRE.indexOf(c.id);

  const pos = useSharedValue(idx);
  const reduit = useReducedMotion();
  const souffle = useSharedValue(0);
  useEffect(() => {
    if (!reduit) souffle.set(withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [reduit, souffle]);
  useEffect(() => {
    pos.set(withSpring(idx, RESSORT));
  }, [idx, pos]);

  const choisir = (i: number) => {
    const k = Math.max(0, Math.min(N - 1, i));
    if (ORDRE[k] !== c.id) pickCoach(ORDRE[k]);
    else pos.set(withSpring(k, RESSORT));
  };

  // Glisser n'importe où sur la mascotte change de coach (avec résistance aux bouts).
  const geste = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-12, 12])
    .failOffsetY([-14, 14])
    .onUpdate((g) => {
      let d = -g.translationX / width;
      if ((idx === 0 && d < 0) || (idx === N - 1 && d > 0)) d *= 0.28;
      pos.set(idx + d);
    })
    .onEnd((g) => {
      const projete = g.translationX + g.velocityX * 0.12;
      choisir(projete < -width * 0.22 ? idx + 1 : projete > width * 0.22 ? idx - 1 : idx);
    });

  const taille = Math.min(width * 0.7, height * 0.3);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        {depuisProfil ? <Retour /> : <ObBar step="coach" />}

        <Animated.View entering={FadeInDown.duration(450)} style={styles.tete}>
          <Text weight="medium" style={styles.salut}>
            {name ? `Salut ${name} 👋` : 'Salut 👋'}
          </Text>
          <Text style={styles.title}>Quel coach te ressemble ?</Text>
        </Animated.View>

        <GestureDetector gesture={geste}>
          <View style={styles.scene}>
            <View style={styles.flex}>
              {COACHES.map((x, i) => (
                <Mascotte key={x.id} c={x} i={i} pos={pos} taille={taille} souffle={souffle} />
              ))}
            </View>
            <View pointerEvents="none" style={styles.bulleZone}>
              <BulleCoach c={c} />
            </View>
          </View>
        </GestureDetector>

        <View style={styles.bas}>
          <Animated.View key={c.id} entering={FadeIn.duration(260)} style={styles.nomBloc}>
            <Text style={[styles.nom, { color: c.c }]}>{c.nom}</Text>
            <Text weight="medium" style={styles.spec}>
              {casse(c.spec)} · {c.style}
            </Text>
            {reco && (
              <View style={styles.reco}>
                <Icon name="star" size={12} color={colors.pink} />
                <Text weight="semibold" style={styles.recoTxt}>
                  Recommandé pour toi
                </Text>
              </View>
            )}
          </Animated.View>
          <Button
            label={depuisProfil ? `Choisir ${c.nom}` : `Continuer avec ${c.nom}`}
            arrow
            onPress={() => {
              if (!depuisProfil) return router.push('/onboarding/engagement');
              toast('Programme de ' + c.nom + ' créé');
              router.dismissAll();
              router.navigate('/programme');
            }}
          />
          <View style={styles.aide}>
            <Icon name="swap" size={14} color={colors.textTertiary} />
            <Text style={styles.aideTxt}>Glisse pour choisir</Text>
            <Text style={styles.aideTxt}>·</Text>
            <Pressable accessibilityRole="button" onPress={() => setComparer(true)} hitSlop={8}>
              <Text style={[styles.aideTxt, styles.lien]}>Comparer les {N} coachs</Text>
            </Pressable>
          </View>
        </View>

        <Ruban index={idx} pos={pos} onChoix={choisir} />

        <Sheet visible={comparer} onClose={() => setComparer(false)} title={`Les ${N} coachs`}>
          {COACHES.map((x) => (
            <Pressable
              key={x.id}
              accessibilityRole="button"
              onPress={() => {
                pickCoach(x.id);
                setComparer(false);
              }}
              style={[styles.cmp, x.id === c.id && styles.cmpOn]}
            >
              <CoachFace id={x.id} size={52} borderColor={x.id === c.id ? colors.pink : colors.border} />
              <View style={styles.flex}>
                <Text weight="semibold" style={styles.cmpNom}>
                  {x.nom} <Text style={styles.cmpSpec}>• {casse(x.spec)}</Text>
                </Text>
                <Text style={styles.cmpTxt}>
                  {x.style} • {x.reps[0]}-{x.reps[1]} reps • repos {x.rest} s
                </Text>
                <Text style={styles.cmpTxt}>{approche(x)}</Text>
              </View>
            </Pressable>
          ))}
        </Sheet>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  centre: { alignItems: 'center', justifyContent: 'center' },
  tete: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 6 },
  salut: { fontSize: 15, lineHeight: 20, color: colors.textSecondary },
  title: { ...fonts.bold, fontSize: 26, lineHeight: 32, textAlign: 'center', marginTop: 4 },
  scene: { flex: 1, minHeight: 260 },
  bulleZone: { paddingHorizontal: 24, paddingTop: 12 },
  bulle: {
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 74,
    justifyContent: 'center',
  },
  pointe: { position: 'absolute', top: -11, alignSelf: 'center' },
  pense: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orbe: { width: 16, height: 16, borderRadius: 8, shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  penseTxt: { fontSize: 15, lineHeight: 20, color: colors.textSecondary },
  replique: { fontSize: 17, lineHeight: 24, color: colors.text },
  bas: { paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  nomBloc: { alignItems: 'center', gap: 2 },
  nom: { ...fonts.bold, fontSize: 36, lineHeight: 44 },
  spec: { fontSize: 15, lineHeight: 20, color: colors.textSecondary },
  reco: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.pink,
  },
  recoTxt: { fontSize: 12.5, lineHeight: 16, color: colors.pinkLight },
  aide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  aideTxt: { fontSize: 13.5, lineHeight: 18, color: colors.textTertiary },
  lien: { color: colors.textSecondary, textDecorationLine: 'underline' },
  pastilleArc: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 84,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  case: { position: 'absolute', width: 84, height: 48, alignItems: 'center', justifyContent: 'center' },
  teteArc: { alignItems: 'center', justifyContent: 'center' },
  teteLoin: { opacity: 0.5 },
  cmp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: colors.surface2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cmpOn: { borderColor: colors.pink },
  cmpNom: { fontSize: 17, lineHeight: 22 },
  cmpSpec: { fontSize: 14, color: colors.pinkLight },
  cmpTxt: { fontSize: 13.5, lineHeight: 18, color: colors.textSecondary, marginTop: 2 },
});
