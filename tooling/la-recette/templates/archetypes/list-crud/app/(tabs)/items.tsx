// Route onglet — LISTE. Wrapper fin : le corps vit dans `ItemsListView` (réutilisable).
import { ItemsListView } from '@/features/items/items-list-view';
import { Screen } from '@/ui/components/screen';

export default function ItemsScreen() {
  return (
    <Screen tabBarClearance>
      <ItemsListView />
    </Screen>
  );
}
