import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Updates from 'expo-updates';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glow, Icon, Text } from '@/components/ui';
import { NOUVEAUTES } from '@/lib/nouveautes';
import { inviterApresMaj } from '@/store/note';
import { alpha, colors, fonts } from '@/theme';

const ICONE = require('@/assets/images/icon.png');

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/**
 * Annonce d'une mise à jour (design 10K « Mise à jour d'app », AppUpdateView) : feuille aux coins de 30 qui monte du bas,
 * icône de l'app sur une lueur, titre en gras, ce qui change, bouton en capsule. La version est déjà installée (EAS Update) :
 * on annonce, on ne demande pas de mettre à jour. À la fermeture, invitation à noter NÉA si le moment est bon.
 */
export default function Nouveautes() {
  const insets = useSafeAreaInsets();
  const date = Updates.createdAt;
  const fermer = () => {
    router.back();
    setTimeout(inviterApresMaj, 450);
  };
  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(220)} style={StyleSheet.absoluteFill}>
        <Pressable style={styles.voile} onPress={fermer} accessibilityLabel="Fermer" />
      </Animated.View>
      <Animated.View entering={SlideInDown.springify().damping(20)} style={[styles.feuille, { marginBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.visuel}>
          <Glow width={260} height={150} intensity={0.5} />
          <Image source={ICONE} style={styles.icone} contentFit="cover" />
          <View style={styles.pastille}>
            <Text weight="bold" style={styles.pastilleTxt}>
              Nouveau
            </Text>
          </View>
        </View>

        <View style={styles.textes}>
          <Text weight="bold" style={styles.titre} accessibilityRole="header">
            NÉA a été mis à jour
          </Text>
          <Text style={styles.sous}>
            {date ? `Ta version du ${date.getDate()} ${MOIS[date.getMonth()]} est installée. ` : 'Ta nouvelle version est installée. '}
            Voici ce qui change :
          </Text>
        </View>

        <View style={styles.liste}>
          {NOUVEAUTES.map((n, i) => (
            <Animated.View key={n.titre} entering={FadeInDown.delay(180 + i * 90).duration(380)} style={styles.point}>
              <View style={styles.pointIcone}>
                <Icon name={n.icone} size={18} color={colors.pink} strokeWidth={2} />
              </View>
              <View style={styles.pointTextes}>
                <Text weight="semibold" style={styles.pointTitre}>
                  {n.titre}
                </Text>
                <Text style={styles.pointTexte}>{n.texte}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        <Pressable accessibilityRole="button" onPress={fermer} style={({ pressed }) => [styles.bouton, pressed && styles.boutonPresse]}>
          <Text weight="semibold" style={styles.boutonTxt}>
            C&apos;est parti
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  voile: { flex: 1, backgroundColor: alpha(colors.bgAlt, 0.62) },
  feuille: {
    marginHorizontal: 10,
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 0.6,
    borderColor: alpha(colors.text, 0.1),
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    gap: 15,
  },
  visuel: { height: 132, alignItems: 'center', justifyContent: 'center' },
  icone: { width: 96, height: 96, borderRadius: 26, borderWidth: 0.6, borderColor: alpha(colors.text, 0.16) },
  pastille: {
    position: 'absolute',
    top: 10,
    left: '50%',
    marginLeft: 30,
    paddingHorizontal: 9,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    backgroundColor: colors.pink,
    transform: [{ rotate: '8deg' }],
  },
  pastilleTxt: { fontSize: 12, lineHeight: 15, color: colors.onPrimary },
  textes: { gap: 8, paddingHorizontal: 6 },
  titre: { fontSize: 26, lineHeight: 32, letterSpacing: -0.4, textAlign: 'center' },
  sous: { fontSize: 15, lineHeight: 20, color: colors.textSecondary, textAlign: 'center' },
  liste: { gap: 12, paddingVertical: 4 },
  point: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  pointIcone: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.pink, 0.14) },
  pointTextes: { flex: 1, gap: 1 },
  pointTitre: { fontSize: 15, lineHeight: 20 },
  pointTexte: { fontSize: 13, lineHeight: 17.5, color: colors.textSecondary },
  bouton: { height: 52, borderRadius: 26, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  boutonPresse: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  boutonTxt: { ...fonts.semibold, fontSize: 17, lineHeight: 22, color: colors.onPrimary },
});
