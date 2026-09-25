import { toast } from '@/components/ui';

/**
 * Écrans du prototype pas encore construits : on l'indique au lieu d'un bouton sans effet.
 * À retirer au fur et à mesure des étapes.
 */
export const ETAPES = {
  seance: 4,
  demo: 4,
  progres: 4,
  profil: 5,
  comptes: 5,
  sante: 6,
  velo: 7,
  notifications: 8,
  coach: 9,
  ligue: 10,
  plus: 11,
} as const;

export function bientot(ecran: keyof typeof ETAPES) {
  toast(`Arrive à l'étape ${ETAPES[ecran]}`);
}
