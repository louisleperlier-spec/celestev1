/**
 * Ordre de l'onboarding (refait d'après les designs 10K, oct. 2026) : prénom, discussion avec le coach (objectifs, niveau,
 * lieu, rythme), âge, poids, santé, coach, engagement, puis la préparation.
 */
export const OB_STEPS = ['prenom', 'discussion', 'age', 'poids', 'sante', 'coach', 'engagement', 'preparation'] as const;

export type ObStep = (typeof OB_STEPS)[number];

/** Nombre d'écrans affichés dans la barre de progression. */
export const OB_COUNT = 7;

export const obHref = (step: ObStep) => `/onboarding/${step}` as const;

export const obNext = (step: ObStep): ObStep => OB_STEPS[OB_STEPS.indexOf(step) + 1];
