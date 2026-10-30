import { router } from 'expo-router';
import { View } from 'react-native';

import { GoalRow } from '@/components/onboarding/Choices';
import { ObScaffold } from '@/components/onboarding/ObScaffold';
import { isIconName } from '@/components/ui';
import { GOALS } from '@/data';
import { useProfil } from '@/store/profil';

/** Objectifs depuis le Profil (vGoals du prototype), puis les réglages ; dans l'onboarding, ils se choisissent dans la discussion. */
export default function Objectifs() {
  const goals = useProfil((s) => s.goals);
  const toggleGoal = useProfil((s) => s.toggleGoal);

  return (
    <ObScaffold
      title="Quel est ton objectif principal ?"
      sub="Tu peux en choisir plusieurs."
      ok={goals.length > 0}
      horsOnboarding={{ suivant: () => router.replace('/reglages') }}
    >
      <View>
        {GOALS.map(([k, label, icon]) => (
          <GoalRow key={k} icon={isIconName(icon) ? icon : 'target'} label={label} on={goals.includes(k)} onPress={() => toggleGoal(k)} />
        ))}
      </View>
    </ObScaffold>
  );
}
