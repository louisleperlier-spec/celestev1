import type { ImageSourcePropType } from 'react-native';

import { ContentCategory } from './content';

/**
 * Exception volontaire, scoped au Coach : le reste de l'app reste mono-accent (voir
 * `src/constants/theme.ts` et AGENTS.md "Design"). Ici seulement, chaque catégorie de contenu a
 * sa propre couleur d'accent + une illustration (assets/coach/, fournies par l'utilisateur — pas
 * de la photo de stock) pour se repérer visuellement entre recette / activité / récupération. Ne
 * PAS réutiliser ces tokens en dehors de `src/features/coach/`.
 */

export const CATEGORY_TINT: Record<ContentCategory, string> = {
  recipe: '#F4B84C',
  activity: '#3FBEE8',
  recovery: '#A489F0',
};

export const STREAK_COLOR = '#FF8A3D';
export const PREMIUM_GOLD = '#D9B44A';

/** Illustrations fournies pour le Coach (assets/coach/) — pas de la photo de stock. */
export const CATEGORY_IMAGE: Record<ContentCategory, ImageSourcePropType> = {
  recipe: require('../../../assets/coach/recipe.jpg'),
  activity: require('../../../assets/coach/activity.jpg'),
  recovery: require('../../../assets/coach/recovery.jpg'),
};

export const HYDRATION_IMAGE: ImageSourcePropType = require('../../../assets/coach/hydration.jpg');
