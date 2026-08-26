// Route onglet — LISTE des habitudes. Wrapper fin autour de `HabitsListView`.
import { HabitsListView } from '@/features/habits/habits-list-view';
import { Screen } from '@/ui/components/screen';

export default function HabitsScreen() {
  return (
    <Screen tabBarClearance>
      <HabitsListView />
    </Screen>
  );
}
