import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ObCentre } from '@/components/onboarding/ObCentre';
import { Segmente, Text, toast } from '@/components/ui';
import { useProfil } from '@/store/profil';
import { colors, fonts } from '@/theme';

const LB = 2.20462;
/** Poids plausible, en kg. */
const plausible = (kg: number) => kg >= 30 && kg <= 250;
/** « 72.5 » ou « 72 » (un seul chiffre après la virgule). */
const texte = (v: number) => {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1).replace('.', ',');
};

/** 4/7 — Poids au pavé numérique, kg ou lb (design 10K « Poids ») ; toujours stocké en kg. */
export default function Poids() {
  const weight = useProfil((s) => s.weight);
  const set = useProfil((s) => s.set);
  const [unite, setUnite] = useState<'kg' | 'lb'>('kg');
  const [saisie, setSaisie] = useState(texte(weight));
  const valeur = Number(saisie.replace(',', '.')) || 0;
  const kg = unite === 'kg' ? valeur : valeur / LB;
  const champ = useRef<TextInput>(null);

  const changer = (brut: string) => {
    // Chiffres et un seul séparateur décimal, 5 caractères au plus.
    let s = '';
    let sep = false;
    for (const c of brut) {
      if (s.length >= 5) break;
      if (c >= '0' && c <= '9') s += c;
      else if ((c === ',' || c === '.') && !sep) {
        s += ',';
        sep = true;
      }
    }
    setSaisie(s);
    const v = Number(s.replace(',', '.')) || 0;
    const k = unite === 'kg' ? v : v / LB;
    if (plausible(k)) set({ weight: Math.round(k * 10) / 10 });
  };

  return (
    <ObCentre
      step="poids"
      title="Quel est ton poids ?"
      sub="Il sert à estimer tes charges et tes calories."
      ok={plausible(kg)}
      onNext={() => {
        if (!plausible(kg)) {
          toast('Indique un poids valide');
          return false;
        }
      }}
    >
      <Segmente
        options={
          [
            ['kg', 'KG'],
            ['lb', 'LBS'],
          ] as const
        }
        value={unite}
        onChange={(u) => {
          if (u === unite) return;
          setUnite(u);
          // Le kg reste la référence : on convertit depuis la valeur enregistrée.
          setSaisie(texte(u === 'kg' ? weight : weight * LB));
        }}
        style={styles.unite}
      />
      <Pressable accessible={false} onPress={() => champ.current?.focus()} style={styles.ligne}>
        <TextInput
          ref={champ}
          style={[styles.valeur, { width: Math.max(60, (saisie.length || 1) * 34 + 12) }]}
          value={saisie}
          onChangeText={changer}
          keyboardType="decimal-pad"
          selectionColor={colors.pink}
          autoFocus
          maxLength={5}
          placeholder="0"
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel={`Poids en ${unite === 'kg' ? 'kilogrammes' : 'livres'}`}
        />
        <Text weight="medium" style={styles.uniteTxt}>
          {unite === 'kg' ? 'kg' : 'lbs'}
        </Text>
      </Pressable>
      <View style={styles.espace} />
    </ObCentre>
  );
}

const styles = StyleSheet.create({
  unite: { alignSelf: 'center', width: 220 },
  ligne: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
    marginTop: 48,
  },
  valeur: {
    ...fonts.bold,
    fontSize: 56,
    color: colors.text,
    textAlign: 'center',
    padding: 0,
  },
  uniteTxt: { fontSize: 20, lineHeight: 26, color: colors.textSecondary },
  espace: { height: 40 },
});
