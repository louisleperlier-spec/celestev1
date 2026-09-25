import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Icon, Text } from '@/components/ui';
import { colors, fonts, glow, gradients } from '@/theme';

import { OB_COUNT, OB_STEPS, obHref, obNext, type ObStep } from './steps';

type Props = {
  step: ObStep;
  title: string;
  sub?: string;
  children: ReactNode;
  /** Bouton actif (sinon grisé). */
  ok?: boolean;
  cta?: string;
  /** Vérification au moment de continuer : renvoie false pour rester sur l'écran. */
  onNext?: () => boolean | void;
  /** Contenu libre à la place du titre (écran coach). */
  header?: ReactNode;
  /** Ouvert depuis le Profil : pas de barre d'étapes, et le bouton mène ici. */
  horsOnboarding?: { suivant: () => void };
};

/** Écran d'onboarding (obWrap + obBar du prototype). */
export function ObScaffold({ step, title, sub, children, ok = true, cta = 'Continuer', onNext, header, horsOnboarding }: Props) {
  const next = () => {
    if (onNext?.() === false) return;
    if (horsOnboarding) return horsOnboarding.suivant();
    router.push(obHref(obNext(step)));
  };
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      {horsOnboarding ? <Retour /> : <ObBar step={step} />}
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {header ?? (
          <>
            <Text style={styles.title}>{title}</Text>
            {sub ? <Text style={styles.sub}>{sub}</Text> : null}
          </>
        )}
        <Animated.View
          entering={FadeInDown.duration(350).withInitialValues({ transform: [{ translateY: 6 }] })}
          style={header ? undefined : styles.body}
        >
          {children}
        </Animated.View>
      </ScrollView>
      <View style={styles.foot}>
        <Button label={cta} arrow disabled={!ok} onPress={next} />
      </View>
    </SafeAreaView>
  );
}

/** Simple bouton retour (.obh), hors onboarding. */
export function Retour() {
  return (
    <View style={styles.bar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} style={styles.back}>
        <Icon name="left" />
      </Pressable>
    </View>
  );
}

/** Retour + 8 segments + « n/8 » (.obh2). */
export function ObBar({ step }: { step: ObStep }) {
  const i = OB_STEPS.indexOf(step);
  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retour"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/bienvenue'))}
        style={styles.back}
      >
        <Icon name="left" />
      </Pressable>
      <View style={styles.segs} accessibilityLabel={`Étape ${Math.min(i + 1, OB_COUNT)} sur ${OB_COUNT}`}>
        {Array.from({ length: OB_COUNT }, (_, k) =>
          k <= i ? (
            <LinearGradient
              key={k}
              colors={gradients.progress}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.seg, glow('rgba(255,79,163,0.5)', 8)]}
            />
          ) : (
            <View key={k} style={[styles.seg, styles.segOff]} />
          ),
        )}
      </View>
      <Text style={styles.stepn}>
        {Math.min(i + 1, OB_COUNT)}/{OB_COUNT}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 52, paddingHorizontal: 12 },
  back: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segs: { flex: 1, flexDirection: 'row', gap: 5 },
  seg: { flex: 1, height: 5, borderRadius: 4 },
  segOff: { backgroundColor: colors.border },
  stepn: { width: 40, fontSize: 12, lineHeight: 16, color: colors.textSecondary, textAlign: 'right' },
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontFamily: fonts.black, fontSize: 28, lineHeight: 31, letterSpacing: -0.28, marginTop: 10 },
  sub: { color: colors.textSecondary, fontSize: 14, lineHeight: 19.6, marginTop: 6 },
  // .obbody
  body: { marginTop: 22 },
  foot: { paddingTop: 12, paddingHorizontal: 20, paddingBottom: 18 },
});

/** Styles partagés par les écrans d'onboarding (.lbl, .note, .warn…). */
export const ob = StyleSheet.create({
  lbl: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 18, marginTop: 22, marginBottom: 10 },
  note: { fontSize: 11.5, lineHeight: 16, color: colors.textSecondary, paddingTop: 8 },
  /** Premier libellé : sa marge se confond avec celle du contenu (.obbody). */
  first: { marginTop: 0 },
});
