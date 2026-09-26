import Slider from '@react-native-community/slider';
import { Pressable, StyleSheet, View } from 'react-native';

import { Warn } from '@/components/onboarding/Choices';
import { ob, ObScaffold } from '@/components/onboarding/ObScaffold';
import { BigNumber, Card, Icon, Text, toast } from '@/components/ui';
import { AGE_MIN, hrMax } from '@/lib/plan';
import { useProfil } from '@/store/profil';
import { colors, ui } from '@/theme';

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
        if (age < AGE_MIN) {
          toast(`NÉA est réservé aux ${AGE_MIN} ans et plus`);
          return false;
        }
      }}
    >
      <Text style={[ob.lbl, ob.first]}>Poids</Text>
      {/* .bignum : chiffre 56 px + « kg » 18 px grisé */}
      <BigNumber value={dec(weight)} unit="kg" size={56} unitSize={18} gap={5} />
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
        {/* .stepper b (44 px) + « ans » collé (margin-left: -12px sur un gap de 18) */}
        <BigNumber value={age} unit="ans" size={44} unitSize={15} gap={6} style={styles.stepVal} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Plus"
          style={styles.stepBtn}
          onPress={() => set({ age: Math.min(99, age + 1) })}
        >
          <Icon name="plus" />
        </Pressable>
      </View>

      {age < AGE_MIN && <Warn style={styles.warn}>{`NÉA est réservé aux personnes de ${AGE_MIN} ans et plus.`}</Warn>}

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
  stepVal: { minWidth: 70 },
  warn: { marginTop: 18 },
  // .fcmax
  fcmax: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginTop: 22 },
  fcText: { flex: 1 },
  fcB: { fontSize: 14, lineHeight: 18 },
  fcSmall: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
});
