// Route DÉTAIL d'une création (`/creation/:id`). Wrapper fin autour de `CreationDetailView`.
import { useLocalSearchParams, useRouter } from 'expo-router';

import { CreationDetailView } from '@/features/creations/creation-detail-view';
import { Screen } from '@/ui/components/screen';

export default function CreationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return (
    <Screen>
      <CreationDetailView id={id} onBack={() => router.back()} />
    </Screen>
  );
}
