import { ContentCategory } from './content';

/**
 * Exception volontaire, scoped au Coach : le reste de l'app reste mono-accent (voir
 * `src/constants/theme.ts` et AGENTS.md "Design"). Ici seulement, chaque catégorie de contenu a
 * sa propre couleur pour se repérer visuellement entre recette / activité / récupération — comme
 * les cartes photo. Ne PAS réutiliser ces tokens en dehors de `src/features/coach/`.
 */

export const CATEGORY_GRADIENT: Record<ContentCategory, readonly [string, string]> = {
  recipe: ['#F4B84C', '#E35C2E'],
  activity: ['#3FBEE8', '#2A5FD9'],
  recovery: ['#A489F0', '#5B3FC9'],
};

export const CATEGORY_TINT: Record<ContentCategory, string> = {
  recipe: '#F4B84C',
  activity: '#3FBEE8',
  recovery: '#A489F0',
};

export const STREAK_COLOR = '#FF8A3D';
export const PREMIUM_GOLD = '#D9B44A';
