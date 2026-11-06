import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
import { colors, fonts } from '@/theme';

import { ObBar } from './ObScaffold';
import { obHref, obNext, type ObStep } from './steps';

type Props = {
  step: ObStep;
  title: string;
  sub?: string;
  children: ReactNode;
  ok?: boolean;
  /** Vérification au moment de continuer : false pour rester sur l'écran. */
  onNext?: () => boolean | void;
};

/**
 * Écran à une seule valeur (designs 10K « Prénom », « Âge », « Poids ») : titre centré en haut, valeur au centre,
 * bouton Continuer collé au clavier quand il est ouvert.
 */
export function ObCentre({ step, title, sub, children, ok = true, onNext }: Props) {
  const next = () => {
    if (onNext?.() === false) return;
    router.push(obHref(obNext(step)));
  };
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <ObBar step={step} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.tete}>
          <Text style={styles.title}>{title}</Text>
          {sub ? <Text style={styles.sub}>{sub}</Text> : null}
        </View>
        <Animated.View
          entering={FadeInDown.duration(350).withInitialValues({
            transform: [{ translateY: 8 }],
          })}
          style={styles.corps}
        >
          {children}
        </Animated.View>
        <View style={styles.foot}>
          <Button label="Continuer" arrow disabled={!ok} onPress={next} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  tete: { paddingHorizontal: 28, paddingTop: 28 },
  title: {
    ...fonts.bold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  sub: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  corps: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  foot: { paddingTop: 8, paddingHorizontal: 20, paddingBottom: 12 },
});
