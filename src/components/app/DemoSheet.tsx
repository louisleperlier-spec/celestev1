import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Glow, Icon, Text } from '@/components/ui';
import { EXERCICE_IMAGES } from '@/data';
import type { ExerciceId } from '@/data/types';
import { exercice } from '@/lib/plan';
import { colors, fonts } from '@/theme';

import { Sheet } from './Sheet';

/** Poses de l'illustration pour chaque étape (.dstage img.m0 / .m1 / .m2). */
const POSES = [
  { scale: 1, translateY: 0, rotate: 0 },
  { scale: 1.08, translateY: -6, rotate: 0 },
  { scale: 1.03, translateY: 4, rotate: -1.5 },
];

/** Démo guidée : les 3 étapes défilent toutes les 3,5 s (demoSheet du prototype). */
export function DemoSheet({ id, onClose }: { id: ExerciceId | null; onClose: () => void }) {
  return (
    <Sheet visible={!!id} onClose={onClose} maxHeight="90%">
      {id && <Demo id={id} onClose={onClose} />}
    </Sheet>
  );
}

function Demo({ id, onClose }: { id: ExerciceId; onClose: () => void }) {
  const e = exercice(id);
  const [k, setK] = useState(0);
  const barre = useSharedValue(0);
  const pose = useSharedValue(0);

  useEffect(() => {
    const iv = setInterval(() => setK((x) => (x + 1) % e.etapes.length), 3500);
    return () => clearInterval(iv);
  }, [e.etapes.length]);
  useEffect(() => {
    barre.value = 0;
    barre.value = withTiming(1, { duration: 3400, easing: Easing.linear });
    pose.value = withTiming(k, { duration: 1600, easing: Easing.inOut(Easing.ease) });
  }, [k, barre, pose]);

  const img = useAnimatedStyle(() => {
    const a = POSES[Math.floor(pose.value)] ?? POSES[0];
    const b = POSES[Math.ceil(pose.value)] ?? POSES[0];
    const t = pose.value - Math.floor(pose.value);
    return {
      transform: [
        { scale: a.scale + (b.scale - a.scale) * t },
        { translateY: a.translateY + (b.translateY - a.translateY) * t },
        { rotate: `${a.rotate + (b.rotate - a.rotate) * t}deg` },
      ],
    };
  });
  const fill = useAnimatedStyle(() => ({ width: `${barre.value * 100}%` }));

  // Pouls lumineux sous l'illustration (.dpulse, animation breathe).
  const souffle = useSharedValue(1);
  useEffect(() => {
    souffle.value = withRepeat(withTiming(1.07, { duration: 1750, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [souffle]);
  const pulse = useAnimatedStyle(() => ({ transform: [{ scale: souffle.value }] }));

  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onClose} style={styles.close}>
        <Icon name="x" size={18} />
      </Pressable>
      <View style={styles.stage}>
        <Glow width={300} height={240} intensity={0.18} />
        <Animated.View style={[styles.pulse, pulse]}>
          <Glow width={200} height={40} intensity={0.35} />
        </Animated.View>
        <Animated.View style={img}>
          <Image source={EXERCICE_IMAGES[id]} style={styles.img} contentFit="contain" accessibilityLabel={e.nom} />
        </Animated.View>
      </View>
      <Text weight="bold" style={styles.h3}>
        {e.nom}
      </Text>
      <View style={styles.steps}>
        {e.etapes.map((s, i) => (
          <View key={i} style={[styles.step, i === k && styles.stepOn]}>
            <View style={[styles.num, i === k && styles.numOn]}>
              <Text weight="bold" style={[styles.numTxt, i === k && styles.numTxtOn]}>
                {i + 1}
              </Text>
            </View>
            <Text style={[styles.stepTxt, i === k && styles.stepTxtOn]}>{s}</Text>
          </View>
        ))}
      </View>
      <View style={styles.bar}>
        <Animated.View style={[styles.fill, fill]} />
      </View>
      <Text style={styles.note}>
        {e.muscles} • Erreur à éviter : {e.erreur}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  close: { position: 'absolute', top: 0, right: 0, zIndex: 2, width: 34, height: 34, borderRadius: 17, backgroundColor: '#222228', alignItems: 'center', justifyContent: 'center' },
  stage: { height: 240, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  pulse: { position: 'absolute', bottom: 8 },
  img: { height: 220, width: 280 },
  h3: { fontSize: 17, lineHeight: 22, marginTop: 8 },
  steps: { gap: 8, marginTop: 12 },
  step: { flexDirection: 'row', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  stepOn: { backgroundColor: 'rgba(255,79,163,0.1)', borderColor: 'rgba(255,79,163,0.45)' },
  num: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#222228', alignItems: 'center', justifyContent: 'center' },
  numOn: { backgroundColor: colors.pink },
  numTxt: { fontSize: 12, lineHeight: 15 },
  numTxtOn: { color: colors.onPrimary },
  stepTxt: { flex: 1, fontSize: 14, lineHeight: 20.3, color: colors.textSecondary },
  stepTxtOn: { color: colors.text },
  bar: { height: 4, borderRadius: 3, backgroundColor: colors.border, marginTop: 10, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.pink },
  note: { fontSize: 11.5, lineHeight: 16, color: colors.textSecondary, paddingTop: 8, fontFamily: fonts.regular },
});
