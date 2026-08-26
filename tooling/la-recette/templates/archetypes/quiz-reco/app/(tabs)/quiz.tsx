// Route onglet — QUESTIONNAIRE. Wrapper fin : le corps vit dans `QuizView` (réutilisable).
import { QuizView } from '@/features/quiz/quiz-view';
import { Screen } from '@/ui/components/screen';

export default function QuizScreen() {
  return (
    <Screen tabBarClearance>
      <QuizView />
    </Screen>
  );
}
