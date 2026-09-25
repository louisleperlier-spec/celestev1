// Généré depuis NEA-donnees-et-images.zip (identique aux constantes du prototype `prototype/nea-app.html`).
// Ne pas modifier à la main : corriger la source puis régénérer.

import type { GoalFiltre, GroupeId, LieuId, LieuOnboarding, MaterielId, Goal } from './types';

/** Libellés des groupes musculaires (`GRP`). */
export const GROUPES: Readonly<Record<GroupeId, string>> = {
  pecs: 'Pectoraux',
  dos: 'Dos',
  epaules: 'Épaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quads: 'Cuisses',
  ischios: 'Ischios',
  fessiers: 'Fessiers',
  mollets: 'Mollets',
  abdos: 'Abdos',
  cardio: 'Cardio',
};

/** Libellés du matériel (`EQN`). */
export const MATERIEL: Readonly<Record<MaterielId, string>> = {
  pdc: 'Poids du corps',
  hal: 'Haltères',
  bar: 'Barre',
  mac: 'Machine',
  pou: 'Poulie',
  velo: 'Vélo',
};

/** Libellés des lieux (`LIEUX`). */
export const LIEUX: Readonly<Record<LieuId, string>> = {
  maison: 'À la maison',
  salle: 'Salle de sport',
  ext: 'En extérieur',
};

/** Matériel disponible selon le lieu choisi à l'onboarding (`GEAR`). */
export const GEAR: Readonly<Record<LieuOnboarding, readonly MaterielId[]>> = {
  maison: ['pdc', 'hal'],
  salle: ['pdc', 'hal', 'bar', 'mac', 'pou', 'velo'],
  deux: ['pdc', 'hal', 'bar', 'mac', 'pou', 'velo'],
};

/** Objectifs de l'onboarding (`GOALS`). */
export const GOALS: readonly Goal[] = [
  ['masse', 'Prendre de la masse musculaire', 'dumb'],
  ['poids', 'Perdre du poids', 'scale'],
  ['forme', 'Être plus en forme au quotidien', 'sun'],
  ['endu', 'Améliorer mon endurance', 'pulse'],
  ['mental', 'Me sentir mieux mentalement', 'smile'],
  ['disc', 'Être plus discipliné', 'target'],
  ['conf', 'Retrouver confiance en moi', 'heart'],
];

/** Filtres par objectif du catalogue (`GOALF`). */
export const GOALF: readonly GoalFiltre[] = [
  'Tous',
  'Prise de muscle',
  'Perte de graisse',
  'Tonification',
  'Force',
  'Endurance',
  'Posture',
];
