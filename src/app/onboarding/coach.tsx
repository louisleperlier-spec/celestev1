import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { CoachFace } from '@/components/app/CoachFace';
import { Sheet } from '@/components/app/Sheet';
import { dureeRevele, OrbeSiri, Reflet, REVELE_DELAI, TexteRevele, TexteScintille } from '@/components/onboarding/ChoixCoach';
import { Glow, Icon, Text, toast } from '@/components/ui';
import { COACHES, COACH_IMAGES } from '@/data';
import type { Coach as CoachT } from '@/data/types';
import { coachById, recoCoach } from '@/lib/plan';
import { useProfil } from '@/store/profil';
import { alpha, colors, fonts, ui } from '@/theme';

const ORDRE = COACHES.map((c) => c.id);
const N = ORDRE.length;
/** « PERFORMANCE » → « Performance ». */
const casse = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
const approche = (c: CoachT) => `${c.traits[0]} et ${c.traits[1].toLowerCase()}`;
/** Ce que le coach dit dans sa bulle, à tour de rôle (ses phrases des données). */
const repliques = (c: CoachT) => [c.quote, c.daily, c.prog];
const RESSORT = { damping: 20, stiffness: 160, mass: 0.9 };
/** Haut de la mascotte dans la scène. */
const HAUT_MASCOTTE = 18;

/**
 * Une mascotte : changer de coach est une transformation (fondu, échelle), jamais un glissement de côté.
 * `pos` = coach affiché, en nombre à virgule pendant le geste.
 */
function Mascotte({ c, i, pos, taille, souffle }: { c: CoachT; i: number; pos: SharedValue<number>; taille: number; souffle: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const pres = Math.max(0, 1 - Math.min(Math.abs(i - pos.value), 1));
    return { opacity: pres, transform: [{ scale: 0.92 + 0.08 * pres }], zIndex: Math.round(pres * 10) };
  });
  // Il respire : monte de 6 pt et grandit à peine, sur 2,4 s (son reflet reste au sol).
  const corps = useAnimatedStyle(() => ({ transform: [{ translateY: -6 * souffle.value }, { scale: 1 + 0.015 * souffle.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.mascotte, style]}>
      <View style={{ width: taille, height: taille }}>
        <Glow width={taille * 1.1} height={taille} color={c.c} intensity={0.3} />
        <Animated.View style={corps}>
          <Image source={COACH_IMAGES[c.id].corps} style={{ width: taille, height: taille }} contentFit="contain" />
        </Animated.View>
      </View>
      {/* Reflet sur le sol noir, qui s'efface vers le bas. */}
      <View style={{ width: taille, height: taille * 0.42, overflow: 'hidden', marginTop: -taille * 0.03 }}>
        <Image source={COACH_IMAGES[c.id].corps} style={[styles.reflet, { width: taille, height: taille }]} contentFit="contain" />
        <LinearGradient colors={[alpha(colors.bgAlt, 0.35), colors.bgAlt]} locations={[0, 0.85]} style={StyleSheet.absoluteFill} />
      </View>
    </Animated.View>
  );
}

/** Entrée en cascade jouée une seule fois (opacité + montée), pour un bloc qui ne doit jamais rejouer son entrée. */
function useEntree(delai: number, depuis: number) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.set(withDelay(delai, withSpring(1, { damping: 18, stiffness: 120 })));
  }, [delai, v]);
  return useAnimatedStyle(() => ({ opacity: Math.min(1, v.value), transform: [{ translateY: (1 - v.value) * depuis }] }));
}

/**
 * La bulle à pointe sous la mascotte (panneau Coach 2.0) : l'orbe réfléchit, puis la réplique se dévoile en vague ;
 * ses trois phrases tournent. À chaque nouveau coach, la bulle se referme puis rebondit (échelle 0,9 → 1).
 */
function BulleCoach({ c }: { c: CoachT }) {
  const reduit = useReducedMotion();
  const [etat, setEtat] = useState({ coach: c.id, n: 0, pense: !reduit });
  const lignes = repliques(c);
  const courant = etat.coach === c.id ? etat : { coach: c.id, n: 0, pense: !reduit };
  const ligne = lignes[courant.n % lignes.length];
  const montre = useSharedValue(0);
  const premiere = useRef(true);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    let n = 0;
    const tour = (pause: number) => {
      setEtat({ coach: c.id, n, pense: !reduit });
      montre.set(withSpring(1, { damping: 11, stiffness: 140 }));
      t = setTimeout(
        () => {
          setEtat({ coach: c.id, n, pense: false });
          // Le temps de dévoiler la réplique, puis 3,6 s pour la lire.
          const l = lignes[n % lignes.length];
          t = setTimeout(
            () => {
              n++;
              tour(900);
            },
            REVELE_DELAI + dureeRevele(l) + 3600,
          );
        },
        reduit ? 0 : pause,
      );
    };
    // La 1re fois, elle arrive avec le bloc du bas ; ensuite elle se referme 260 ms avant le nouveau coach.
    montre.set(withTiming(0, { duration: 200 }));
    t = setTimeout(() => tour(1100), premiere.current ? 700 : 260);
    premiere.current = false;
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.id, reduit]);

  const anime = useAnimatedStyle(() => ({ opacity: Math.min(1, montre.value), transform: [{ scale: 0.9 + 0.1 * montre.value }] }));

  return (
    <Animated.View style={[styles.bulle, anime]}>
      <Svg width={26} height={12} style={styles.pointe}>
        <Path d="M0 12 Q10 6 13 0 Q16 6 26 12 Z" fill={alpha(colors.surface, 0.8)} />
      </Svg>
      {courant.pense ? (
        <Animated.View entering={FadeIn.duration(200)} style={styles.pense}>
          <OrbeSiri taille={18} />
          <TexteScintille texte={`${c.nom} réfléchit…`} style={styles.penseTxt} />
        </Animated.View>
      ) : (
        <TexteRevele key={`${c.id}${courant.n}`} texte={ligne} style={styles.replique} />
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
  const choisi = COACHES[index].c;

  // Angles des deux bouts calculés ici : la fonction `angle` n'est pas un worklet et ferait planter l'app sur iPhone
  // si on l'appelait depuis le fil d'animation (sur le web, tout tourne dans le même fil et ça passe).
  const aDebut = angle(0);
  const aFin = angle(N - 1);
  const pastille = useAnimatedStyle(() => {
    const a = interpolate(pos.value, [0, N - 1], [aDebut, aFin]);
    return {
      transform: [{ translateX: cx + r * Math.sin(a) - 42 }, { translateY: cy - r * Math.cos(a) - 24 }, { rotate: `${a}rad` }],
    };
  });

  // Glisser le doigt le long du ruban balaie les coachs (le plus proche de l'angle du doigt).
  const balayage = Gesture.Pan()
    .runOnJS(true)
    .minDistance(6)
    .onUpdate((e) => {
      const a = Math.atan2(e.x - cx, cy - e.y);
      let k = 0;
      for (let j = 1; j < N; j++) if (Math.abs(angle(j) - a) < Math.abs(angle(k) - a)) k = j;
      if (k !== index) onChoix(k);
    });

  return (
    <GestureDetector gesture={balayage}>
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
        <Animated.View pointerEvents="none" style={[styles.pastilleArc, { borderColor: alpha(colors.text, 0.3), shadowColor: choisi }, pastille]} />
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
    </GestureDetector>
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

  // Cascade : titre, puis bloc du bas, puis le ruban qui monte du bord.
  const entreeTete = useEntree(380, 14);
  const entreeBas = useEntree(700, 14);
  const entreeRuban = useEntree(940, 90);
  const taille = Math.min(width * 0.82, height * 0.36);
  const continuer = () => {
    if (!depuisProfil) return router.push('/onboarding/engagement');
    toast('Programme de ' + c.nom + ' créé');
    router.dismissAll();
    router.navigate('/programme');
  };

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.haut}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/bienvenue'))}
            style={styles.rond}
          >
            <Icon name="left" size={20} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Comparer les ${N} coachs`} onPress={() => setComparer(true)} style={styles.rond}>
            <Icon name="sliders" size={18} />
          </Pressable>
        </View>

        <Animated.View style={[styles.tete, entreeTete]}>
          <Text weight="medium" style={styles.salut}>
            {name ? `Salut ${name} 👋` : 'Salut 👋'}
          </Text>
          <Text style={styles.title}>Quelle personnalité de coach préfères-tu{'\u00a0'}?</Text>
        </Animated.View>

        <GestureDetector gesture={geste}>
          <View style={styles.scene}>
            {COACHES.map((x, i) => (
              <Mascotte key={x.id} c={x} i={i} pos={pos} taille={taille} souffle={souffle} />
            ))}
            {/* Le panneau, posé juste sous le visage du coach. */}
            <View pointerEvents="none" style={[styles.bulleZone, { top: HAUT_MASCOTTE + taille * 0.5 }]}>
              <BulleCoach c={c} />
            </View>
          </View>
        </GestureDetector>

        <Animated.View style={[styles.bas, entreeBas]}>
          <View style={styles.nomBloc}>
            <Text style={[styles.nom, { color: c.c }]}>{c.nom}</Text>
            {reco && (
              <Text weight="semibold" style={styles.recoTxt}>
                Recommandé pour toi
              </Text>
            )}
          </View>
          <Reflet cle={c.id}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={depuisProfil ? `Choisir ${c.nom}` : `Continuer avec ${c.nom}`}
              onPress={continuer}
              style={({ pressed }) => [styles.blanc, { shadowColor: c.c }, pressed && styles.blancPresse]}
            >
              <LinearGradient colors={[colors.text, ui.text2]} style={StyleSheet.absoluteFill} />
              <Text weight="bold" style={[styles.blancTxt, styles.devant]}>
                {depuisProfil ? `Choisir ${c.nom}` : 'Continuer'}
              </Text>
              <View style={styles.devant}>
                <Icon name="arrow" size={17} color={colors.onPrimary} />
              </View>
            </Pressable>
          </Reflet>
          <View style={styles.aide}>
            <Icon name="swap" size={14} color={colors.textTertiary} />
            <Text weight="medium" style={styles.aideTxt}>
              Glisse pour choisir ton coach
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={entreeRuban}>
          <Ruban index={idx} pos={pos} onChoix={choisir} />
        </Animated.View>

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
  root: { flex: 1, backgroundColor: colors.bgAlt },
  haut: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4 },
  rond: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.text, 0.08) },
  mascotte: { alignItems: 'center', paddingTop: HAUT_MASCOTTE },
  reflet: { transform: [{ scaleY: -1 }], opacity: 0.5 },
  blanc: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: 32,
    borderRadius: 26,
    overflow: 'hidden',
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  blancPresse: { transform: [{ translateY: 2 }, { scale: 0.98 }] },
  devant: { zIndex: 1 },
  blancTxt: { fontSize: 17, lineHeight: 22, color: colors.onPrimary },
  flex: { flex: 1 },
  centre: { alignItems: 'center', justifyContent: 'center' },
  tete: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 2 },
  salut: { fontSize: 15, lineHeight: 20, color: colors.textSecondary },
  title: { ...fonts.bold, fontSize: 25, lineHeight: 31, textAlign: 'center', marginTop: 6 },
  scene: { flex: 1, minHeight: 260 },
  bulleZone: { position: 'absolute', left: 26, right: 26, zIndex: 20 },
  bulle: {
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: alpha(colors.surface, 0.8),
    borderWidth: 1,
    borderColor: alpha(colors.text, 0.08),
    minHeight: 74,
    justifyContent: 'center',
  },
  pointe: { position: 'absolute', top: -11, alignSelf: 'center' },
  pense: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  penseTxt: { fontSize: 15, lineHeight: 20, color: colors.textSecondary },
  replique: { fontSize: 17, lineHeight: 24, color: colors.text },
  bas: { paddingHorizontal: 20, paddingTop: 8, gap: 16 },
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
  recoTxt: { fontSize: 13, lineHeight: 17, color: colors.textSecondary },
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
