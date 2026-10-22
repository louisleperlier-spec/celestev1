import { StyleSheet, View } from 'react-native';

import { InfoCarte, NombresSegmentes, PetitChoix } from '@/components/onboarding/Choices';
import { ob, ObScaffold } from '@/components/onboarding/ObScaffold';
import { Text } from '@/components/ui';
import type { Duree, Jours } from '@/lib/plan';
import { useProfil } from '@/store/profil';

const JOURS: readonly Jours[] = [2, 3, 4, 5, 6, 7];
const DUREES: readonly Duree[] = [20, 30, 45, 60];

/** 5/8 — Rythme : séances par semaine et durée (vObDays). */
export default function Rythme() {
  const days = useProfil((s) => s.days);
  const dur = useProfil((s) => s.dur);
  const set = useProfil((s) => s.set);
  return (
    <ObScaffold step="rythme" eyebrow="TON RYTHME" title="Une routine qui tient." sub="Choisis un rythme réaliste pour toi.">
      <Text style={[ob.lbl, ob.first]}>Séances par semaine</Text>
      <NombresSegmentes valeurs={JOURS} value={days} onChange={(n) => set({ days: n })} />
      <Text style={ob.lbl}>Durée d&apos;une séance</Text>
      <View style={styles.grid}>
        {[DUREES.slice(0, 2), DUREES.slice(2)].map((ligne, i) => (
          <View key={i} style={styles.row}>
            {ligne.map((v) => (
              <PetitChoix key={v} icon="clock" label={`${v} min`} on={dur === v} onPress={() => set({ dur: v })} />
            ))}
          </View>
        ))}
      </View>
      <InfoCarte
        icon="cal"
        titre={`${days} séances de ${dur} min / semaine`}
        texte={
          days <= 3
            ? 'Parfait pour démarrer et tenir dans la durée.'
            : days <= 5
              ? 'Un bon rythme pour progresser vite.'
              : 'Rythme intense : ton coach prévoit des séances plus légères.'
        }
        style={styles.resume}
      />
    </ObScaffold>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  resume: { marginTop: 22 },
});
