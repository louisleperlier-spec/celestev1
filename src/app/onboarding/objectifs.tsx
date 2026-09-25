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

  return (
    <ObScaffold
      step="objectifs"
      title={`Qu'est-ce qui te motive${name ? ', ' + name : ''} ?`}
      sub="Choisis un ou plusieurs objectifs."
      ok={goals.length > 0}
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
