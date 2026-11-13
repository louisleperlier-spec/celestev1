import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text } from '@/components/ui';
import { EXERCICE_IMAGES } from '@/data';
import type { ExerciceId } from '@/data/types';
import { exercice } from '@/lib/plan';
import { alpha, colors, ui } from '@/theme';

const MIN = 1;
const MAX = 5;
const PAS = 0.75;

function borne(v: number, a: number, b: number) {
  'worklet';
  return Math.min(b, Math.max(a, v));
}

/**
 * Illustration d'un exercice en plein écran, pour ceux qui voient un peu mal (pendant la séance, à la salle, ou depuis la fiche) :
 * pincer pour zoomer jusqu'à ×5, glisser pour se déplacer, toucher deux fois pour agrandir / revenir, et gros boutons − / +
 * pour zoomer d'une main sans pincer. Dessous : le mouvement en grands caractères. `ligne` : rappel du plan (« 3 séries • 10 reps • 40 kg »).
 */
export function ZoomExercice({ id, ligne, onClose }: { id: ExerciceId | null; ligne?: string; onClose: () => void }) {
  return (
    <Modal visible={!!id} animationType="fade" onRequestClose={onClose} statusBarTranslucent supportedOrientations={['portrait', 'landscape']}>
      {id && <Contenu id={id} ligne={ligne} onClose={onClose} />}
    </Modal>
  );
}

function Contenu({ id, ligne, onClose }: { id: ExerciceId; ligne?: string; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const e = exercice(id);
  const [pct, setPct] = useState(100);

  const echelle = useSharedValue(1);
  const echelleDepart = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const xDepart = useSharedValue(0);
  const yDepart = useSharedValue(0);
  const larg = useSharedValue(1);
  const haut = useSharedValue(1);

  // Les bords de l'image agrandie ne quittent jamais le cadre.
  const limiteX = (s: number) => {
    'worklet';
    return ((s - 1) * larg.get()) / 2;
  };
  const limiteY = (s: number) => {
    'worklet';
    return ((s - 1) * haut.get()) / 2;
  };

  const zoomer = (s: number) => {
    const n = borne(s, MIN, MAX);
    echelle.set(withTiming(n, { duration: 220 }));
    x.set(withTiming(borne(x.get(), -limiteX(n), limiteX(n)), { duration: 220 }));
    y.set(withTiming(borne(y.get(), -limiteY(n), limiteY(n)), { duration: 220 }));
    setPct(Math.round(n * 100));
  };

  const pincer = Gesture.Pinch()
    .runOnJS(true)
    .onStart(() => echelleDepart.set(echelle.get()))
    .onUpdate((ev) => {
      const n = borne(echelleDepart.get() * ev.scale, MIN, MAX);
      echelle.set(n);
      x.set(borne(x.get(), -limiteX(n), limiteX(n)));
      y.set(borne(y.get(), -limiteY(n), limiteY(n)));
    })
    .onEnd(() => setPct(Math.round(echelle.get() * 100)));

  const glisser = Gesture.Pan()
    .runOnJS(true)
    .averageTouches(true)
    .onStart(() => {
      xDepart.set(x.get());
      yDepart.set(y.get());
    })
    .onUpdate((ev) => {
      const s = echelle.get();
      x.set(borne(xDepart.get() + ev.translationX, -limiteX(s), limiteX(s)));
      y.set(borne(yDepart.get() + ev.translationY, -limiteY(s), limiteY(s)));
    });

  const doubleTouche = Gesture.Tap()
    .runOnJS(true)
    .numberOfTaps(2)
    .onEnd(() => zoomer(echelle.get() > 1.2 ? 1 : 2.5));

  const geste = Gesture.Simultaneous(pincer, glisser, doubleTouche);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: echelle.get() }] }));

  return (
    <GestureHandlerRootView style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.haut}>
        <View style={styles.flex}>
          <Text weight="bold" style={styles.nom} numberOfLines={2}>
            {e.nom}
          </Text>
          {ligne ? <Text style={styles.ligne}>{ligne}</Text> : null}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer l'image agrandie" onPress={onClose} hitSlop={8} style={styles.fermer}>
          <Icon name="x" size={22} />
        </Pressable>
      </View>

      <GestureDetector gesture={geste}>
        <View
          style={styles.cadre}
          onLayout={(ev) => {
            larg.set(ev.nativeEvent.layout.width);
            haut.set(ev.nativeEvent.layout.height);
          }}
          accessible
          accessibilityRole="image"
          accessibilityLabel={`${e.nom}, agrandi à ${pct} %`}
          accessibilityHint="Pince pour zoomer, touche deux fois pour agrandir"
        >
          <Animated.View style={[StyleSheet.absoluteFill, style]}>
            <Image source={EXERCICE_IMAGES[id]} style={styles.img} contentFit="contain" />
          </Animated.View>
        </View>
      </GestureDetector>

      <View style={styles.zoom}>
        <BoutonRond icon="minus" label="Réduire" off={pct <= MIN * 100} onPress={() => zoomer(echelle.get() - PAS)} />
        <Pressable accessibilityRole="button" accessibilityLabel="Taille réelle" onPress={() => zoomer(1)} style={styles.pct}>
          <Text weight="bold" style={styles.pctTxt}>
            {pct} %
          </Text>
        </Pressable>
        <BoutonRond icon="plus" label="Agrandir" off={pct >= MAX * 100} onPress={() => zoomer(echelle.get() + PAS)} />
      </View>

      <ScrollView style={styles.etapes} contentContainerStyle={styles.etapesIn} showsVerticalScrollIndicator={false}>
        {e.etapes.map((t, i) => (
          <View key={i} style={styles.etape}>
            <View style={styles.etapeN}>
              <Text weight="bold" style={styles.etapeNTxt}>
                {i + 1}
              </Text>
            </View>
            <Text style={styles.etapeTxt}>{t}</Text>
          </View>
        ))}
      </ScrollView>
    </GestureHandlerRootView>
  );
}

function BoutonRond({ icon, label, off, onPress }: { icon: 'plus' | 'minus'; label: string; off: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [styles.rond, off && styles.off, pressed && styles.presse]}
    >
      <Icon name={icon} size={26} strokeWidth={2.6} color={colors.bg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  haut: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingBottom: 10 },
  nom: { fontSize: 28, lineHeight: 34, color: colors.text },
  ligne: { fontSize: 19, lineHeight: 25, color: colors.pinkLight, marginTop: 4, fontVariant: ['tabular-nums'] },
  fermer: { width: 48, height: 48, borderRadius: 24, backgroundColor: alpha(colors.text, 0.12), alignItems: 'center', justifyContent: 'center' },
  cadre: { flex: 1, minHeight: 260, overflow: 'hidden', backgroundColor: colors.surface, marginHorizontal: 12, borderRadius: 24 },
  img: { width: '100%', height: '100%' },
  zoom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, paddingVertical: 14 },
  rond: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  off: { opacity: 0.3 },
  presse: { transform: [{ scale: 0.94 }] },
  pct: { minWidth: 92, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.text, 0.08) },
  pctTxt: { fontSize: 18, lineHeight: 23, color: colors.text, fontVariant: ['tabular-nums'] },
  etapes: { maxHeight: '32%', flexGrow: 0 },
  etapesIn: { paddingHorizontal: 20, gap: 14 },
  etape: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  etapeN: { width: 34, height: 34, borderRadius: 17, backgroundColor: alpha(colors.pink, 0.18), alignItems: 'center', justifyContent: 'center' },
  etapeNTxt: { fontSize: 17, lineHeight: 22, color: colors.pink },
  etapeTxt: { flex: 1, fontSize: 21, lineHeight: 29, color: ui.text2 },
});
