import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Chip } from '@/components/onboarding/Choices';
import { Button, Text, toast } from '@/components/ui';
import { baseHrv, COUCHER_DEFAUT, lastNight, nouvelleNuit, REVEIL_DEFAUT, sleepScore } from '@/lib/sommeil';
import { useProfil } from '@/store/profil';
import { colors, fonts } from '@/theme';

import { Sheet } from './Sheet';

const QUALITE = ['😫', '😕', '😐', '🙂', '😴'];

/** « 7:5 », « 0730 » → « 07:30 » ; vide si l'heure n'est pas valable. */
function heure(s: string): string {
  const m = s.trim().match(/^(\d{1,2})[:h ]?(\d{2})$/);
  if (!m) return '';
  const h = Number(m[1]);
  const mn = Number(m[2]);
  return h < 24 && mn < 60 ? String(h).padStart(2, '0') + ':' + String(mn).padStart(2, '0') : '';
}

/** « Ta nuit » : coucher, réveil, qualité, VFC nocturne et FC au repos facultatives (sleepSheet du prototype). */
export function NuitSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [coucher, setCoucher] = useState(COUCHER_DEFAUT);
  const [reveil, setReveil] = useState(REVEIL_DEFAUT);
  const [q, setQ] = useState(4);
  const [hv, setHv] = useState('');
  const [rh, setRh] = useState('');

  const enregistrer = () => {
    const n = nouvelleNuit(heure(coucher), heure(reveil), q, parseInt(hv, 10), parseInt(rh, 10));
    const st = useProfil.getState();
    st.noterNuit(n);
    onClose();
    const apres = useProfil.getState();
    toast('Nuit enregistrée : score ' + sleepScore(lastNight(apres.nights), baseHrv(apres.nights, apres.hrvChecks)) + '/100');
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Ta nuit">
      <View style={styles.two}>
        <Champ label="Couché à" value={coucher} onChange={setCoucher} placeholder="22:30" clavier="numbers-and-punctuation" />
        <Champ label="Réveillé à" value={reveil} onChange={setReveil} placeholder="07:30" clavier="numbers-and-punctuation" />
      </View>
      <Text style={styles.lbl}>Qualité</Text>
      <View style={styles.chips}>
        {QUALITE.map((e, i) => (
          <Chip key={e} label={e} on={q === i + 1} onPress={() => setQ(i + 1)} />
        ))}
      </View>
      <View style={styles.two}>
        <Champ label="VFC nocturne (ms)" value={hv} onChange={setHv} placeholder="optionnel" clavier="number-pad" />
        <Champ label="FC au repos" value={rh} onChange={setRh} placeholder="optionnel" clavier="number-pad" />
      </View>
      <View style={styles.espace} />
      <Button label="Enregistrer" onPress={enregistrer} />
    </Sheet>
  );
}

function Champ({
  label,
  value,
  onChange,
  placeholder,
  clavier,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  clavier: 'number-pad' | 'numbers-and-punctuation';
}) {
  return (
    <View style={styles.flex}>
      <Text style={styles.lbl}>{label}</Text>
      <TextInput
        style={styles.inp}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={clavier}
        maxLength={5}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  two: { flexDirection: 'row', gap: 10 },
  // .lbl : 14 px gras, marge 22 / 10 (réduite en haut dans la feuille)
  lbl: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 18, marginTop: 14, marginBottom: 10 },
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
  espace: { height: 14 },
});
