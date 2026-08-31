import type { PillarId } from '@/lib/types';

export type Tip = {
  id: string;
  pillar: PillarId;
  icon: string;
  title: string;
  body: string;
};

export const TIPS: Tip[] = [
  {
    id: 'tip-physique-progressive',
    pillar: 'physique',
    icon: 'trending-up',
    title: 'Progresse chaque semaine',
    body: 'Ajoute un peu de poids ou une répétition de plus à chaque séance : la surcharge progressive fait le résultat, pas l’intensité d’un seul jour.',
  },
  {
    id: 'tip-apparence-posture',
    pillar: 'apparence',
    icon: 'body',
    title: 'Travaille ta posture',
    body: 'Épaules basses, dos droit : ça change plus ton allure en une seconde que n’importe quel vêtement.',
  },
  {
    id: 'tip-energie-protein',
    pillar: 'energie',
    icon: 'restaurant',
    title: 'Des protéines à chaque repas',
    body: 'Elles calent durablement et évitent le coup de barre qui pousse vers le grignotage.',
  },
  {
    id: 'tip-discipline-phone',
    pillar: 'discipline',
    icon: 'phone-portrait',
    title: 'Mets ton téléphone hors de vue',
    body: 'Pendant tes blocs de focus, range ton téléphone dans une autre pièce : la tentation de le regarder disparaît.',
  },
  {
    id: 'tip-mental-gratitude',
    pillar: 'mental',
    icon: 'sunny',
    title: 'Note 3 choses positives',
    body: 'Un mini rituel de gratitude le soir améliore la qualité perçue de ta journée, même les jours difficiles.',
  },
];

export function tipsForPillar(pillar: PillarId): Tip[] {
  return TIPS.filter((t) => t.pillar === pillar);
}
