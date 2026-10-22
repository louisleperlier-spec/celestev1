import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Glow, RadialBackground, Text } from '@/components/ui';
import { MASCOTTE_IMAGES } from '@/data/images';
import { colors, fonts } from '@/theme';

/** Fond .wel : halo rose au centre et violet en haut à gauche. */
const FOND = [
  { rx: 90, ry: 55, cx: 50, cy: 35, color: 'rgba(255,107,26,0.22)' },
  { rx: 40, ry: 30, cx: 15, cy: 20, color: 'rgba(120,60,255,0.18)' },
] as const;

/** Accueil (vWelcome du prototype). */
export default function Bienvenue() {
  const { width, height } = useWindowDimensions();
  // Hauteur limitée pour que le titre, le texte et les boutons tiennent sans défiler.
  const h = Math.min(height * 0.38, 360);
  const w = (h * 295) / 420;
  // La mascotte flotte doucement (monte, descend, s'étire un peu).
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [t]);
  const flotte = useAnimatedStyle(() => ({ transform: [{ translateY: -10 * t.get() }, { scaleY: 1 + 0.02 * t.get() }] }));

  return (
    <View style={styles.root}>
      <RadialBackground layers={FOND} />
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text weight="light" style={styles.logo}>
            NÉA
          </Text>
          <Text weight="semibold" style={styles.logoSub}>
            COACHING SPORTIF IA
          </Text>

          {/* Mascotte NÉA (remplace la vidéo d'Axel). */}
          <View style={[styles.mascotte, { height: h + 30, width: Math.min(width, 440) }]}>
            <Glow width={Math.min(width, 440)} height={h + 30} intensity={0.55} />
            <Animated.View style={flotte}>
              <Image source={MASCOTTE_IMAGES.face} style={{ width: w, height: h }} contentFit="contain" accessibilityLabel="La mascotte NÉA" />
            </Animated.View>
          </View>

          <View style={styles.pad}>
            <Text style={styles.h1}>
              {"Plus qu'un programme.\n"}
              <Text style={[styles.h1, styles.pk]}>Un coach qui te connaît vraiment.</Text>
            </Text>
            <Text style={styles.sub}>
              Des entraînements personnalisés, une motivation constante et des résultats durables.
            </Text>
          </View>
        </ScrollView>
        <View style={styles.foot}>
          <Button label="Commencer" arrow onPress={() => router.push('/onboarding/prenom')} />
          <Button label="J'ai déjà un compte" variant="dark" onPress={() => router.push({ pathname: '/compte', params: { mode: 'login' } })} style={styles.mt10} />
          <Text style={styles.tag}>Ton meilleur toi, chaque jour.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { paddingBottom: 8 },
  // .logo / .logo-sub
  logo: { fontSize: 42, lineHeight: 50, letterSpacing: 42 * 0.42, paddingLeft: 42 * 0.42, textAlign: 'center', marginTop: 22 },
  logoSub: { fontSize: 10.5, lineHeight: 14, letterSpacing: 10.5 * 0.32, color: colors.pinkLight, textAlign: 'center', marginTop: 4 },
  pad: { paddingHorizontal: 20, marginTop: 22 },
  // .h1
  h1: { ...fonts.black, fontSize: 27, lineHeight: 28.6, letterSpacing: -0.27 },
  pk: { color: colors.pink },
  sub: { color: colors.textSecondary, fontSize: 14, lineHeight: 19.6, marginTop: 6 },
  foot: { paddingTop: 12, paddingHorizontal: 20, paddingBottom: 18 },
  mt10: { marginTop: 10 },
  mascotte: { alignSelf: 'center', alignItems: 'center', justifyContent: 'flex-end', marginTop: 12 },
  tag: { fontSize: 12, lineHeight: 16, color: colors.textSecondary, textAlign: 'center', marginTop: 12 },
});
