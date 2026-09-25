import { View } from 'react-native';

import { BigChoice } from '@/components/onboarding/Choices';
import { ObScaffold } from '@/components/onboarding/ObScaffold';
import type { IconName } from '@/components/ui';
import type { LieuOnboarding } from '@/data';
import { useProfil } from '@/store/profil';

const LIEUX: readonly [LieuOnboarding, string, IconName, string][] = [
  ['maison', 'À la maison', 'home', 'Poids du corps et haltères'],
  ['salle', 'En salle', 'dumb', 'Barres, machines et poulies'],
  ['deux', 'Les deux', 'cloud', 'Je varie selon les jours'],
];

/** 4/8 — Lieu (vObPlace). */
export default function Lieu() {
  const gear = useProfil((s) => s.gear);
  const set = useProfil((s) => s.set);
  return (
    <ObScaffold
      step="lieu"
      title="Où tu t'entraînes ?"
      sub="Ton programme utilisera seulement le matériel dont tu disposes."
    >
      <View>
        {LIEUX.map(([k, titre, icon, desc]) => (
          <BigChoice key={k} icon={icon} title={titre} desc={desc} on={gear === k} onPress={() => set({ gear: k })} />
        ))}
      </View>
    </ObScaffold>
  );
}
