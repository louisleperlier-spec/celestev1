// Généré depuis NEA-donnees-et-images.zip (identique aux constantes du prototype `prototype/nea-app.html`).
// Ne pas modifier à la main : corriger la source puis régénérer.

import type { JoursParSemaine, SpecialId, Template, TemplateId, ExerciceId } from './types';

/** Modèles de séance (`TPL`). */
export const TEMPLATES: Readonly<Record<TemplateId, Template>> = {
  haut: [
    'Haut du corps',
    ['pecs', 'dos', 'epaules', 'pecs', 'dos', 'biceps', 'triceps'],
  ],
  bas: [
    'Bas du corps',
    ['quads', 'ischios', 'fessiers', 'quads', 'mollets', 'abdos'],
  ],
  push: [
    'Push : pecs, épaules, triceps',
    ['pecs', 'pecs', 'epaules', 'epaules', 'triceps', 'triceps'],
  ],
  pull: [
    'Pull : dos et biceps',
    ['dos', 'dos', 'dos', 'epaules', 'biceps', 'biceps'],
  ],
  jambes: [
    'Jambes et fessiers',
    ['quads', 'quads', 'ischios', 'fessiers', 'fessiers', 'mollets'],
  ],
  cardio: [
    'Cardio et gainage',
    ['cardio', 'cardio', 'abdos', 'abdos', 'quads'],
  ],
  doux_full: [
    'Mobilité et renfo doux',
    ['abdos', 'fessiers', 'dos', 'quads', 'pecs', 'abdos'],
  ],
  doux_haut: [
    'Haut du corps en douceur',
    ['pecs', 'dos', 'epaules', 'biceps', 'abdos'],
  ],
  doux_bas: [
    'Bas du corps et gainage',
    ['fessiers', 'quads', 'ischios', 'abdos', 'abdos'],
  ],
  circuit_full: [
    'Circuit endurance',
    ['cardio', 'quads', 'pecs', 'dos', 'quads', 'abdos'],
  ],
  circuit_haut: [
    'Circuit haut du corps',
    ['cardio', 'pecs', 'dos', 'epaules', 'triceps', 'abdos'],
  ],
  circuit_bas: [
    'Circuit jambes',
    ['cardio', 'quads', 'quads', 'fessiers', 'ischios', 'mollets'],
  ],
  hiit_full: [
    'HIIT full body',
    ['cardio', 'quads', 'pecs', 'fessiers', 'abdos', 'cardio'],
  ],
  hiit_bas: [
    'HIIT jambes',
    ['quads', 'cardio', 'fessiers', 'quads', 'abdos'],
  ],
  hiit_haut: [
    'HIIT haut du corps',
    ['pecs', 'cardio', 'epaules', 'biceps', 'abdos'],
  ],
  hiit_abdos: [
    'Abdos express',
    ['abdos', 'cardio', 'abdos', 'abdos', 'cardio'],
  ],
  explo_haut: [
    'Haut du corps explosif',
    ['pecs', 'dos', 'pecs', 'dos', 'epaules', 'triceps'],
  ],
  explo_bas: [
    'Jambes explosives',
    ['quads', 'ischios', 'quads', 'fessiers', 'cardio'],
  ],
  explo_full: [
    'Full body intense',
    ['quads', 'pecs', 'dos', 'fessiers', 'cardio'],
  ],
  force_a: [
    'Force A : squat et développé',
    ['@squat', '@bench', 'dos', 'abdos'],
  ],
  force_b: [
    'Force B : soulevé et épaules',
    ['@deadlift', 'epaules', 'dos', 'triceps'],
  ],
  force_c: [
    'Force C : volume',
    ['quads', 'pecs', 'dos', 'ischios', 'abdos'],
  ],
  bras: [
    'Bras et épaules',
    ['biceps', 'triceps', 'epaules', 'biceps', 'triceps', 'epaules'],
  ],
  seche: [
    'Sèche musclée',
    ['quads', 'pecs', 'dos', 'epaules', 'abdos', 'cardio'],
  ],
  doux_dos: [
    'Dos sans douleur',
    ['abdos', 'dos', 'fessiers', 'abdos', 'epaules', 'abdos'],
  ],
  velo_jambes: [
    'Prépa vélo : jambes',
    ['cardio', 'quads', 'ischios', 'fessiers', 'mollets', 'abdos'],
  ],
  express: [
    'Express 30 min',
    ['quads', 'pecs', 'dos', 'abdos', 'cardio'],
  ],
  abdos_ete: [
    "Abdos d'été",
    ['abdos', 'abdos', 'cardio', 'abdos', 'fessiers'],
  ],
  athlete: [
    'Athlète complet',
    ['quads', 'dos', 'pecs', 'ischios', 'epaules', 'cardio'],
  ],
};

/** Exercices possibles pour chaque mouvement de force (`SPECIAL`). */
export const SPECIAL: Readonly<Record<SpecialId, readonly ExerciceId[]>> = {
  squat: ['squat_barre', 'goblet_squat', 'squat_bulgare', 'presse_cuisses', 'squat_poids_corps'],
  bench: ['developpe_couche_barre', 'developpe_couche_halteres', 'presse_pectoraux', 'pompes'],
  deadlift: ['souleve_terre', 'souleve_roumain', 'hip_thrust', 'pont_fessier'],
};

/** Jours de la semaine (0 = lundi) où placer les séances selon leur nombre (`DAYSPOS`). */
export const DAYSPOS: Readonly<Record<JoursParSemaine, readonly number[]>> = {
  '2': [1, 4],
  '3': [0, 2, 4],
  '4': [0, 2, 4, 5],
  '5': [0, 1, 2, 4, 5],
  '6': [0, 1, 2, 3, 4, 5],
  '7': [0, 1, 2, 3, 4, 5, 6],
};
