// Archétype quiz-reco — calcul de la reco : PUR (aucun réseau, aucune dépendance UI) donc
// facile à tester et à faire évoluer. Additionne les poids de chaque choix retenu par reco,
// et renvoie la reco au plus gros score. Déterministe : à réponses égales, même résultat.

import { type Answers, type Outcome, type Question } from './types';

/** Score de chaque reco à partir des réponses (outcomeId → total des poids). */
export function scoreOutcomes(questions: Question[], answers: Answers): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const q of questions) {
    const choice = q.choices.find((c) => c.id === answers[q.id]);
    if (!choice) continue; // question non répondue → ignorée
    for (const [outcomeId, weight] of Object.entries(choice.weights)) {
      scores[outcomeId] = (scores[outcomeId] ?? 0) + weight;
    }
  }
  return scores;
}

/** La reco gagnante. En cas d'ÉGALITÉ, on garde la première de `outcomes` (l'ordre = la
 *  priorité / le défaut) → le résultat est stable et reproductible. */
export function computeReco(questions: Question[], answers: Answers, outcomes: Outcome[]): Outcome {
  const scores = scoreOutcomes(questions, answers);
  let best = outcomes[0];
  let bestScore = -Infinity;
  for (const outcome of outcomes) {
    const s = scores[outcome.id] ?? 0;
    if (s > bestScore) {
      bestScore = s;
      best = outcome;
    }
  }
  return best;
}

/** Vrai quand toutes les questions ont une réponse (le questionnaire est complet). */
export function isComplete(questions: Question[], answers: Answers): boolean {
  return questions.every((q) => typeof answers[q.id] === 'string');
}
