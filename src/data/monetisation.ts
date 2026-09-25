// Généré depuis NEA-donnees-et-images.zip (identique aux constantes du prototype `prototype/nea-app.html`).
// Ne pas modifier à la main : corriger la source puis régénérer.

import type { Plan } from './types';

/** Offres NÉA Plus (`PLANS`), en dollars canadiens. */
export const PLANS: readonly Plan[] = [
  {
    id: 'an',
    nom: 'Annuel',
    prix: 59.99,
    per: 'an',
    trial: 3,
    badge: 'MEILLEURE OFFRE',
  },
  {
    id: 'mois',
    nom: 'Mensuel',
    prix: 12.99,
    per: 'mois',
  },
  {
    id: 'vie',
    nom: 'À vie',
    prix: 149.99,
    per: 'paiement unique',
  },
];
