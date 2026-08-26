// Archétype quiz-reco — la machine à états LOCALE du questionnaire (aucun réseau).
// Gère l'étape courante, les réponses, l'avancement (progress), le retour arrière et le reset.
// La persistance du résultat vit ailleurs (`use-quiz-result.ts`) — ce hook ne fait que piloter
// le parcours à l'écran.
import { useCallback, useMemo, useState } from 'react';

import { QUESTIONS } from './questions';
import { type Answers } from './types';

export function useQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const total = QUESTIONS.length;
  const current = QUESTIONS[step];
  // Progression AVANT la question courante (0 → 1). Sert la barre de progression.
  const progress = useMemo(() => step / total, [step, total]);
  const isLast = step >= total - 1;

  /** Enregistre le choix de la question courante et avance (sauf sur la dernière). */
  const select = useCallback(
    (choiceId: string) => {
      const q = QUESTIONS[step];
      setAnswers((prev) => ({ ...prev, [q.id]: choiceId }));
      setStep((s) => Math.min(s + 1, total - 1));
    },
    [step, total],
  );

  /** Recule d'une question (sans effacer la réponse déjà donnée). */
  const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  /** Repart de zéro (pour « recommencer le questionnaire »). */
  const reset = useCallback(() => {
    setStep(0);
    setAnswers({});
  }, []);

  return {
    step,
    total,
    current,
    answers,
    progress,
    isLast,
    isFirst: step === 0,
    /** La question courante a-t-elle déjà une réponse ? (pour surligner le choix retenu). */
    selectedChoiceId: answers[current.id] ?? null,
    select,
    back,
    reset,
    setAnswers,
  };
}
