// Route onglet — FEED. Wrapper fin autour de `FeedView`.
import { FeedView } from '@/features/creations/feed-view';
import { Screen } from '@/ui/components/screen';

export default function FeedScreen() {
  return (
    <Screen tabBarClearance>
      <FeedView />
    </Screen>
  );
}
