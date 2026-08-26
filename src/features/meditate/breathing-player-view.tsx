import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/ui/components/button';
import { NightSkyBackdrop } from '@/ui/components/backdrop';
import { Screen } from '@/ui/components/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PHASE_LABEL, type BreathingTechnique } from '@/lib/breathing';
import { addPoints } from '@/lib/storage';

const CIRCLE_MIN = 120;
const CIRCLE_MAX = 220;

export function BreathingPlayerView({ technique }: { technique: BreathingTechnique }) {
  const router = useRouter();
  const theme = useTheme();
  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(1);
  const [stepIndex, setStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(technique.steps[0].seconds);
  const [finished, setFinished] = useState(false);
  const scale = useSharedValue(CIRCLE_MIN);
  const rewarded = useRef(false);

  const step = technique.steps[stepIndex];

  useEffect(() => {
    if (!running) return;
    const target = step.phase === 'inspire' ? CIRCLE_MAX : step.phase === 'expire' ? CIRCLE_MIN : scale.value;
    scale.value = withTiming(target, { duration: step.seconds * 1000, easing: Easing.inOut(Easing.ease) });
  }, [running, stepIndex, step, scale]);

  useEffect(() => {
    if (!running || finished) return;
    if (secondsLeft <= 0) {
      const isLastStep = stepIndex === technique.steps.length - 1;
      if (isLastStep) {
        if (cycle >= technique.cycles) {
          setFinished(true);
          setRunning(false);
          return;
        }
        setCycle((c) => c + 1);
        setStepIndex(0);
        setSecondsLeft(technique.steps[0].seconds);
      } else {
        const next = stepIndex + 1;
        setStepIndex(next);
        setSecondsLeft(technique.steps[next].seconds);
      }
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [running, secondsLeft, stepIndex, cycle, technique, finished]);

  useEffect(() => {
    if (finished && !rewarded.current) {
      rewarded.current = true;
      addPoints(1);
    }
  }, [finished]);

  const circleStyle = useAnimatedStyle(() => ({
    width: scale.value,
    height: scale.value,
    borderRadius: scale.value / 2,
  }));

  function start() {
    setCycle(1);
    setStepIndex(0);
    setSecondsLeft(technique.steps[0].seconds);
    setFinished(false);
    rewarded.current = false;
    scale.value = CIRCLE_MIN;
    setRunning(true);
  }

  return (
    <View style={styles.fill}>
      <NightSkyBackdrop starCount={30} />
      <Screen transparent contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.close}>
          <ThemedText themeColor="text">Fermer</ThemedText>
        </Pressable>

        <ThemedText type="hero" themeColor="text" style={{ textAlign: 'center' }}>
          {technique.title}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', marginBottom: Spacing.five }}>
          {technique.subtitle}
        </ThemedText>

        <View style={styles.circleWrap}>
          <Animated.View
            style={[
              styles.circle,
              circleStyle,
              { backgroundColor: theme.frostSurface, borderColor: theme.frostBorder },
            ]}>
            {running && (
              <>
                <ThemedText type="heading" themeColor="text">
                  {PHASE_LABEL[step.phase]}
                </ThemedText>
                <ThemedText type="title" themeColor="text">
                  {secondsLeft + 1}
                </ThemedText>
              </>
            )}
            {!running && finished && <ThemedText themeColor="text">✦</ThemedText>}
          </Animated.View>
        </View>

        {!running && !finished && (
          <ThemedText themeColor="textSecondary" style={{ textAlign: 'center' }}>
            {technique.cycles} cycles · installe-toi confortablement
          </ThemedText>
        )}
        {finished && (
          <ThemedText themeColor="text" style={{ textAlign: 'center', marginBottom: Spacing.three }}>
            Bien joué. Prends un instant avant de reprendre ta journée.
          </ThemedText>
        )}

        <View style={{ marginTop: Spacing.five }}>
          {!running && <Button label={finished ? 'Recommencer' : 'Commencer'} variant="frost" onPress={start} />}
          {running && (
            <Button label="Arrêter" variant="frost" onPress={() => setRunning(false)} />
          )}
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flex: 1, justifyContent: 'center' },
  close: { position: 'absolute', top: Spacing.four, right: Spacing.four, zIndex: 1 },
  circleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: CIRCLE_MAX + Spacing.five,
  },
  circle: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
