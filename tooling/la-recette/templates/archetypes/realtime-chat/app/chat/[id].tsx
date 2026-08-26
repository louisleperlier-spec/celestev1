// Route FIL (`/chat/:id`). Wrapper fin autour de `ChatView`. Le titre (autre participant)
// est passé en paramètre depuis la liste des conversations.
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ChatView } from '@/features/chat/chat-view';
import { Screen } from '@/ui/components/screen';

export default function ChatScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const router = useRouter();
  return (
    <Screen keyboardAvoiding>
      <ChatView conversationId={id} title={title} onBack={() => router.back()} />
    </Screen>
  );
}
