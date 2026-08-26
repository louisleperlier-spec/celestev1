// Route CRÉATION (`/item/new`). À présenter en modal : dans `app/_layout.tsx`, déclare
// `<Stack.Screen name="item/new" options={{ presentation: 'modal' }} />`.
import { ItemFormView } from '@/features/items/item-form-view';
import { Screen } from '@/ui/components/screen';

export default function NewItemScreen() {
  return (
    <Screen keyboardAvoiding>
      <ItemFormView />
    </Screen>
  );
}
