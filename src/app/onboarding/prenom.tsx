import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { ObScaffold } from '@/components/onboarding/ObScaffold';
import { toast } from '@/components/ui';
import { useProfil } from '@/store/profil';
import { colors, fonts } from '@/theme';

/** 1/8 — Prénom (vObName). */
export default function Prenom() {
  const name = useProfil((s) => s.name);
  const set = useProfil((s) => s.set);
  const [valeur, setValeur] = useState(name);

  const verifier = () => {
    if (!name) {
      toast('Écris ton prénom');
      return false;
    }
  };

  return (
    <ObScaffold step="prenom" title="Comment tu t'appelles ?" sub="Ton coach va t'appeler comme ça." onNext={verifier}>
      <TextInput
        style={styles.input}
        value={valeur}
        onChangeText={(v) => {
          setValeur(v);
          set({ name: v.trim() });
        }}
        placeholder="Ton prénom"
        placeholderTextColor={colors.textSecondary}
        autoComplete="given-name"
        textContentType="givenName"
        autoCapitalize="words"
        maxLength={20}
        autoFocus
        returnKeyType="next"
        onSubmitEditing={() => {
          if (verifier() !== false) router.push('/onboarding/objectifs');
        }}
        accessibilityLabel="Ton prénom"
      />
    </ObScaffold>
  );
}

const styles = StyleSheet.create({
  // .inp.big
  input: {
    height: 64,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 22,
    textAlign: 'center',
  },
});
