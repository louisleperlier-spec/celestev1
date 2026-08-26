// Archétype quiz-reco — LE CONTENU (c'est ICI qu'on adapte l'app à l'idée).
// Les questions, leurs choix, les poids vers chaque reco, et la liste des recos possibles.
// Aucune logique ici : juste de la donnée pure → facile à relire, à modifier, à tester.
//
// ADAPTER :
//   • Remplace ces questions par les tiennes (garde 3 à 6 questions : au-delà, l'utilisateur
//     décroche). Chaque `promptKey` / `labelKey` / `titleKey` renvoie à une clé i18n.
//   • Règle les `weights` : chaque choix pousse vers une ou plusieurs recos. La reco au plus
//     gros score gagne (voir `reco.ts`). Une reco « par défaut » = choix qui ne pointent nulle
//     part → c'est `OUTCOMES[0]` qui sort en cas d'égalité (ordre = priorité).
//   • Ajoute/retire des recos dans `OUTCOMES`. L'`id` d'une reco est ce qui est PERSISTÉ en
//     base : ne le change pas après le lancement (sinon les résultats gardés deviennent muets).

import { type Outcome, type Question } from './types';

/** Les recos possibles (résultats). Le PREMIER sert de défaut en cas d'égalité de score. */
export const OUTCOMES: Outcome[] = [
  { id: 'starter', titleKey: 'quiz.reco.starter.title', descriptionKey: 'quiz.reco.starter.desc' },
  { id: 'builder', titleKey: 'quiz.reco.builder.title', descriptionKey: 'quiz.reco.builder.desc' },
  { id: 'pro', titleKey: 'quiz.reco.pro.title', descriptionKey: 'quiz.reco.pro.desc' },
];

/** Le questionnaire, dans l'ordre d'affichage (une question = un écran). */
export const QUESTIONS: Question[] = [
  {
    id: 'level',
    promptKey: 'quiz.q.level.prompt',
    choices: [
      { id: 'new', labelKey: 'quiz.q.level.new', weights: { starter: 2 } },
      { id: 'some', labelKey: 'quiz.q.level.some', weights: { builder: 2 } },
      { id: 'expert', labelKey: 'quiz.q.level.expert', weights: { pro: 2 } },
    ],
  },
  {
    id: 'time',
    promptKey: 'quiz.q.time.prompt',
    choices: [
      { id: 'low', labelKey: 'quiz.q.time.low', weights: { starter: 2 } },
      { id: 'medium', labelKey: 'quiz.q.time.medium', weights: { builder: 2 } },
      { id: 'high', labelKey: 'quiz.q.time.high', weights: { pro: 2, builder: 1 } },
    ],
  },
  {
    id: 'goal',
    promptKey: 'quiz.q.goal.prompt',
    choices: [
      { id: 'discover', labelKey: 'quiz.q.goal.discover', weights: { starter: 2 } },
      { id: 'progress', labelKey: 'quiz.q.goal.progress', weights: { builder: 2 } },
      { id: 'master', labelKey: 'quiz.q.goal.master', weights: { pro: 2 } },
    ],
  },
];
