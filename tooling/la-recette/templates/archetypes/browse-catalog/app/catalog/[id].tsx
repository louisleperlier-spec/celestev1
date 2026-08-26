// Route DÉTAIL (`/catalog/:id`). Wrapper fin autour de `CatalogDetailView`.
import { useLocalSearchParams } from 'expo-router';

import { CatalogDetailView } from '@/features/catalog/catalog-detail-view';
import { Screen } from '@/ui/components/screen';

export default function CatalogItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen>
      <CatalogDetailView id={id} />
    </Screen>
  );
}
