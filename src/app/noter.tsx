import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { G, Path } from 'react-native-svg';

import { BigNumber, Icon, Text, type IconName } from '@/components/ui';
import { COACH_IMAGES } from '@/data/images';
import type { CoachId } from '@/data/types';
import { serie } from '@/lib/gel';
import { lvlInfo } from '@/lib/xp';
import { noter } from '@/store/note';
import { useProfil } from '@/store/profil';
import { alpha, colors, fonts } from '@/theme';

const CONTACT = 'mailto:nea.coach.app@gmail.com?subject=' + encodeURIComponent('Mon avis sur NÉA');
const COACHS: CoachId[] = ['nova', 'axel', 'kai'];

/**
 * « Aide NÉA à grandir » (design 10K « Demande d'avis », maquette de l'utilisateur) : lauriers autour de 5 étoiles, titre,
 * les 3 coachs, ton parcours dans NÉA en cartes qui défilent (tes vrais chiffres, jamais de faux avis), « Pas satisfait ?
 * Écris-nous », bouton blanc « Noter NÉA » (fenêtre native d'Apple, sinon la page « Écrire un avis »). La croix = plus tard.
 */
export default function Noter() {
  const p = useProfil();
  const fermer = () => (router.canGoBack() ? router.back() : router.replace('/accueil'));
  const valider = () => {
    void noter();
    fermer();
  };
  const jamais = () => {
    useProfil.setState({ avisFini: true });
    fermer();
  };

  const nbCartes = Object.keys(p.jeu.cartes).length;
  const jours = serie(p);
  type Repere = { icone: IconName; valeur: number; unite: string; texte: string };
  const reperes: Repere[] = [
    { icone: 'check', valeur: p.logs.length, unite: p.logs.length > 1 ? 'activités' : 'activité', texte: 'terminées avec NÉA' },
    { icone: 'flame', valeur: jours, unite: jours > 1 ? 'jours' : 'jour', texte: 'de série en ce moment' },
    { icone: 'hexa', valeur: lvlInfo(p.xp).n, unite: '', texte: 'ton niveau dans NÉA' },
    { icone: 'cadeau', valeur: nbCartes, unite: nbCartes > 1 ? 'cartes' : 'carte', texte: 'dans ta collection' },
  ];
  const parcours = reperes.filter((c) => c.valeur > 0);

  return (
    <View style={styles.root}>
      {/* Fond presque noir qui se réchauffe vers l'orange en bas, comme le paywall. */}
      <LinearGradient
        colors={[colors.bgAlt, colors.bgAlt, alpha(colors.pink, 0.05), alpha(colors.pink, 0.14), alpha(colors.pink, 0.22)]}
        locations={[0, 0.35, 0.6, 0.85, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.haut}>
          <Pressable accessibilityRole="button" accessibilityLabel="Plus tard" onPress={fermer} style={styles.croix} hitSlop={8}>
            <Icon name="x" size={16} strokeWidth={2.4} />
          </Pressable>
        </View>

        <View style={styles.corps}>
          <Lauriers />

          <Animated.View entering={FadeInDown.delay(250).duration(450)} style={styles.textes}>
            <Text weight="bold" style={styles.titre} accessibilityRole="header">
              Aide <Text weight="bold" style={[styles.titre, styles.orange]}>NÉA</Text> à grandir
            </Text>
            <Text style={styles.sous}>Mets 5 étoiles à NÉA pour aider plus de monde à devenir la meilleure version d&apos;eux-mêmes.</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(350).duration(450)} style={styles.coachs}>
            <View style={styles.tetes}>
              {COACHS.map((c, i) => (
                <View key={c} style={[styles.tete, i > 0 && styles.teteDecalee, { zIndex: 3 - i }]}>
                  <Image source={COACH_IMAGES[c].tete} style={styles.teteImg} contentFit="contain" />
                </View>
              ))}
            </View>
            <Text weight="medium" style={styles.coachsTxt}>
              Nova, Axel et Kai comptent sur toi
            </Text>
          </Animated.View>
        </View>

        {parcours.length > 0 && (
          <Animated.View entering={FadeInDown.delay(450).duration(450)}>
            <Text weight="semibold" style={styles.parcoursTitre}>
              Ton parcours avec NÉA
            </Text>
            <Defilant fixe={parcours.length < 3}>
              {parcours.map((c) => (
                <View key={c.icone} style={styles.carte}>
                  <View style={styles.carteIcone}>
                    <Icon name={c.icone} size={17} color={colors.pink} strokeWidth={2.1} />
                  </View>
                  <BigNumber value={c.valeur} unit={c.unite} size={30} unitSize={14} style={styles.chiffre} />
                  <Text style={styles.carteTxt}>{c.texte}</Text>
                </View>
              ))}
            </Defilant>
          </Animated.View>
        )}

        <View style={styles.bas}>
          <Text style={styles.contact}>
            Pas satisfait ?{' '}
            <Text weight="semibold" style={styles.contactLien} onPress={() => void Linking.openURL(CONTACT)}>
              Écris-nous
            </Text>
          </Text>
          <View style={styles.ctaZone}>
            <View pointerEvents="none" style={styles.ctaHalo} />
            <Pressable accessibilityRole="button" onPress={valider} style={({ pressed }) => [styles.cta, pressed && styles.ctaPresse]}>
              <Text weight="bold" style={styles.ctaTxt}>
                Noter NÉA
              </Text>
            </Pressable>
          </View>
          <Text style={styles.jamais} onPress={jamais} accessibilityRole="button">
            Ne plus me demander
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

/** Feuille de laurier dessinée vers le haut depuis son pied (0, 0). */
const FEUILLE = 'M0 0 C 6 -6 6 -15 0 -22 C -6 -15 -6 -6 0 0 Z';
const LARGEUR = 300;
const HAUTEUR = 128;

const RX = 124;
const RY = 60;
const point = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: LARGEUR / 2 + RX * Math.cos(a), y: HAUTEUR / 2 + 4 + RY * Math.sin(a), a };
};

/** Tige du côté gauche : arc d'ellipse du bas vers le haut. */
const TIGE = Array.from({ length: 25 }, (_, i) => point(116 + i * 5))
  .map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`)
  .join(' ');

/** Feuille de la pointe, dans le sens de la tige. */
const POINTE = (() => {
  const q = point(238);
  return { x: q.x, y: q.y, r: (Math.atan2(-RX * Math.sin(q.a), -RY * Math.cos(q.a)) * 180) / Math.PI };
})();

/** Feuilles par paires le long de la tige (une dehors, une dedans), qui montent vers la pointe. */
const FEUILLES = Array.from({ length: 7 }, (_, i) => {
  const q = point(124 + i * 16);
  // Sens de la tige (vers le haut), en degrés.
  const tige = (Math.atan2(-RX * Math.sin(q.a), -RY * Math.cos(q.a)) * 180) / Math.PI;
  const s = 0.78 + (i / 6) * 0.3;
  return [
    { x: q.x, y: q.y, r: tige - 42, s, o: 0.6 + (i / 6) * 0.4 },
    { x: q.x, y: q.y, r: tige + 42, s: s * 0.85, o: 0.5 + (i / 6) * 0.4 },
  ];
}).flat();

/** Lauriers autour de 5 étoiles orange qui apparaissent l'une après l'autre. */
function Lauriers() {
  return (
    <View style={styles.lauriers}>
      <Svg width={LARGEUR} height={HAUTEUR} style={StyleSheet.absoluteFill}>
        {[1, -1].map((sens) => (
          <G key={sens} transform={sens === 1 ? undefined : `translate(${LARGEUR} 0) scale(-1 1)`}>
            <Path d={TIGE} stroke={colors.pink} strokeOpacity={0.55} strokeWidth={1.6} fill="none" strokeLinecap="round" />
            {FEUILLES.map((f, i) => (
              <Path key={i} d={FEUILLE} fill={colors.pink} opacity={f.o} transform={`translate(${f.x} ${f.y}) rotate(${f.r}) scale(${f.s})`} />
            ))}
            <Path d={FEUILLE} fill={colors.pink} transform={`translate(${POINTE.x} ${POINTE.y}) rotate(${POINTE.r}) scale(1.05)`} />
          </G>
        ))}
      </Svg>
      <View style={styles.etoiles}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Animated.View key={i} entering={ZoomIn.delay(120 + i * 90).springify().damping(11)}>
            <Icon name="star" size={i === 2 ? 34 : 28} color={colors.pink} fill={colors.pink} strokeWidth={1.2} />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

/** Rangée de cartes qui défile seule, en boucle (deux copies côte à côte). */
function Defilant({ children, fixe }: { children: React.ReactNode; fixe: boolean }) {
  const [w, setW] = useState(0);
  const x = useSharedValue(0);
  useEffect(() => {
    if (!w || fixe) return;
    x.set(0);
    x.set(withRepeat(withTiming(-w, { duration: w * 28, easing: Easing.linear }), -1, false));
  }, [w, x, fixe]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const mesurer = (e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width));
  // Une ou deux cartes : centrées, sans défilement.
  if (fixe) return <View style={[styles.rangee, styles.centre]}>{children}</View>;
  return (
    <View style={styles.defilant}>
      <Animated.View style={[styles.rangee, style]}>
        <View style={styles.rangee} onLayout={mesurer}>
          {children}
        </View>
        <View style={styles.rangee} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgAlt },
  flex: { flex: 1 },
  haut: { paddingHorizontal: 16, paddingTop: 6 },
  croix: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.text, 0.1),
  },
  corps: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 22 },
  lauriers: { width: LARGEUR, height: HAUTEUR, alignItems: 'center', justifyContent: 'center' },
  etoiles: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textes: { gap: 10, alignItems: 'center' },
  titre: { fontSize: 31, lineHeight: 37, letterSpacing: -0.5, textAlign: 'center' },
  orange: { color: colors.pink },
  sous: { fontSize: 16, lineHeight: 22, color: colors.textSecondary, textAlign: 'center', maxWidth: 330 },
  coachs: { alignItems: 'center', gap: 10 },
  tetes: { flexDirection: 'row' },
  tete: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface2,
    borderWidth: 2,
    borderColor: colors.bgAlt,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teteDecalee: { marginLeft: -12 },
  teteImg: { width: 40, height: 40 },
  coachsTxt: { fontSize: 14, lineHeight: 18, color: colors.textSecondary },
  parcoursTitre: { fontSize: 13, lineHeight: 17, color: colors.textTertiary, textAlign: 'center', marginBottom: 10 },
  defilant: { overflow: 'hidden' },
  rangee: { flexDirection: 'row' },
  centre: { justifyContent: 'center', paddingLeft: 12 },
  carte: {
    width: 168,
    marginRight: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: alpha(colors.text, 0.06),
    borderWidth: 0.6,
    borderColor: alpha(colors.text, 0.1),
    gap: 6,
  },
  carteIcone: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.pink, 0.14) },
  chiffre: { alignSelf: 'flex-start' },
  carteTxt: { fontSize: 13, lineHeight: 17, color: colors.textSecondary },
  bas: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 6 },
  contact: { fontSize: 14, lineHeight: 18, color: colors.textSecondary, textAlign: 'center' },
  contactLien: { fontSize: 14, lineHeight: 18, color: colors.text, textDecorationLine: 'underline' },
  ctaZone: { marginTop: 16, justifyContent: 'center' },
  ctaHalo: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 6,
    bottom: 6,
    borderRadius: 999,
    backgroundColor: alpha(colors.pink, 0.38),
    boxShadow: `0 0 22px 6px ${alpha(colors.pink, 0.45)}`,
  },
  cta: {
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 4px 16px ${alpha(colors.pink, 0.35)}`,
  },
  ctaPresse: { opacity: 0.94, transform: [{ scale: 0.985 }] },
  ctaTxt: { ...fonts.bold, fontSize: 17, lineHeight: 22, color: colors.bgAlt },
  jamais: { fontSize: 13, lineHeight: 17, color: colors.textTertiary, textAlign: 'center', marginTop: 14 },
});
