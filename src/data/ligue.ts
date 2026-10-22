// Généré depuis NEA-donnees-et-images.zip (identique aux constantes du prototype `prototype/nea-app.html`).
// Ne pas modifier à la main : corriger la source puis régénérer.

import type { Quest, Rank } from './types';

/** Quêtes du jour (`QUESTS`). */
export const QUESTS: readonly Quest[] = [
  ['seance', 'Termine une séance', 50],
  ['velo', 'Roule 5 km ou 20 min', 40],
  ['coach', 'Pose une question à ton coach', 15],
  ['poids', 'Note ton poids', 10],
];

/** Rangs, tous les 5 niveaux (`RANKS`). */
export const RANKS: readonly Rank[] = [
  ['Bronze', '#cd7f4f'],
  ['Argent', '#c9ced8'],
  ['Or', '#ffcc3d'],
  ['Platine', '#6fe3d6'],
  ['Diamant', '#8fb3ff'],
];
