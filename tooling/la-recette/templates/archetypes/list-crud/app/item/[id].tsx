// Route DÉTAIL (`/item/:id`). Wrapper fin autour de `ItemDetailView`.
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ItemDetailView } from '@/features/items/item-detail-view';
import { Screen } from '@/ui/components/screen';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return (
    <Screen keyboardAvoiding>
      <ItemDetailView id={id} onBack={() => router.back()} />
    </Screen>
  );
}
