import { StyleSheet, View } from 'react-native';

import { Chip, Option } from '@/components/onboarding/Choices';
import { ob, ObScaffold } from '@/components/onboarding/ObScaffold';
import { Text } from '@/components/ui';
import type { Duree, Jours } from '@/lib/plan';
import { useProfil } from '@/store/profil';

const JOURS: readonly Jours[] = [2, 3, 4, 5, 6, 7];
const DUREES: readonly [Duree, string, string][] = [
  [20, '20 min', 'Express'],
  [30, '30 min', 'Court'],
  [45, '45 min', 'Classique'],
  [60, '60 min', 'Complet'],
];

/** 5/8 — Rythme : séances par semaine et durée (vObDays). */
export default function Rythme() {
  const days = useProfil((s) => s.days);
  const dur = useProfil((s) => s.dur);
  const set = useProfil((s) => s.set);
  return (
    <ObScaffold step="rythme" title="Ton rythme" sub="Combien de séances par semaine, et combien de temps ?">
      <Text style={[ob.lbl, ob.first]}>Séances par semaine</Text>
      <View style={styles.chips}>
        {JOURS.map((n) => (
          <Chip key={n} label={String(n)} on={days === n} onPress={() => set({ days: n })} />
        ))}
      </View>
      <Text style={ob.note}>
        {days <= 3
          ? 'Parfait pour démarrer et tenir dans la durée.'
          : days <= 5
            ? 'Un bon rythme pour progresser vite.'
            : 'Rythme intense : ton coach prévoit des séances plus légères.'}
      </Text>
      <Text style={ob.lbl}>Durée d&apos;une séance</Text>
      <View style={styles.grid}>
        {[DUREES.slice(0, 2), DUREES.slice(2)].map((ligne, i) => (
          <View key={i} style={styles.row}>
            {ligne.map(([v, label, small]) => (
              <Option key={v} label={label} small={small} on={dur === v} onPress={() => set({ dur: v })} />
            ))}
          </View>
        ))}
      </View>
    </ObScaffold>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: 8 },
  grid: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
});
