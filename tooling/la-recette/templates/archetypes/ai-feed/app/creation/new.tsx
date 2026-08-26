// Route COMPOSITION (`/creation/new`). À présenter en modal : dans `app/_layout.tsx`,
// `<Stack.Screen name="creation/new" options={{ presentation: 'modal' }} />`.
import { GenerateView } from '@/features/creations/generate-view';
import { Screen } from '@/ui/components/screen';

export default function NewCreationScreen() {
  return (
    <Screen keyboardAvoiding>
      <GenerateView />
    </Screen>
  );
}
