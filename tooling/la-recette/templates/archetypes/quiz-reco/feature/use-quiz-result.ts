// Archétype quiz-reco — hooks React Query pour le résultat PERSISTÉ (lecture + sauvegarde).
// Clé de cache scopée par utilisateur : après changement de compte sur le même appareil, on
// ne réaffiche jamais la reco du précédent.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-context';

import * as repo from './quiz-results-repository';
import { type Answers } from './types';

function useUid() {
  const { user } = useAuth();
  return user?.id ?? 'anon';
}

/** Le dernier résultat de l'utilisateur (null s'il n'a pas encore fini le questionnaire). */
export function useLatestResult() {
  const uid = useUid();
  return useQuery({
    queryKey: ['quiz_result', uid],
    queryFn: repo.getLatestResult,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
  });
}

/** Enregistre un résultat, puis rafraîchit la reco affichée. */
export function useSaveResult() {
  const qc = useQueryClient();
  const uid = useUid();
  return useMutation({
    mutationFn: (input: { outcomeId: string; answers: Answers }) => repo.saveResult(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz_result', uid] }),
  });
}
