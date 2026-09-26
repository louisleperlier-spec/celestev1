import { toast } from '@/components/ui';

/**
 * Écrans du prototype pas encore construits : on l'indique au lieu d'un bouton sans effet.
 * À retirer au fur et à mesure des étapes.
 */
export const ETAPES = {
  comptes: 5,
  sante: 6,
  coach: 9,
  plus: 11,
} as const;

export function bientot(ecran: keyof typeof ETAPES) {
  toast(`Arrive à l'étape ${ETAPES[ecran]}`);
}
