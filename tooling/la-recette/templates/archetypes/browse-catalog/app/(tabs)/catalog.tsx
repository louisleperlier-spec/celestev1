// Route onglet — CATALOGUE. Wrapper fin : le corps vit dans `CatalogView` (réutilisable).
import { CatalogView } from '@/features/catalog/catalog-view';
import { Screen } from '@/ui/components/screen';

export default function CatalogScreen() {
  return (
    <Screen tabBarClearance>
      <CatalogView />
    </Screen>
  );
}
