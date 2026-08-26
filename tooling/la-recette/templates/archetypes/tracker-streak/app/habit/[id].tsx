// Route DÉTAIL d'une habitude (`/habit/:id`). Wrapper fin autour de `HabitDetailView`.
import { useLocalSearchParams, useRouter } from 'expo-router';

import { HabitDetailView } from '@/features/habits/habit-detail-view';
import { Screen } from '@/ui/components/screen';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return (
    <Screen>
      <HabitDetailView id={id} onBack={() => router.back()} />
    </Screen>
  );
}
