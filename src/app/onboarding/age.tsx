import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { ObCentre } from '@/components/onboarding/ObCentre';
import { BigNumber, Text } from '@/components/ui';
import { AGE_MIN } from '@/lib/plan';
import { useProfil } from '@/store/profil';
import { colors } from '@/theme';

const AGE_MAX = 99;
const AGES = Array.from({ length: AGE_MAX - AGE_MIN + 1 }, (_, i) => AGE_MIN + i);
const H = 56;
const VISIBLES = 5;

/** Une ligne de la roue : plus grande et plus claire au centre. */
function Ligne({ age, i, y }: { age: number; i: number; y: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const d = Math.abs(y.value / H - i);
    return {
      opacity: interpolate(d, [0, 1, 2.5], [1, 0.45, 0.12], Extrapolation.CLAMP),
      transform: [
        {
          scale: interpolate(d, [0, 1, 2], [1, 0.82, 0.7], Extrapolation.CLAMP),
        },
      ],
    };
  });
  return (
    <Animated.View style={[styles.ligne, style]}>
      <BigNumber value={age} size={34} />
    </Animated.View>
  );
}

/** 3/7 — Âge sur une roue (design 10K « Âge »), de 14 à 99 ans : NÉA est réservé aux 14 ans et plus. */
export default function Age() {
  const age = useProfil((s) => s.age);
  const set = useProfil((s) => s.set);
  const depart = Math.min(AGE_MAX, Math.max(AGE_MIN, age));
  const y = useSharedValue((depart - AGE_MIN) * H);
  const roue = useRef<Animated.ScrollView>(null);

  useEffect(() => {
    if (age !== depart) set({ age: depart });
  }, [age, depart, set]);

  const defil = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });

  return (
    <ObCentre step="age" title="Quel âge as-tu ?" sub={`NÉA est réservé aux ${AGE_MIN} ans et plus.`}>
      <View style={styles.roue}>
        <View pointerEvents="none" style={styles.bande} />
        <Animated.ScrollView
          ref={roue}
          // Place la roue sur l'âge enregistré dès la mise en page (contentOffset seul ne suffit pas partout).
          onLayout={() =>
            roue.current?.scrollTo({
              y: (depart - AGE_MIN) * H,
              animated: false,
            })
          }
          showsVerticalScrollIndicator={false}
          snapToInterval={H}
          decelerationRate="fast"
          contentOffset={{ x: 0, y: (depart - AGE_MIN) * H }}
          contentContainerStyle={{
            paddingVertical: H * Math.floor(VISIBLES / 2),
          }}
          onScroll={defil}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.y / H);
            set({ age: AGES[Math.max(0, Math.min(AGES.length - 1, i))] });
          }}
          accessibilityRole="adjustable"
          accessibilityLabel={`Âge : ${age} ans`}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) =>
            set({
              age: Math.max(AGE_MIN, Math.min(AGE_MAX, age + (e.nativeEvent.actionName === 'increment' ? 1 : -1))),
            })
          }
        >
          {AGES.map((a, i) => (
            <Ligne key={a} age={a} i={i} y={y} />
          ))}
        </Animated.ScrollView>
        <Text style={styles.unite} pointerEvents="none">
          ans
        </Text>
      </View>
    </ObCentre>
  );
}

const styles = StyleSheet.create({
  roue: { height: H * VISIBLES, justifyContent: 'center' },
  bande: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: H * Math.floor(VISIBLES / 2),
    height: H,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ligne: { height: H, alignItems: 'center', justifyContent: 'center' },
  unite: {
    position: 'absolute',
    right: 56,
    top: H * Math.floor(VISIBLES / 2),
    lineHeight: H,
    fontSize: 18,
    color: colors.textSecondary,
  },
});
