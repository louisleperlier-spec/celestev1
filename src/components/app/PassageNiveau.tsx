import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Polygon, Stop, Text as SvgText } from 'react-native-svg';

import { Glow, Icon, Text } from '@/components/ui';
import { rankOf } from '@/lib/xp';
import { fermerFete, vibrerFete, type Fete } from '@/store/jeu';
import { useProfil } from '@/store/profil';
import { alpha, colors, fonts } from '@/theme';
import { t } from '@/i18n';

/**
 * Passage de niveau (design Process « v2-level-up », porté de SwiftUI, nov. 2026) : champ d'étoiles, hexagone du niveau qui bascule
 * de l'ancien au nouveau (saut, inclinaison, rebond), halo qui s'allume, onde fine, gerbe d'étincelles, titre révélé, rang
 * débloqué, gains, puis Continuer en verre. Une seule progression par piste (Reanimated, sur le fil d'interface).
 */
const GEMME = 168;
const HALO = 320;
const ETINCELLES = 36;
const ANGLE_OR = 2.399963229728653;

/** Bruit déterministe 0…1 (même placement à chaque fois). */
const bruit = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function Hexagone({ n, couleur, taille }: { n: number; couleur: string; taille: number }) {
  const h = taille / 2;
  const pts = `${h},0 ${taille},${taille / 4} ${taille},${(taille * 3) / 4} ${h},${taille} 0,${(taille * 3) / 4} 0,${taille / 4}`;
  return (
    <Svg width={taille} height={taille} viewBox={`0 0 ${taille} ${taille}`}>
      <Defs>
        <LinearGradient id="facette" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={0.55} />
          <Stop offset="0.45" stopColor={couleur} stopOpacity={1} />
          <Stop offset="1" stopColor={couleur} stopOpacity={0.75} />
        </LinearGradient>
      </Defs>
      <Polygon points={pts} fill="url(#facette)" />
      <Polygon points={pts} fill="none" stroke="#ffffff" strokeOpacity={0.6} strokeWidth={2} />
      <SvgText x={h} y={h + taille * 0.14} fontSize={taille * 0.4} fontWeight={fonts.black.fontWeight} fill={colors.onPrimary} textAnchor="middle">
        {n}
      </SvgText>
    </Svg>
  );
}

function Etoile({ x, y, r, phase, t }: { x: number; y: number; r: number; phase: number; t: SharedValue<number> }) {
  const st = useAnimatedStyle(() => ({ opacity: 0.15 + 0.6 * (0.5 + 0.5 * Math.sin(t.value * Math.PI * 2 + phase)) }));
  return <Animated.View style={[{ position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: r / 2, backgroundColor: colors.text }, st]} />;
}

function Etincelle({ k, p, couleur }: { k: number; p: SharedValue<number>; couleur: string }) {
  const j = bruit(k, k * 7);
  const angle = k * ANGLE_OR + j * 0.6;
  const vitesse = (0.42 + 0.58 * j) * (HALO / 2);
  const taille = 4 + 4 * j;
  const st = useAnimatedStyle(() => {
    const u = p.value;
    const trajet = 1 - Math.pow(1 - u, 2.2);
    return {
      opacity: u <= 0 || u >= 1 ? 0 : Math.pow(1 - u, 1.6),
      transform: [{ translateX: Math.cos(angle) * vitesse * trajet }, { translateY: Math.sin(angle) * vitesse * trajet + 34 * u * u }, { scale: 1 - 0.5 * u }],
    };
  });
  return (
    <Animated.View
      style={[{ position: 'absolute', left: HALO / 2 - taille / 2, top: HALO / 2 - taille / 2, width: taille, height: taille, borderRadius: taille / 2, backgroundColor: k % 3 === 0 ? colors.text : couleur }, st]}
    />
  );
}

export function PassageNiveau({ f, niveau }: { f: Fete; niveau: number }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduit = useReducedMotion();
  const aOuvrir = useProfil((s) => s.jeu.paquets.length);
  const [nom, couleur] = rankOf(niveau);
  const rangChange = niveau > 1 && rankOf(niveau - 1)[0] !== nom;

  const [etoiles] = useState(() =>
    Array.from({ length: 56 }, (_, k) => ({ x: bruit(k, 1) * width, y: bruit(k, 2) * height * 0.8, r: 1 + bruit(k, 3) * 2, phase: bruit(k, 4) * 6.28 })),
  );

  const ciel = useSharedValue(0);
  const fond = useSharedValue(0);
  const echange = useSharedValue(0);
  const echelle = useSharedValue(1);
  const saut = useSharedValue(0);
  const incline = useSharedValue(0);
  const halo = useSharedValue(0.35);
  const onde = useSharedValue(0);
  const gerbe = useSharedValue(0);
  const texte = useSharedValue(0);
  const bouton = useSharedValue(0);

  useEffect(() => {
    ciel.value = withRepeat(withTiming(1, { duration: 4000, easing: Easing.linear }), -1, false);
    fond.value = withTiming(1, { duration: 240 });
    if (reduit) {
      echange.value = 1;
      halo.value = withTiming(0.55, { duration: 300 });
      texte.value = withTiming(1, { duration: 300 });
      bouton.value = withDelay(400, withTiming(1, { duration: 200 }));
      return;
    }
    const D = 900;
    const a = 200; // départ après le voile
    echange.value = withDelay(a, withTiming(1, { duration: 0.26 * D, easing: Easing.inOut(Easing.cubic) }));
    echelle.value = withDelay(
      a,
      withSequence(
        withTiming(1.38, { duration: 0.18 * D, easing: Easing.out(Easing.back(2)) }),
        withTiming(0.9, { duration: 0.16 * D }),
        withTiming(1.07, { duration: 0.2 * D }),
        withSpring(1, { damping: 12, stiffness: 160 }),
      ),
    );
    saut.value = withDelay(a, withSequence(withTiming(-28, { duration: 0.26 * D, easing: Easing.out(Easing.cubic) }), withTiming(8, { duration: 0.22 * D }), withSpring(0, { damping: 9 })));
    incline.value = withDelay(
      a,
      withSequence(withTiming(0, { duration: 0.08 * D }), withTiming(-9, { duration: 0.16 * D }), withTiming(6, { duration: 0.16 * D }), withSpring(0, { damping: 10 })),
    );
    halo.value = withDelay(a, withSequence(withTiming(1, { duration: 0.14 * D }), withTiming(0.45, { duration: 0.5 * D }), withTiming(0.35, { duration: 0.26 * D })));
    onde.value = withDelay(a, withTiming(1, { duration: 0.6 * D, easing: Easing.out(Easing.quad) }));
    gerbe.value = withDelay(a + D, withTiming(1, { duration: 1100, easing: Easing.linear }));
    texte.value = withDelay(a + D, withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }));
    bouton.value = withDelay(a + D + 900, withSpring(1, { damping: 14, stiffness: 180 }));
    const t = setTimeout(vibrerFete, a + D * 0.5);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stFond = useAnimatedStyle(() => ({ opacity: fond.value }));
  const stGemme = useAnimatedStyle(() => ({
    transform: [{ translateY: saut.value }, { rotate: `${incline.value}deg` }, { scale: echelle.value }],
  }));
  const stAncienne = useAnimatedStyle(() => ({ opacity: 1 - echange.value, transform: [{ perspective: 800 }, { rotateY: `${-70 * echange.value}deg` }] }));
  const stNouvelle = useAnimatedStyle(() => ({ opacity: echange.value, transform: [{ perspective: 800 }, { rotateY: `${70 * (1 - echange.value)}deg` }] }));
  const stHalo = useAnimatedStyle(() => ({ opacity: 0.35 + 0.65 * halo.value, transform: [{ scale: 0.92 + 0.2 * halo.value }] }));
  const stOnde = useAnimatedStyle(() => ({
    opacity: onde.value > 0.001 ? Math.pow(1 - onde.value, 1.5) : 0,
    transform: [{ scale: onde.value }],
  }));
  const stTexte = useAnimatedStyle(() => ({ opacity: texte.value, transform: [{ translateY: (1 - texte.value) * 12 }] }));
  const stEspacement = useAnimatedStyle(() => ({ letterSpacing: interpolate(texte.value, [0, 1], [8, 4.2], Extrapolation.CLAMP) }));
  const stBouton = useAnimatedStyle(() => ({ opacity: bouton.value, transform: [{ scale: 0.92 + 0.08 * bouton.value }] }));

  const ouvrir = () => {
    fermerFete();
    router.push('/cartes/ouvrir');
  };

  return (
    <Animated.View style={[styles.racine, stFond]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {etoiles.map((e, k) => (
          <Etoile key={k} {...e} t={ciel} />
        ))}
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={fermerFete} style={[styles.fermer, { top: insets.top + 8 }]}>
        <Icon name="x" size={18} color={colors.text} />
      </Pressable>

      <View style={styles.scene} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Animated.View style={[StyleSheet.absoluteFill, styles.centre, stHalo]}>
          <Glow width={HALO} height={HALO} color={couleur} intensity={0.75} />
        </Animated.View>
        <Animated.View style={[styles.onde, { borderColor: alpha(couleur, 0.9) }, stOnde]} />
        <Animated.View style={stGemme}>
          <View style={styles.gemme}>
            <Animated.View style={[StyleSheet.absoluteFill, styles.centre, stAncienne]}>
              <Hexagone n={Math.max(1, niveau - 1)} couleur={couleur} taille={GEMME} />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, styles.centre, stNouvelle]}>
              <Hexagone n={niveau} couleur={couleur} taille={GEMME} />
            </Animated.View>
          </View>
        </Animated.View>
        {Array.from({ length: ETINCELLES }, (_, k) => (
          <Etincelle key={k} k={k} p={gerbe} couleur={couleur} />
        ))}
      </View>

      <Animated.View style={[styles.texte, stTexte]} accessible accessibilityLabel={`Niveau ${niveau} atteint. Rang ${nom}.`}>
        <Text weight="bold" style={styles.titre}>
          Niveau {niveau}
        </Text>
        <Animated.Text style={[styles.rang, stEspacement]}>{t('RANG {0}').replace('{0}', t(nom).toUpperCase())}</Animated.Text>
        {rangChange && (
          <View style={[styles.puce, { backgroundColor: alpha(couleur, 0.16), borderColor: alpha(couleur, 0.38) }]}>
            <Text weight="bold" style={[styles.puceTxt, { color: couleur }]}>
              ✨ Rang {nom} débloqué
            </Text>
          </View>
        )}
        <Text style={styles.sous}>{f.sous}</Text>
        {f.gains.length > 0 && (
          <View style={styles.gains}>
            {f.gains.map((g) => (
              <View key={g} style={styles.gain}>
                <Text weight="semibold" style={styles.gainTxt}>
                  {g}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Animated.View>

      <Animated.View style={[styles.bas, { paddingBottom: insets.bottom + 24 }, stBouton]}>
        <Pressable accessibilityRole="button" onPress={aOuvrir > 0 ? ouvrir : fermerFete} style={({ pressed }) => [styles.verre, pressed && styles.presse]}>
          <Text weight="semibold" style={styles.verreTxt}>
            {aOuvrir > 0 ? 'Ouvrir mes cartes' : 'Continuer'}
          </Text>
        </Pressable>
        {aOuvrir > 0 && (
          <Pressable accessibilityRole="button" onPress={fermerFete} style={styles.plusTard}>
            <Text style={styles.plusTardTxt}>Plus tard</Text>
          </Pressable>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  racine: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  centre: { alignItems: 'center', justifyContent: 'center' },
  fermer: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: alpha(colors.text, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  scene: { width: HALO, height: HALO, alignItems: 'center', justifyContent: 'center', marginTop: -40 },
  onde: { position: 'absolute', width: HALO, height: HALO, borderRadius: HALO / 2, borderWidth: 1.5 },
  gemme: { width: GEMME, height: GEMME },
  texte: { alignItems: 'center', paddingHorizontal: 32 },
  titre: { fontSize: 44, lineHeight: 52, letterSpacing: -0.5, textAlign: 'center' },
  rang: { ...fonts.semibold, fontSize: 15, lineHeight: 20, color: colors.textSecondary, marginTop: 6 },
  puce: { marginTop: 14, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  puceTxt: { fontSize: 11, lineHeight: 14, letterSpacing: 1.4 },
  sous: { fontSize: 14, lineHeight: 20, color: alpha(colors.text, 0.72), textAlign: 'center', marginTop: 16 },
  gains: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 14 },
  gain: { backgroundColor: alpha(colors.text, 0.08), borderRadius: 100, paddingVertical: 7, paddingHorizontal: 12 },
  gainTxt: { fontSize: 13, lineHeight: 17, color: colors.pinkLight },
  bas: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  verre: {
    paddingHorizontal: 34,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: alpha(colors.text, 0.14),
    borderWidth: 1,
    borderColor: alpha(colors.text, 0.22),
  },
  verreTxt: { fontSize: 17, lineHeight: 22 },
  presse: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  plusTard: { paddingVertical: 12 },
  plusTardTxt: { fontSize: 15, lineHeight: 20, color: colors.textSecondary },
});
