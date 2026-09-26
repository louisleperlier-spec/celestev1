import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Button, Text, toast } from '@/components/ui';
import { DELAIS } from '@/lib/notifs';
import { heure } from '@/lib/sommeil';
import { autorisation, demanderAutorisation, type Autorisation } from '@/store/notifs';
import { useProfil } from '@/store/profil';
import { colors, fonts, ui } from '@/theme';

import { Sheet } from './Sheet';

/** « Réglages des notifications » (nsetSheet du prototype). */
export function NotifSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const n = useProfil((s) => s.nset);
  const [post, setPost] = useState(n.post);
  const [delay, setDelay] = useState(n.delay);
  const [sleep, setSleep] = useState(n.sleep);
  const [wake, setWake] = useState(n.wake);
  const [bed, setBed] = useState(n.bed);
  const [bedT, setBedT] = useState(n.bedT);
  const [perm, setPerm] = useState<Autorisation>('undetermined');

  useEffect(() => {
    if (!visible) return;
    let actif = true;
    autorisation().then((p) => actif && setPerm(p));
    return () => {
      actif = false;
    };
  }, [visible]);

  const enregistrer = () => {
    useProfil.getState().reglerNotifs({ post, delay, sleep, wake: heure(wake) || '07:30', bed, bedT: heure(bedT) || '22:30' });
    onClose();
    toast('Réglages enregistrés');
  };

  const autoriser = async () => {
    const r = await demanderAutorisation();
    setPerm(r);
    toast(r === 'granted' ? 'Notifications autorisées' : 'Notifications refusées');
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Réglages des notifications">
      <Bascule titre="VFC post-entraînement" sous="Rappel pour mesurer ta récupération après chaque séance" on={post} onChange={setPost} />
      <View style={styles.sub}>
        <Text style={styles.subTxt}>Délai après la séance</Text>
      </View>
      <View style={styles.delais}>
        {DELAIS.map(([v, l]) => (
          <Pressable key={v} accessibilityRole="button" accessibilityState={{ selected: delay === v }} onPress={() => setDelay(v)} style={[styles.delai, delay === v && styles.delaiOn]}>
            <Text weight="semibold" style={styles.delaiTxt}>
              {l}
            </Text>
          </Pressable>
        ))}
      </View>
      <Bascule titre="Bilan de la nuit" sous="Le matin : sommeil, VFC nocturne et score de récupération" on={sleep} onChange={setSleep} />
      <Heure label="Heure du réveil" value={wake} onChange={setWake} />
      <Bascule titre="Rappel du coucher" sous="Pour viser 8 h de sommeil" on={bed} onChange={setBed} />
      <Heure label="Heure du coucher" value={bedT} onChange={setBedT} />
      <Button
        label={
          perm === 'granted'
            ? 'Notifications du téléphone autorisées'
            : perm === 'indisponible'
              ? 'Notifications du téléphone indisponibles ici'
              : "Autoriser aussi hors de l'app"
        }
        variant="dark"
        disabled={perm === 'granted' || perm === 'indisponible'}
        onPress={autoriser}
        style={styles.perm}
      />
      <View style={styles.espace} />
      <Button label="Enregistrer" onPress={enregistrer} />
    </Sheet>
  );
}

/** Ligne à interrupteur (.tg). */
function Bascule({ titre, sous, on, onChange }: { titre: string; sous: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.tg}>
      <View style={styles.flex}>
        <Text weight="bold" style={styles.tgB}>
          {titre}
        </Text>
        <Text style={styles.tgSmall}>{sous}</Text>
      </View>
      <Switch value={on} onValueChange={onChange} trackColor={{ true: colors.pink, false: colors.border2 }} thumbColor={colors.text} accessibilityLabel={titre} />
    </View>
  );
}

/** Heure réglable (.tgsub + input time). */
function Heure({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.sub}>
      <Text style={styles.subTxt}>{label}</Text>
      <TextInput
        style={styles.inp}
        value={value}
        onChangeText={onChange}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        placeholder="07:30"
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  tg: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 14, paddingBottom: 6, borderTopWidth: 1, borderColor: colors.border },
  tgB: { fontSize: 14, lineHeight: 18 },
  tgSmall: { fontSize: 12, lineHeight: 16, color: colors.textSecondary, marginTop: 2 },
  sub: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, paddingBottom: 10 },
  subTxt: { fontSize: 13, lineHeight: 17, color: ui.text3 },
  delais: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 10, marginTop: -4 },
  delai: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10, backgroundColor: ui.iconBg, borderWidth: 1, borderColor: colors.border2 },
  delaiOn: { borderColor: colors.pink, backgroundColor: 'rgba(255,79,163,0.16)' },
  delaiTxt: { fontSize: 13, lineHeight: 17 },
  inp: {
    minWidth: 84,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: ui.iconBg,
    borderWidth: 1,
    borderColor: colors.border2,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'center',
  },
  perm: { marginTop: 14 },
  espace: { height: 10 },
});
