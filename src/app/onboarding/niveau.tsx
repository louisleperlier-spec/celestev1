import { View } from 'react-native';

import { BigChoice } from '@/components/onboarding/Choices';
import { ObScaffold } from '@/components/onboarding/ObScaffold';
import type { IconName } from '@/components/ui';
import type { NiveauId } from '@/lib/plan';
import { useProfil } from '@/store/profil';

const NIVEAUX: readonly [NiveauId, string, IconName, string][] = [
  ['deb', 'Débutant', 'check', 'Je débute ou je reprends après une longue pause'],
  ['int', 'Intermédiaire', 'star', "Je m'entraîne depuis quelques mois, je connais les bases"],
  ['adv', 'Avancé', 'spark', "Je m'entraîne régulièrement depuis plus d'un an"],
];

/** 3/8 — Niveau (vObLevel). */
export default function Niveau() {
  const level = useProfil((s) => s.level);
  const set = useProfil((s) => s.set);
  return (
    <ObScaffold step="niveau" title="Ton niveau actuel ?" sub="Pas de jugement, c'est pour doser tes charges.">
      <View>
        {NIVEAUX.map(([k, titre, icon, desc]) => (
          <BigChoice
            key={k}
            icon={icon}
            title={titre}
            desc={desc}
            on={level === k}
            onPress={() => set({ level: k, obCoachSet: false })}
          />
        ))}
      </View>
    </ObScaffold>
  );
}
