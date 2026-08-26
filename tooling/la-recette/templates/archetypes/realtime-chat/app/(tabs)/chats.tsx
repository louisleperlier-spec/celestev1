// Route onglet — CONVERSATIONS. Wrapper fin autour de `ConversationsView`.
import { ConversationsView } from '@/features/chat/conversations-view';
import { Screen } from '@/ui/components/screen';

export default function ChatsScreen() {
  return (
    <Screen tabBarClearance>
      <ConversationsView />
    </Screen>
  );
}
