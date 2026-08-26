// Route RÉSULTAT (`/result`). Wrapper fin autour de `ResultView`.
// « Recommencer » renvoie vers l'onglet questionnaire avec un jeton `retake` qui change à
// chaque fois → `QuizView` réinitialise et relance le test directement.
import { useRouter } from 'expo-router';

import { ResultView } from '@/features/quiz/result-view';
import { Screen } from '@/ui/components/screen';

export default function ResultScreen() {
  const router = useRouter();
  return (
    <Screen>
      <ResultView
        onRetake={() => router.navigate({ pathname: '/quiz', params: { retake: String(Date.now()) } })}
      />
    </Screen>
  );
}
