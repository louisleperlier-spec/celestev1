import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button, toast } from '@/components/ui';
import { useProfil } from '@/store/profil';
import { colors, fonts } from '@/theme';

import { Sheet } from './Sheet';

/** « Ton poids aujourd'hui » (weightSheet du prototype). */
export function PeseeSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const weight = useProfil((s) => s.weight);
  const [v, setV] = useState(String(weight).replace('.', ','));
  return (
    <Sheet visible={visible} onClose={onClose} title="Ton poids aujourd'hui">
      <TextInput
        style={styles.inp}
        value={v}
        onChangeText={setV}
        keyboardType="decimal-pad"
        accessibilityLabel="Ton poids en kilos"
        autoFocus
      />
      <View style={{ height: 12 }} />
      <Button
        label="Enregistrer"
        onPress={() => {
          const n = parseFloat(v.replace(',', '.'));
          if (n > 30 && n < 300) {
            const st = useProfil.getState();
            st.logWeight(Math.round(n * 10) / 10);
            st.quest('poids');
            onClose();
            toast('Poids enregistré, charges recalculées');
          }
        }}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
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
});
