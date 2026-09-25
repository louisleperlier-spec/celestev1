import Slider from '@react-native-community/slider';
import { Pressable, StyleSheet, View } from 'react-native';

import { Warn } from '@/components/onboarding/Choices';
import { ob, ObScaffold } from '@/components/onboarding/ObScaffold';
import { Card, Icon, Text, toast } from '@/components/ui';
import { hrMax } from '@/lib/plan';
import { useProfil } from '@/store/profil';
import { colors, fonts, ui } from '@/theme';

/** Nombre à la française (dec() du prototype). */
const dec = (n: number) => String(n).replace('.', ',');

/** 6/8 — Profil physique : poids, âge, FC max. Réservé aux 14 ans et plus (vObBody). */
export default function Profil() {
  const weight = useProfil((s) => s.weight);
  const age = useProfil((s) => s.age);
  const set = useProfil((s) => s.set);

  return (
    <ObScaffold
      step="profil"
      title="Ton profil physique"
      sub="Pour calculer tes charges, tes calories et ta fréquence cardiaque max."
      onNext={() => {
        if (age < 14) {
          toast('NÉA est réservé aux 14 ans et plus');
          return false;
        }
      }}
    >
      <Text style={[ob.lbl, ob.first]}>Poids</Text>
      <Text style={styles.bignum}>
        <Text style={styles.bignumB}>{dec(weight)}</Text> kg
      </Text>
      <Slider
        style={styles.slider}
        minimumValue={40}
        maximumValue={150}
        step={0.5}
        value={weight}
        onValueChange={(v) => set({ weight: Math.round(v * 2) / 2 })}
        minimumTrackTintColor={colors.pink}
        maximumTrackTintColor={colors.border2}
        thumbTintColor={colors.text}
        accessibilityLabel="Poids"
      />

      <Text style={ob.lbl}>Âge</Text>
      <View style={styles.stepper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Moins"
          style={styles.stepBtn}
          onPress={() => set({ age: Math.max(10, age - 1) })}
        >
          <Icon name="minus" />
        </Pressable>
        <Text style={styles.stepVal}>{age}</Text>
        <Text style={styles.stepUnit}>ans</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Plus"
          style={styles.stepBtn}
          onPress={() => set({ age: Math.min(99, age + 1) })}
        >
          <Icon name="plus" />
        </Pressable>
      </View>

      {age < 14 && <Warn style={styles.warn}>NÉA est réservé aux personnes de 14 ans et plus.</Warn>}

      <Card style={styles.fcmax}>
        <Icon name="heart" color={ui.heart} />
        <View style={styles.fcText}>
          <Text weight="bold" style={styles.fcB}>
            FC max estimée : {hrMax(age)} bpm
          </Text>
          <Text style={styles.fcSmall}>Elle sert à calculer tes zones cardio.</Text>
        </View>
      </Card>
    </ObScaffold>
  );
}

const styles = StyleSheet.create({
  // .bignum
  bignum: { textAlign: 'center', fontSize: 18, lineHeight: 64, color: colors.textSecondary },
  bignumB: { fontFamily: fonts.black, fontSize: 56, color: colors.text, fontVariant: ['tabular-nums'] },
  slider: { width: '100%', height: 30, marginTop: 6 },
  // .stepper
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  stepBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ui.dark,
    borderWidth: 1,
    borderColor: colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepVal: { fontFamily: fonts.black, fontSize: 44, lineHeight: 52, minWidth: 70, textAlign: 'center' },
  stepUnit: { color: colors.textSecondary, marginLeft: -12 },
  warn: { marginTop: 18 },
  // .fcmax
  fcmax: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginTop: 22 },
  fcText: { flex: 1 },
  fcB: { fontSize: 14, lineHeight: 18 },
  fcSmall: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
});
