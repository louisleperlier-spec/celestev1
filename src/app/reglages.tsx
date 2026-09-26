import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/onboarding/Choices';
import { ob } from '@/components/onboarding/ObScaffold';
import { Button, Icon, SelectableCard, Text, toast, type IconName } from '@/components/ui';
import type { LieuOnboarding } from '@/data/types';
import { AGE_MIN, type Jours, type NiveauId } from '@/lib/plan';
import { useProfil } from '@/store/profil';
import { colors, fonts } from '@/theme';

const NIVEAUX: readonly [NiveauId, string, IconName][] = [
  ['deb', 'Débutant', 'check'],
  ['int', 'Intermédiaire', 'star'],
  ['adv', 'Avancé', 'spark'],
];
const MATERIEL: readonly [LieuOnboarding, string, IconName][] = [
  ['maison', 'Maison', 'home'],
  ['salle', 'Salle', 'dumb'],
  ['deux', 'Les deux', 'cloud'],
];
const JOURS: readonly Jours[] = [2, 3, 4, 5, 6, 7];

/** « Modifier » depuis le calendrier : niveau, matériel, jours, prénom, poids, âge (vSetup du prototype). */
export default function Reglages() {
  const profil = useProfil();
  const [nom, setNom] = useState(profil.name);
  const [poids, setPoids] = useState(String(profil.weight).replace('.', ','));
  const [age, setAge] = useState(String(profil.age));

  const continuer = () => {
    const v = nom.trim();
    const w = parseFloat(poids.replace(',', '.'));
    const a = parseInt(age, 10);
    if (!v) return toast('Écris ton prénom');
    if (!(w > 30 && w < 300)) return toast('Entre un poids entre 30 et 300 kg');
    if (!(a >= AGE_MIN && a <= 99)) return toast(`Entre un âge entre ${AGE_MIN} et 99 ans`);
    profil.set({ name: v, age: a });
    profil.logWeight(w);
    toast('Programme mis à jour');
    router.back();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.head}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} style={styles.back}>
          <Icon name="left" />
        </Pressable>
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.h1}>UN PROGRAMME VRAIMENT À TOI</Text>
          <Text style={styles.sub}>Dis-moi en plus pour personnaliser ton expérience.</Text>

          <Text style={ob.lbl}>Ton niveau</Text>
          <View style={styles.grid3}>
            {NIVEAUX.map(([k, l, ic]) => (
              <Opt key={k} label={l} icon={ic} on={profil.level === k} onPress={() => profil.set({ level: k })} />
            ))}
          </View>
          <Text style={ob.lbl}>Ton matériel</Text>
          <View style={styles.grid3}>
            {MATERIEL.map(([k, l, ic]) => (
              <Opt key={k} label={l} icon={ic} on={profil.gear === k} onPress={() => profil.set({ gear: k })} />
            ))}
          </View>
          <Text style={ob.lbl}>Combien de jours par semaine ?</Text>
          <View style={styles.chips}>
            {JOURS.map((d) => (
              <Chip key={d} label={String(d)} on={profil.days === d} onPress={() => profil.set({ days: d })} />
            ))}
          </View>
          <Text style={ob.lbl}>Ton prénom</Text>
          <TextInput
            style={styles.inp}
            value={nom}
            onChangeText={setNom}
            placeholder="Ton prénom"
            placeholderTextColor={colors.textSecondary}
            autoComplete="given-name"
            maxLength={20}
            accessibilityLabel="Ton prénom"
          />
          <View style={styles.two}>
            <View style={styles.flex}>
              <Text style={ob.lbl}>Ton poids (kg)</Text>
              <TextInput style={styles.inp} value={poids} onChangeText={setPoids} keyboardType="decimal-pad" accessibilityLabel="Ton poids en kilos" />
            </View>
            <View style={styles.flex}>
              <Text style={ob.lbl}>Ton âge</Text>
              <TextInput style={styles.inp} value={age} onChangeText={setAge} keyboardType="number-pad" accessibilityLabel="Ton âge" />
            </View>
          </View>
          <Text style={ob.note}>Ton poids sert à calculer tes charges et tes calories, ton âge ta fréquence cardiaque max.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={styles.foot}>
        <Button label="Continuer" arrow onPress={continuer} />
      </View>
    </SafeAreaView>
  );
}

/** Option en grille de 3 (.card.sel.opt) : icône + libellé. */
function Opt({ label, icon, on, onPress }: { label: string; icon: IconName; on: boolean; onPress: () => void }) {
  return (
    <SelectableCard selected={on} onPress={onPress} style={styles.opt} accessibilityLabel={label}>
      <Icon name={icon} color={on ? colors.pink : colors.text} />
      <Text weight="medium" style={styles.optTxt}>
        {label}
      </Text>
    </SelectableCard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  head: { height: 52, paddingHorizontal: 12, justifyContent: 'center' },
  back: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },
  h1: { fontFamily: fonts.black, fontSize: 27, lineHeight: 30, letterSpacing: -0.27 },
  sub: { color: colors.textSecondary, fontSize: 14, lineHeight: 19.6, marginTop: 6 },
  grid3: { flexDirection: 'row', gap: 10 },
  opt: { flex: 1, height: 78, alignItems: 'center', justifyContent: 'center', gap: 8 },
  optTxt: { fontSize: 13, lineHeight: 16 },
  chips: { flexDirection: 'row', gap: 8 },
  inp: {
    height: 50,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  two: { flexDirection: 'row', gap: 10 },
  foot: { paddingTop: 12, paddingHorizontal: 20, paddingBottom: 18 },
});
