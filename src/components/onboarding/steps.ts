/** Ordre de l'onboarding (`OB` du prototype) : 8 écrans avec barre de progression, puis la préparation. */
export const OB_STEPS = [
  'prenom',
  'objectifs',
  'niveau',
  'lieu',
  'rythme',
  'profil',
  'sante',
  'coach',
  'preparation',
] as const;

export type ObStep = (typeof OB_STEPS)[number];

/** Nombre d'écrans affichés dans la barre de progression. */
export const OB_COUNT = 8;

export const obHref = (step: ObStep) => `/onboarding/${step}` as const;

export const obNext = (step: ObStep): ObStep => OB_STEPS[OB_STEPS.indexOf(step) + 1];
