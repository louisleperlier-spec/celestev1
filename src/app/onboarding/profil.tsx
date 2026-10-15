import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { InfoCarte, Warn } from '@/components/onboarding/Choices';
import { ObScaffold } from '@/components/onboarding/ObScaffold';
import { Regle } from '@/components/onboarding/Regle';
import { BigNumber, Icon, Segmente, Text, toast } from '@/components/ui';
import { AGE_MIN } from '@/lib/plan';
import { useProfil } from '@/store/profil';
import { colors, ui } from '@/theme';

/** Nombre à la française (dec() du prototype). */
const dec = (n: number) => String(n).replace('.', ',');
const LB = 2.20462;

/** 6/8 — Profil physique : âge et poids (en kg, affichable en lb). Réservé aux 14 ans et plus (vObBody). */
export default function Profil() {
  const weight = useProfil((s) => s.weight);
  const age = useProfil((s) => s.age);
  const set = useProfil((s) => s.set);
  const [unite, setUnite] = useState<'kg' | 'lb'>('kg');
  const [ageEdite, setAgeEdite] = useState(false);
  const enLb = unite === 'lb';

  return (
    <ObScaffold
      step="profil"
      eyebrow="TES REPÈRES"
      title="Ton profil physique"
      sub="Quelques repères pour personnaliser ton suivi."
      onNext={() => {
        if (age < AGE_MIN) {
          toast(`NÉA est réservé aux ${AGE_MIN} ans et plus`);
          return false;
        }
      }}
    >
      <View style={styles.carte}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Âge : ${age} ans, modifier`} onPress={() => setAgeEdite(!ageEdite)} style={styles.ligne}>
          <Text weight="semibold" style={styles.lbl}>
            Âge
          </Text>
          <BigNumber value={age} unit="ans" size={30} unitSize={18} gap={6} />
          <Icon name="edit" size={20} color={colors.textSecondary} />
        </Pressable>
        {ageEdite && (
          <View style={styles.stepper}>
            <Pressable accessibilityRole="button" accessibilityLabel="Moins" style={styles.stepBtn} onPress={() => set({ age: Math.max(10, age - 1) })}>
              <Icon name="minus" />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Plus" style={styles.stepBtn} onPress={() => set({ age: Math.min(99, age + 1) })}>
              <Icon name="plus" />
            </Pressable>
          </View>
        )}
        <View style={styles.sep} />
        <View style={styles.ligne}>
          <Text weight="semibold" style={styles.lbl}>
            Poids
          </Text>
          <BigNumber value={enLb ? Math.round(weight * LB) : dec(weight)} unit={unite} size={30} unitSize={18} gap={6} />
          <Segmente options={['kg', 'lb'] as const} value={unite} onChange={setUnite} style={styles.unite} />
        </View>
        <Regle
          key={unite}
          label="Poids"
          min={enLb ? 88 : 40}
          max={enLb ? 330 : 150}
          pas={enLb ? 1 : 0.5}
          grand={enLb ? 10 : 5}
          value={enLb ? Math.round(weight * LB) : weight}
          onChange={(v) => set({ weight: enLb ? Math.round((v / LB) * 2) / 2 : v })}
        />
      </View>

      {age < AGE_MIN && <Warn style={styles.warn}>{`NÉA est réservé aux personnes de ${AGE_MIN} ans et plus.`}</Warn>}
      <InfoCarte texte="Ces informations restent modifiables." style={styles.info} />
    </ObScaffold>
  );
}

const styles = StyleSheet.create({
  carte: { padding: 18, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
  lbl: { flex: 1, fontSize: 18, lineHeight: 23 },
  sep: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  unite: { width: 104 },
  stepper: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
  stepBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center' },
  warn: { marginTop: 16 },
  info: { marginTop: 16 },
});
