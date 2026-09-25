import MaskedView from '@react-native-masked-view/masked-view';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Platform, ScrollView, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { Button, RadialBackground, Text } from '@/components/ui';
import { DECO_IMAGES, VIDEO_ACCUEIL } from '@/data';
import { colors, fonts } from '@/theme';

/** Fond .wel : halo rose au centre et violet en haut à gauche. */
const FOND = [
  { rx: 90, ry: 55, cx: 50, cy: 35, color: 'rgba(255,79,163,0.22)' },
  { rx: 40, ry: 30, cx: 15, cy: 20, color: 'rgba(120,60,255,0.18)' },
] as const;

/** Accueil (vWelcome du prototype). */
export default function Bienvenue() {
  const { width } = useWindowDimensions();
  const videoW = Math.min(width, 440);
  const videoH = (videoW * 680) / 720;
  const player = useVideoPlayer(VIDEO_ACCUEIL, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  // L'image fixe d'Axel reste visible tant que la vidéo n'est pas prête (poster du prototype).
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  const video = (
    <>
      <Image source={DECO_IMAGES.pAxel} style={StyleSheet.absoluteFill} contentFit="cover" />
      <VideoView
        player={player}
        style={[StyleSheet.absoluteFill, status !== 'readyToPlay' && styles.hidden]}
        contentFit="cover"
        nativeControls={false}
        accessibilityLabel="Axel, la mascotte NÉA, animé"
      />
    </>
  );

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

          {/* Vidéo d'Axel, bords fondus (mask radial-gradient du prototype). */}
          {Platform.OS === 'web' ? (
            <View style={[{ width: videoW, height: videoH }, styles.video, MASQUE_WEB]}>{video}</View>
          ) : (
            <MaskedView
              style={[{ width: videoW, height: videoH }, styles.video]}
              maskElement={<MasqueRadial width={videoW} height={videoH} />}
            >
              {video}
            </MaskedView>
          )}

          <View style={styles.pad}>
            <Text style={styles.h1}>
              {"PLUS QU'UN PROGRAMME.\n"}
              <Text style={[styles.h1, styles.pk]}>UN COACH QUI TE CONNAÎT VRAIMENT.</Text>
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

/** Sur le web, MaskedView n'existe pas : on reprend le masque CSS du prototype (.hv). */
const GRADIENT_MASQUE = 'radial-gradient(ellipse 62% 60% at 50% 50%, #000 30%, rgba(0,0,0,.6) 60%, transparent 100%)';
const MASQUE_WEB = { maskImage: GRADIENT_MASQUE, WebkitMaskImage: GRADIENT_MASQUE } as unknown as ViewStyle;

/** Opaque au centre, transparent sur les bords : ellipse 62 % × 60 %. */
function MasqueRadial({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height}>
      <Defs>
        <RadialGradient id="masque" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0.3" stopColor="#000" stopOpacity={1} />
          <Stop offset="0.6" stopColor="#000" stopOpacity={0.6} />
          <Stop offset="1" stopColor="#000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={width / 2} cy={height / 2} rx={width * 0.62} ry={height * 0.6} fill="url(#masque)" />
    </Svg>
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
  h1: { fontFamily: fonts.black, fontSize: 27, lineHeight: 28.6, letterSpacing: -0.27 },
  pk: { color: colors.pink },
  sub: { color: colors.textSecondary, fontSize: 14, lineHeight: 19.6, marginTop: 6 },
  foot: { paddingTop: 12, paddingHorizontal: 20, paddingBottom: 18 },
  hidden: { opacity: 0 },
  mt10: { marginTop: 10 },
  video: { alignSelf: 'center', overflow: 'hidden' },
  tag: { fontSize: 12, lineHeight: 16, color: colors.textSecondary, textAlign: 'center', marginTop: 12 },
});
