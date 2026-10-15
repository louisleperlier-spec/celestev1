import type { ImageSourcePropType } from 'react-native';

import type { PostureId } from './yoga';

/**
 * Illustrations des postures de yoga (à générer par l'utilisateur, même style que les 50 exercices) :
 * `assets/yoga/<id>.webp`, à ajouter ici au fur et à mesure. Sans image, la posture affiche une silhouette.
 */
export const YOGA_IMAGES: Partial<Record<PostureId, ImageSourcePropType>> = {};
