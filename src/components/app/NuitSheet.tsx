import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Chip } from '@/components/onboarding/Choices';
import { Button, Text, toast } from '@/components/ui';
import { nuitSante, santeDisponible } from '@/lib/sante';
import { baseHrv, heure, lastNight, nouvelleNuit, sleepScore } from '@/lib/sommeil';
import { useProfil } from '@/store/profil';
import { colors, fonts } from '@/theme';

import { Sheet } from './Sheet';

const QUALITE = ['😫', '😕', '😐', '🙂', '😴'];

/** « Ta nuit » : coucher, réveil, qualité, VFC nocturne et FC au repos facultatives (sleepSheet du prototype). */
export function NuitSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  // Heures proposées : celles des réglages des notifications (S.nset.bedT / wake).
  const nset = useProfil((s) => s.nset);
  const [coucher, setCoucher] = useState(nset.bedT);
  const [reveil, setReveil] = useState(nset.wake);
  const [q, setQ] = useState(4);
  const [hv, setHv] = useState('');
  const [rh, setRh] = useState('');
  const [sante, setSante] = useState(false);

  // Version native : la nuit de la montre est lue dans Apple Santé et préremplie (il reste la qualité à choisir).
  useEffect(() => {
    if (!visible || !santeDisponible()) return;
    let actif = true;
    nuitSante().then((n) => {
      if (!actif || !n) return;
      setCoucher(n.coucher);
      setReveil(n.reveil);
      if (n.hrv) setHv(String(n.hrv));
      if (n.rhr) setRh(String(n.rhr));
      setSante(true);
    });
    return () => {
      actif = false;
    };
  }, [visible]);

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
      {sante && <Text style={styles.sante}>Prérempli avec Apple Santé : choisis la qualité de ta nuit.</Text>}
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
  sante: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary, marginTop: -4 },
});
