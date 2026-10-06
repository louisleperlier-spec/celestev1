import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';

import { Button, Glow, Text } from '@/components/ui';
import { COACH_IMAGES } from '@/data';
import { MASCOTTE_IMAGES } from '@/data/images';
import { SUCCES_IMAGES, SUCCES_RATIO } from '@/data/succesImages';
import { fermerFete, useFetes, vibrerFete, type Fete as FeteT } from '@/store/jeu';
import { useProfil } from '@/store/profil';
import { colors, fonts, ui } from '@/theme';

const N = 40;

type Bout = { x: number; dx: number; retard: number; tours: number; w: number; h: number; c: string };

/** Un confetti qui tombe en tournant (progression commune `t`). */
function Morceau({ m, t, haut }: { m: Bout; t: SharedValue<number>; haut: number }) {
  const st = useAnimatedStyle(() => {
    const p = interpolate(t.value, [0, m.retard, 1], [0, 0, 1], Extrapolation.CLAMP);
    return {
      opacity: interpolate(p, [0, 0.85, 1], [1, 1, 0]),
      transform: [{ translateY: p * haut }, { translateX: p * m.dx }, { rotate: `${p * m.tours * 360}deg` }],
    };
  });
  return <Animated.View style={[{ position: 'absolute', left: m.x, top: -30, width: m.w, height: m.h, borderRadius: 2, backgroundColor: m.c }, st]} />;
}

/** Pluie de confettis. */
function Confettis() {
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);
  const [morceaux] = useState<Bout[]>(() =>
    Array.from({ length: N }, (_, k) => ({
      x: Math.random() * width,
      dx: (Math.random() - 0.5) * 120,
      retard: Math.random() * 0.35,
      tours: (Math.random() < 0.5 ? -1 : 1) * (1 + Math.random() * 2),
      w: 6 + Math.random() * 6,
      h: 10 + Math.random() * 8,
      c: ui.confettis[k % ui.confettis.length],
    })),
  );
  useEffect(() => {
    t.value = withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) });
  }, [t]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {morceaux.map((m, k) => (
        <Morceau key={k} m={m} t={t} haut={height * 0.9} />
      ))}
    </View>
  );
}

/** Contenu d'une fête : coach, titre, gains, « Ouvrir mes cartes ». */
function Contenu({ f }: { f: FeteT }) {
  const coach = useProfil((s) => s.coach);
  const aOuvrir = useProfil((s) => s.jeu.paquets.length);
  const s = useSharedValue(0);
  useEffect(() => {
    vibrerFete();
    s.value = withSpring(1, { damping: 9, stiffness: 120 });
  }, [s]);
  const st = useAnimatedStyle(() => ({ opacity: Math.min(1, s.value), transform: [{ scale: 0.7 + 0.3 * s.value }] }));
  return (
    <View style={styles.voile}>
      <Confettis />
      <Animated.View style={[styles.boite, st]}>
        {f.succes ? (
          <View style={styles.succes}>
            <Glow width={260} height={300} intensity={0.6} />
            <Image source={SUCCES_IMAGES[f.succes]} style={styles.succesImg} contentFit="contain" />
          </View>
        ) : (
          <View style={styles.coach}>
            <Glow width={220} height={200} intensity={0.55} />
            <Image source={f.mascotte ? MASCOTTE_IMAGES[f.mascotte] : COACH_IMAGES[coach].corps} style={styles.coachImg} contentFit="contain" />
          </View>
        )}
        <Text style={styles.emoji}>{f.emoji}</Text>
        <Text style={styles.titre}>{f.titre}</Text>
        <Text style={styles.sous}>{f.sous}</Text>
        <View style={styles.gains}>
          {f.gains.map((g) => (
            <View key={g} style={styles.gain}>
              <Text weight="semibold" style={styles.gainTxt}>
                {g}
              </Text>
            </View>
          ))}
        </View>
        {aOuvrir > 0 ? (
          <>
            <Button
              label="Ouvrir mes cartes"
              iconAfter="arrow"
              onPress={() => {
                fermerFete();
                router.push('/cartes/ouvrir');
              }}
              style={styles.btn}
            />
            <Button label="Plus tard" variant="dark" onPress={fermerFete} style={styles.btn2} />
          </>
        ) : (
          <Button label="Trop bien !" onPress={fermerFete} style={styles.btn} />
        )}
      </Animated.View>
    </View>
  );
}

/** Fêtes du jeu (records, niveaux, défis), l'une après l'autre, par-dessus l'app. */
export function FeteHost() {
  const f = useFetes((s) => s.file[0]);
  if (!f) return null;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={fermerFete}>
      <Contenu key={f.id} f={f} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  voile: { flex: 1, backgroundColor: ui.voileFete, alignItems: 'center', justifyContent: 'center', padding: 24 },
  boite: { width: '100%', maxWidth: 380, backgroundColor: colors.surface, borderRadius: 28, padding: 22, alignItems: 'center' },
  coach: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginTop: -90 },
  coachImg: { width: 150, height: 170 },
  succes: { width: 200, height: 240, alignItems: 'center', justifyContent: 'center', marginTop: -150 },
  succesImg: { width: 140, height: 140 / SUCCES_RATIO },
  emoji: { fontSize: 34, lineHeight: 42, marginTop: 4 },
  titre: { ...fonts.bold, fontSize: 28, lineHeight: 34, textAlign: 'center', marginTop: 2 },
  sous: { fontSize: 15, lineHeight: 21, color: colors.textSecondary, textAlign: 'center', marginTop: 6 },
  gains: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 14 },
  gain: { backgroundColor: ui.selFond, borderRadius: 100, paddingVertical: 7, paddingHorizontal: 12 },
  gainTxt: { fontSize: 13, lineHeight: 17, color: colors.pinkLight },
  btn: { alignSelf: 'stretch', marginTop: 18 },
  btn2: { alignSelf: 'stretch', marginTop: 8 },
});
