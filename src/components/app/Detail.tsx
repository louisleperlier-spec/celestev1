import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ImageSourcePropType } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { Icon, Text, type IconName } from '@/components/ui';
import type { CoachId } from '@/data/types';
import { colors, fonts, ui } from '@/theme';

import { CoachFace } from './CoachFace';

/** En-tête des écrans de détail (.obh) : retour + libellé centré. */
export function DetailHead({ titre }: { titre: string }) {
  return (
    <View style={styles.obh}>
      <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/programme'))} style={styles.back}>
        <Icon name="left" />
      </Pressable>
      <Text style={styles.step}>{titre}</Text>
      <View style={styles.back} />
    </View>
  );
}

/** Grande image sur halo de la couleur du coach (.hero2). */
export function Hero({ source, color, exercice = false }: { source: ImageSourcePropType; color: string; exercice?: boolean }) {
  return (
    <View style={styles.hero}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="hero2" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={color} stopOpacity={0.3} />
            <Stop offset="0.72" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx="50%" cy="60%" rx="55%" ry="60%" fill="url(#hero2)" />
      </Svg>
      <Image source={source} style={[styles.heroImg, exercice && styles.heroEx]} contentFit="contain" contentPosition="bottom" />
    </View>
  );
}

/** « Par Axel » (.byc). */
export function ParCoach({ id, nom }: { id: CoachId; nom: string }) {
  return (
    <View style={styles.byc}>
      <CoachFace id={id} size={24} borderWidth={0} />
      <Text weight="semibold" style={styles.bycTxt}>
        Par {nom}
      </Text>
    </View>
  );
}

/** Étiquettes (.tags2), la dernière pouvant être rose (.pk2). */
export function Tags({ items, rose }: { items: string[]; rose?: string }) {
  return (
    <View style={styles.tags}>
      {items.map((t) => (
        <Text key={t} style={styles.tag}>
          {t}
        </Text>
      ))}
      {rose ? <Text style={[styles.tag, styles.tagPk]}>{rose}</Text> : null}
    </View>
  );
}

/** Ligne de chiffres clés avec icônes (.kstat). */
export function KStat({ items }: { items: [IconName, string][] }) {
  return (
    <View style={styles.kstat}>
      {items.map(([ic, t], i) => (
        <View key={i} style={styles.kstatItem}>
          <Icon name={ic} size={17} color={colors.pinkLight} />
          <Text style={styles.kstatTxt}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

export const detail = StyleSheet.create({
  pad: { paddingHorizontal: 20 },
  h1: { fontFamily: fonts.black, fontSize: 25, lineHeight: 30, letterSpacing: -0.25, marginTop: 10 },
  sub: { color: colors.textSecondary, fontSize: 14, lineHeight: 19.6, marginTop: 12 },
});

const styles = StyleSheet.create({
  obh: { flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 12 },
  back: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  step: { flex: 1, textAlign: 'center', fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  hero: { height: 260, alignItems: 'center', justifyContent: 'flex-end' },
  heroImg: { height: 250, width: '85%' },
  heroEx: { height: 240 },
  byc: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 32,
    paddingLeft: 4,
    paddingRight: 12,
    borderRadius: 999,
    backgroundColor: ui.chipBg,
    borderWidth: 1,
    borderColor: colors.border2,
  },
  bycTxt: { fontSize: 12.5, lineHeight: 16, color: colors.pinkPale },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tag: { fontSize: 13, lineHeight: 17, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, overflow: 'hidden', backgroundColor: ui.dark, color: ui.text3 },
  tagPk: { backgroundColor: 'rgba(255,79,163,0.16)', color: colors.pinkPale },
  kstat: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: 6, columnGap: 14, marginTop: 12 },
  kstatItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kstatTxt: { fontSize: 13.5, lineHeight: 18, color: ui.text3 },
});
