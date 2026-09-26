// Généré depuis NEA-donnees-et-images.zip (identique aux constantes du prototype `prototype/nea-app.html`).
// Ne pas modifier à la main : corriger la source puis régénérer.

import type { CoachId, Programme } from './types';

/** 3 programmes par coach, 18 au total (`PROGS`). Le premier de chaque coach est gratuit. */
export const PROGRAMMES: Readonly<Record<CoachId, readonly Programme[]>> = {
  axel: [
    {
      id: 'masse',
      nom: 'Masse 8 semaines',
      sem: 8,
      desc: 'Le classique pour prendre du muscle : charges progressives chaque semaine.',
    },
    {
      id: 'bras',
      nom: 'Bras et épaules',
      sem: 6,
      desc: 'Priorité aux bras et aux épaules, le reste en entretien.',
      tpls: ['bras', 'bas', 'haut', 'bras'],
    },
    {
      id: 'seche',
      nom: 'Sèche musclée',
      sem: 6,
      desc: 'Garder le muscle en perdant du gras : plus de reps, repos courts, cardio.',
      tpls: ['seche', 'push', 'pull', 'jambes'],
      reps: [12, 15],
      rest: 45,
    },
  ],
  nova: [
    {
      id: 'doux',
      nom: 'Remise en forme douce',
      sem: 4,
      desc: 'Reprendre en douceur, sans courbatures violentes.',
    },
    {
      id: 'dos',
      nom: 'Dos sans douleur',
      sem: 6,
      desc: 'Gainage et renfo du dos pour mieux vivre au quotidien.',
      tpls: ['doux_dos', 'doux_bas', 'doux_dos', 'doux_haut'],
    },
    {
      id: 'zen',
      nom: 'Mobilité et respiration',
      sem: 4,
      desc: 'Mouvements lents, respiration, repos plus longs.',
      tpls: ['doux_full'],
      reps: [10, 12],
      rest: 60,
    },
  ],
  kai: [
    {
      id: 'base',
      nom: 'Base endurance',
      sem: 8,
      desc: 'Construire ton souffle avec des circuits réguliers.',
    },
    {
      id: 'velo',
      nom: 'Prépa vélo',
      sem: 6,
      desc: 'Jambes solides et cardio pour rouler plus loin.',
      tpls: ['velo_jambes', 'cardio', 'circuit_haut', 'velo_jambes'],
    },
    {
      id: 'circuit',
      nom: 'Circuit 30 minutes',
      sem: 4,
      desc: 'Peu de temps ? Deux tours, repos minimum.',
      tpls: ['circuit_full', 'circuit_bas', 'circuit_haut'],
      sets: [2, 2, 3],
      rest: 20,
    },
  ],
  luna: [
    {
      id: 'hiit',
      nom: 'HIIT fun',
      sem: 6,
      desc: 'Des intervalles variés qui passent vite.',
    },
    {
      id: 'abdos',
      nom: "Abdos d'été",
      sem: 4,
      desc: 'Gainage, abdos et cardio pour un ventre solide.',
      tpls: ['abdos_ete', 'hiit_full', 'abdos_ete', 'hiit_bas'],
    },
    {
      id: 'express',
      nom: 'Express 15 minutes',
      sem: 4,
      desc: "30 s d'effort, 2 tours : parfait avant le travail.",
      tpls: ['hiit_full', 'hiit_haut', 'hiit_bas'],
      time: 30,
      sets: [2, 2, 2],
    },
  ],
  blaze: [
    {
      id: 'power',
      nom: 'Puissance',
      sem: 6,
      desc: 'Explosivité et charges lourdes.',
    },
    {
      id: 'athlete',
      nom: 'Athlète complet',
      sem: 8,
      desc: 'Force, vitesse et cardio dans chaque séance.',
      tpls: ['athlete', 'explo_haut', 'athlete', 'explo_bas'],
    },
    {
      id: 'burn',
      nom: 'Burn 30',
      sem: 4,
      desc: 'Brûler un maximum en 30 minutes, repos courts.',
      tpls: ['explo_full', 'express'],
      reps: [10, 15],
      rest: 40,
    },
  ],
  rex: [
    {
      id: 'force',
      nom: 'Force 8 semaines',
      sem: 8,
      desc: 'Les gros mouvements, lourd, avec une semaine de décharge à la fin.',
    },
    {
      id: 'base',
      nom: 'Force débutant',
      sem: 6,
      desc: 'Apprendre les gros mouvements proprement, 5 à 8 reps.',
      tpls: ['force_a', 'force_b'],
      reps: [5, 8],
      sets: [3, 3, 4],
    },
    {
      id: 'power',
      nom: 'Powerbuilding',
      sem: 8,
      desc: 'Force lourde puis volume pour le muscle.',
      tpls: ['force_a', 'force_c', 'force_b', 'force_c'],
      reps: [5, 10],
    },
  ],
};
