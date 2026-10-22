import { View } from 'react-native';

import { BarresNiveau, BigChoice, InfoCarte } from '@/components/onboarding/Choices';
import { ObScaffold } from '@/components/onboarding/ObScaffold';
import type { NiveauId } from '@/lib/plan';
import { useProfil } from '@/store/profil';

const NIVEAUX: readonly [NiveauId, string, number, string][] = [
  ['deb', 'Débutant', 1, 'Je débute ou je reprends.'],
  ['int', 'Intermédiaire', 2, 'Je connais les bases.'],
  ['adv', 'Avancé', 3, "Je m'entraîne régulièrement."],
];

/** 3/8 — Niveau (vObLevel). */
export default function Niveau() {
  const level = useProfil((s) => s.level);
  const set = useProfil((s) => s.set);
  return (
    <ObScaffold step="niveau" eyebrow="TON EXPÉRIENCE" title="Quel est ton niveau ?" sub="On adapte le point de départ à ton expérience.">
      <View>
        {NIVEAUX.map(([k, titre, n, desc]) => (
          <BigChoice
            key={k}
            visuel={<BarresNiveau n={n} on={level === k} />}
            title={titre}
            desc={desc}
            on={level === k}
            onPress={() => set({ level: k, obCoachSet: false })}
          />
        ))}
      </View>
      <InfoCarte texte="Tu pourras ajuster les charges à chaque séance." style={{ marginTop: 12 }} />
    </ObScaffold>
  );
}
