import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { ObCentre } from '@/components/onboarding/ObCentre';
import { useProfil } from '@/store/profil';
import { colors, fonts } from '@/theme';

/** 1/7 — Prénom (design 10K « Prénom » : grand champ centré, clavier ouvert, Continuer au-dessus du clavier). */
export default function Prenom() {
  const name = useProfil((s) => s.name);
  const set = useProfil((s) => s.set);
  const [valeur, setValeur] = useState(name);

  return (
    <ObCentre step="prenom" title="Comment tu t'appelles ?" sub="Ton coach va t'appeler comme ça." ok={!!name}>
      <TextInput
        style={styles.input}
        value={valeur}
        onChangeText={(v) => {
          setValeur(v);
          set({ name: v.trim() });
        }}
        placeholder="Ton prénom"
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.pink}
        autoComplete="given-name"
        textContentType="givenName"
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={20}
        autoFocus
        returnKeyType="next"
        onSubmitEditing={() => {
          if (name) router.push('/onboarding/discussion');
        }}
        accessibilityLabel="Ton prénom"
      />
    </ObCentre>
  );
}

const styles = StyleSheet.create({
  input: {
    ...fonts.bold,
    fontSize: 40,
    minHeight: 64,
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
