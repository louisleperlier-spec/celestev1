// Archétype quiz-reco — accès données du RÉSULTAT persisté (table `quiz_results`).
// SEUL endroit qui parle à Supabase pour cette entité. On garde le DERNIER résultat de
// l'utilisateur (l'app affiche sa reco actuelle) ; l'historique reste disponible en base.
import { supabase } from '@/services/supabase/client';

import { type Answers, type QuizResult } from './types';

/** Le dernier résultat de l'utilisateur, ou null s'il n'a jamais fini le questionnaire.
 *  `maybeSingle` → null propre (pas d'erreur) quand il n'y a rien. */
export async function getLatestResult(): Promise<QuizResult | null> {
  const { data, error } = await supabase
    .from('quiz_results')
    .select('id, outcome_id, answers, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as QuizResult | null;
}

/** Enregistre un résultat pour l'utilisateur connecté. `user_id` posé ici (jamais par le
 *  client à l'aveugle) : c'est ce que vérifie la policy RLS. */
export async function saveResult(input: { outcomeId: string; answers: Answers }): Promise<QuizResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not_authenticated');

  const { data, error } = await supabase
    .from('quiz_results')
    .insert({ user_id: user.id, outcome_id: input.outcomeId, answers: input.answers })
    .select('id, outcome_id, answers, created_at')
    .single();
  if (error) throw error;
  return data as QuizResult;
}
