import { StyleSheet, View } from 'react-native';

import { BigChoice, PetitChoix } from '@/components/onboarding/Choices';
import { ob, ObScaffold } from '@/components/onboarding/ObScaffold';
import { Text, type IconName } from '@/components/ui';
import { GEAR, MATERIEL, type LieuOnboarding } from '@/data';
import type { MaterielId } from '@/data/types';
import { useProfil } from '@/store/profil';
import { colors } from '@/theme';

const LIEUX: readonly [LieuOnboarding, string, IconName, string][] = [
  ['maison', 'À la maison', 'home', 'Avec ou sans équipement'],
  ['salle', 'En salle', 'dumb', 'Machines, barres et poulies'],
  ['deux', 'Les deux', 'swap', 'Selon tes envies'],
];

const ICONE_MATERIEL: Record<MaterielId, IconName> = { pdc: 'user', hal: 'dumb', bar: 'barre', mac: 'machine', pou: 'poulie', velo: 'bike' };

/** 4/8 — Lieu (vObPlace), avec le matériel que le programme utilisera. */
export default function Lieu() {
  const gear = useProfil((s) => s.gear);
  const set = useProfil((s) => s.set);
  const materiel = GEAR[gear];
  const lignes = [materiel.slice(0, 2), materiel.slice(2, 4), materiel.slice(4, 6)].filter((l) => l.length);
  return (
    <ObScaffold step="lieu" eyebrow="TON ENVIRONNEMENT" title="Où veux-tu t'entraîner ?" sub="Un programme adapté à ton matériel.">
      <View>
        {LIEUX.map(([k, titre, icon, desc]) => (
          <BigChoice key={k} icon={icon} title={titre} desc={desc} on={gear === k} onPress={() => set({ gear: k })} />
        ))}
      </View>
      <View style={styles.sep} />
      <Text style={[ob.lbl, styles.lbl]}>Ton matériel</Text>
      <View style={styles.grille}>
        {lignes.map((l, i) => (
          <View key={i} style={styles.rang}>
            {l.map((m) => (
              <PetitChoix key={m} icon={ICONE_MATERIEL[m]} label={MATERIEL[m]} on />
            ))}
            {l.length === 1 && <View style={styles.flex} />}
          </View>
        ))}
      </View>
    </ObScaffold>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sep: { height: 1, backgroundColor: colors.border, marginTop: 6 },
  lbl: { marginTop: 18 },
  grille: { gap: 10 },
  rang: { flexDirection: 'row', gap: 10 },
});
