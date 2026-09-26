import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { GoalRow } from '@/components/onboarding/Choices';
import { ObScaffold } from '@/components/onboarding/ObScaffold';
import { isIconName } from '@/components/ui';
import { GOALS } from '@/data';
import { useProfil } from '@/store/profil';

/** 2/8 — Objectifs, plusieurs choix (vObGoals). */
export default function Objectifs() {
  const name = useProfil((s) => s.name);
  const goals = useProfil((s) => s.goals);
  const toggleGoal = useProfil((s) => s.toggleGoal);
  // Depuis le Profil : écran « objectifs » du prototype (vGoals), puis les réglages.
  const profil = useLocalSearchParams<{ depuis?: string }>().depuis === 'profil';

  return (
    <ObScaffold
      step="objectifs"
      title={profil ? 'Quel est ton objectif principal ?' : `Qu'est-ce qui te motive${name ? ', ' + name : ''} ?`}
      sub={profil ? 'Tu peux en choisir plusieurs.' : 'Choisis un ou plusieurs objectifs.'}
      ok={goals.length > 0}
      horsOnboarding={profil ? { suivant: () => router.replace('/reglages') } : undefined}
    >
      <View>
        {GOALS.map(([k, label, icon]) => (
          <GoalRow
            key={k}
            icon={isIconName(icon) ? icon : 'target'}
            label={label}
            on={goals.includes(k)}
            onPress={() => toggleGoal(k)}
          />
        ))}
      </View>
    </ObScaffold>
  );
}
