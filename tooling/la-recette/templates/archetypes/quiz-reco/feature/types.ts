// Archétype quiz-reco — types.
// ADAPTER : ce sont des types GÉNÉRIQUES (une question, un choix, une reco). Tu ne renommes
// pas ces types — tu remplaces le CONTENU dans `questions.ts` (les vraies questions/recos de
// ton app) et les poids qui mènent à chaque reco. Un `id` d'outcome est une simple string.

/** Un choix proposé pour une question. `weights` = combien ce choix pousse vers chaque reco.
 *  Ex. `{ calme: 2, energie: 0 }`. Les clés sont des ids d'`Outcome`. */
export type Choice = {
  id: string;
  /** Clé i18n du libellé du choix (jamais un texte en dur). */
  labelKey: string;
  weights: Record<string, number>;
};

/** Une question du questionnaire (une par écran). */
export type Question = {
  id: string;
  /** Clé i18n de l'intitulé de la question. */
  promptKey: string;
  choices: Choice[];
};

/** Une reco possible (le RÉSULTAT montré à la fin). Son `id` est ce qu'on persiste. */
export type Outcome = {
  id: string;
  /** Clés i18n du titre et de la description de la reco. */
  titleKey: string;
  descriptionKey: string;
};

/** Réponses de l'utilisateur : questionId → choiceId. */
export type Answers = Record<string, string>;

/** Un résultat persisté (table `quiz_results`). `answers` gardé pour audit / re-calcul. */
export type QuizResult = {
  id: string;
  outcome_id: string;
  answers: Answers;
  created_at: string;
};
