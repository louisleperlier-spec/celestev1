// Route onglet — HISTORIQUE des séances. Wrapper fin autour de `HistoryView`.
import { HistoryView } from '@/features/sessions/history-view';
import { Screen } from '@/ui/components/screen';

export default function HistoryScreen() {
  return (
    <Screen tabBarClearance>
      <HistoryView />
    </Screen>
  );
}
