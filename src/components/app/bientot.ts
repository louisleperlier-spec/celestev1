import { toast } from '@/components/ui';

/**
 * Écrans du prototype pas encore construits : on l'indique au lieu d'un bouton sans effet.
 * À retirer au fur et à mesure des étapes.
 */
export const ETAPES = {
  seance: 4,
  demo: 4,
  comptes: 5,
  sante: 6,
  velo: 7,
  notifications: 8,
  coach: 9,
  ligue: 10,
  plus: 11,
} as const;

export function bientot(ecran: keyof typeof ETAPES | 'progres' | 'profil') {
  toast(ecran === 'progres' || ecran === 'profil' ? 'Bientôt disponible' : `Arrive à l'étape ${ETAPES[ecran]}`);
}
