import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Glow, Text } from '@/components/ui';
import { alpha } from '@/theme';

/**
 * Pièces du design 10K « Choix du coach » (v2-onboarding-coach, SwiftUI) portées en React Native :
 * l'orbe qui réfléchit (SiriOrbView), la réplique révélée en vague (CoachRevealText), le reflet qui balaie Continuer.
 */

/** Teintes du halo de l'orbe (rose, violet, bleu, orange), comme `SiriOrbView.accents`. */
const ACCENTS = ['#FF70B5', '#8F6BFF', '#3D59FF', '#FF9E42'] as const;
const POINTS = 8;

/** Un point de l'anneau : sa taille et son opacité suivent une vague qui tourne. */
function Point({ i, t, rayon, taille }: { i: number; t: SharedValue<number>; rayon: number; taille: number }) {
  const angle = (i / POINTS) * 2 * Math.PI;
  const style = useAnimatedStyle(() => {
    const tete = t.value * 2 * Math.PI;
    const vague = Math.pow((Math.cos(angle - tete) + 1) / 2, 1.6);
    const d = taille * (0.075 + 0.07 * vague);
    return {
      width: d,
      height: d,
      borderRadius: d / 2,
      opacity: 0.35 + 0.65 * vague,
      transform: [{ translateX: Math.cos(angle - Math.PI / 2) * rayon - d / 2 }, { translateY: Math.sin(angle - Math.PI / 2) * rayon - d / 2 }],
    };
  });
  return <Animated.View style={[styles.point, style]} />;
}

/** Une tache colorée du halo, qui tourne lentement derrière l'anneau. */
function Tache({ i, t, rayon, taille }: { i: number; t: SharedValue<number>; rayon: number; taille: number }) {
  const style = useAnimatedStyle(() => {
    // Le halo tourne 2,7 fois moins vite que la vague (0,7 contre 1,9 dans l'original).
    const a = t.value * 2 * Math.PI * 0.37 + (i * Math.PI) / 2;
    return { transform: [{ translateX: Math.cos(a) * rayon * 0.55 }, { translateY: Math.sin(a) * rayon * 0.55 }] };
  });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Glow width={taille * 1.1} height={taille * 1.1} color={ACCENTS[i]} intensity={0.42} />
    </Animated.View>
  );
}

/** L'orbe « en réflexion » : anneau de 8 points blancs en vague sur un halo multicolore (état `thinking`). */
export function OrbeSiri({ taille = 18 }: { taille?: number }) {
  const reduit = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduit) return;
    // 1,9 tour de vague par seconde en réflexion.
    t.set(withRepeat(withTiming(1, { duration: 1000 / 1.9, easing: Easing.linear }), -1, false));
  }, [reduit, t]);
  const cote = taille * 1.8;
  const rayon = taille * 0.42 * 0.78;
  return (
    <View style={{ width: cote, height: cote }} accessible={false}>
      {ACCENTS.map((_, i) => (
        <Tache key={i} i={i} t={t} rayon={rayon} taille={taille} />
      ))}
      <View style={[StyleSheet.absoluteFill, styles.centre]}>
        {Array.from({ length: POINTS }, (_, i) => (
          <Point key={i} i={i} t={t} rayon={rayon} taille={taille} />
        ))}
      </View>
    </View>
  );
}

/** Libellé qui scintille pendant la réflexion (SiriShimmerText) : l'opacité monte et descend. */
export function TexteScintille({ texte, style }: { texte: string; style: StyleProp<TextStyle> }) {
  const reduit = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!reduit) t.set(withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [reduit, t]);
  const anime = useAnimatedStyle(() => ({ opacity: 0.45 + 0.55 * t.value }));
  return (
    <Animated.View style={anime}>
      <Text weight="medium" style={style}>
        {texte}
      </Text>
    </Animated.View>
  );
}

/** Délai avant d'écrire (la bulle finit de grandir), et durée de la vague selon la longueur (CoachRevealText). */
export const REVELE_DELAI = 300;
export const dureeRevele = (texte: string) => Math.min(Math.max(texte.length * 34, 1200), 6000);
/** Nombre de lettres qui apparaissent en même temps : la vague. */
const FENETRE = 14;

/** Un mot de la réplique : il arrive vite puis se pose (opacité, montée de 7 pt), quand la vague atteint sa 1re lettre. */
function Mot({ mot, debut, total, p, style }: { mot: string; debut: number; total: number; p: SharedValue<number>; style: StyleProp<TextStyle> }) {
  const anime = useAnimatedStyle(() => {
    const tete = p.value * (total + FENETRE);
    const t = Math.min(Math.max((tete - debut) / FENETRE, 0), 1);
    const e = 1 - Math.pow(1 - t, 3);
    return { opacity: e, transform: [{ translateY: (1 - e) * 7 }] };
  });
  return (
    <Animated.View style={anime}>
      <Text weight="medium" style={style}>
        {mot}
      </Text>
    </Animated.View>
  );
}

/** Réplique révélée en vague, mot à mot (le flou par lettre de l'original n'existe pas en React Native). */
export function TexteRevele({ texte, style }: { texte: string; style: StyleProp<TextStyle> }) {
  const reduit = useReducedMotion();
  const p = useSharedValue(reduit ? 1 : 0);
  useEffect(() => {
    if (reduit) return;
    p.set(0);
    p.set(withDelay(REVELE_DELAI, withTiming(1, { duration: dureeRevele(texte), easing: Easing.linear })));
  }, [texte, reduit, p]);
  const mots = texte.split(' ');
  // Indice de la 1re lettre de chaque mot dans la réplique.
  const debuts = mots.map((_, i) => mots.slice(0, i).reduce((n, m) => n + m.length + 1, 0));
  return (
    <View style={styles.mots} accessible accessibilityLabel={texte}>
      {mots.map((m, i) => (
        <Mot key={i} mot={i < mots.length - 1 ? m + ' ' : m} debut={debuts[i]} total={texte.length} p={p} style={style} />
      ))}
    </View>
  );
}

/** Lame de lumière qui traverse un bouton à chaque `cle` (nouveau coach), comme le reflet de Continuer. */
export function Reflet({ cle, children }: { cle: string; children: ReactNode }) {
  const reduit = useReducedMotion();
  const largeur = useSharedValue(0);
  const x = useSharedValue(-0.4);
  useEffect(() => {
    if (reduit) return;
    x.set(-0.4);
    x.set(withDelay(420, withTiming(1.4, { duration: 1050, easing: Easing.inOut(Easing.ease) })));
  }, [cle, reduit, x]);
  const lame = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * largeur.value - largeur.value * 0.18 }, { rotate: '20deg' }] }));
  return (
    <View style={styles.reflet} onLayout={(e: LayoutChangeEvent) => largeur.set(e.nativeEvent.layout.width)}>
      {children}
      <Animated.View pointerEvents="none" style={[styles.lame, lame]}>
        <LinearGradient
          colors={[alpha('#FFFFFF', 0), alpha('#FFFFFF', 0.55), alpha('#FFFFFF', 0)]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { alignItems: 'center', justifyContent: 'center' },
  point: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.9,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 0 },
  },
  mots: { flexDirection: 'row', flexWrap: 'wrap' },
  reflet: { borderRadius: 999, overflow: 'hidden' },
  lame: { position: 'absolute', top: -30, bottom: -30, left: 0, width: '36%' },
});
