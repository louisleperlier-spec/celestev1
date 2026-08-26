// Route onglet — TIMER. Wrapper fin autour de `TimerView`.
import { Screen } from '@/ui/components/screen';
import { TimerView } from '@/features/sessions/timer-view';

export default function TimerScreen() {
  return (
    <Screen tabBarClearance>
      <TimerView />
    </Screen>
  );
}
