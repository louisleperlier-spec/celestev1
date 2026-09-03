import type { SFSymbol } from 'sf-symbols-typescript';

import { ContentCategory } from './content';

/**
 * Exception volontaire, scoped au Coach : le reste de l'app reste mono-accent (voir
 * `src/constants/theme.ts` et AGENTS.md "Design"). Ici seulement, chaque catégorie de contenu a
 * sa propre couleur d'accent + une icône (pas de photo générée/stock — évite l'aspect
 * "illustration IA" générique) pour se repérer visuellement entre recette / activité /
 * récupération. Ne PAS réutiliser ces tokens en dehors de `src/features/coach/`.
 */

export const CATEGORY_TINT: Record<ContentCategory, string> = {
  recipe: '#F4B84C',
  activity: '#3FBEE8',
  recovery: '#A489F0',
};

export const CATEGORY_ICON: Record<ContentCategory, SFSymbol> = {
  recipe: 'fork.knife',
  activity: 'figure.walk',
  recovery: 'moon.zzz.fill',
};

export const STREAK_COLOR = '#FF8A3D';
export const PREMIUM_GOLD = '#D9B44A';
