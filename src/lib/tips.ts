import type { CategoryId } from '@/lib/types';

export type Tip = {
  id: string;
  category: CategoryId;
  icon: string;
  title: string;
  body: string;
};

export const TIPS: Tip[] = [
  {
    id: 'tip-sleep-consistency',
    category: 'sleep',
    icon: 'bed',
    title: 'Couche-toi à heure fixe',
    body: 'Un horaire de sommeil régulier améliore ton énergie bien plus que quelques heures en plus une fois de temps en temps.',
  },
  {
    id: 'tip-sport-morning',
    category: 'sport',
    icon: 'walk',
    title: 'Bouge tôt dans la journée',
    body: '20 minutes de marche avant midi boostent ta discipline et ton mood pour le reste de la journée.',
  },
  {
    id: 'tip-discipline-phone',
    category: 'discipline',
    icon: 'phone-portrait',
    title: 'Mets ton téléphone hors de vue',
    body: 'Pendant tes blocs de focus, range ton téléphone dans une autre pièce : la tentation de le regarder disparaît.',
  },
  {
    id: 'tip-nutrition-protein',
    category: 'nutrition',
    icon: 'restaurant',
    title: 'Des protéines à chaque repas',
    body: 'Elles calent durablement et évitent le coup de barre qui pousse vers le grignotage.',
  },
  {
    id: 'tip-mindset-gratitude',
    category: 'mindset',
    icon: 'happy',
    title: 'Note 3 choses positives',
    body: 'Un mini rituel de gratitude le soir améliore la qualité perçue de ta journée, même les jours difficiles.',
  },
];

export function tipsForCategory(category: CategoryId): Tip[] {
  return TIPS.filter((t) => t.category === category);
}
