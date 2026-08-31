import React from 'react';
import { Image, ImageSourcePropType } from 'react-native';

/**
 * Mascotte Lume — illustrations fournies par l'utilisateur (assets/mascot/*.webp), pas de la
 * photo de stock ni un rendu généré à la volée. Chaque pose a son propre ratio largeur/hauteur
 * (ce ne sont pas des carrés) ; `size` fixe la hauteur affichée, la largeur suit le ratio.
 */

export type MascotPose = 'wave' | 'heart' | 'bottle' | 'sunglasses' | 'workout' | 'sleep' | 'sparkle' | 'thumbsup';

const SOURCES: Record<MascotPose, ImageSourcePropType> = {
  wave: require('../../../assets/mascot/wave.webp'),
  heart: require('../../../assets/mascot/heart.webp'),
  bottle: require('../../../assets/mascot/bottle.webp'),
  sunglasses: require('../../../assets/mascot/sunglasses.webp'),
  workout: require('../../../assets/mascot/workout.webp'),
  sleep: require('../../../assets/mascot/sleep.webp'),
  sparkle: require('../../../assets/mascot/sparkle.webp'),
  thumbsup: require('../../../assets/mascot/thumbsup.webp'),
};

// Ratio largeur/hauteur de chaque image source (rognées, pas carrées).
const ASPECT_RATIO: Record<MascotPose, number> = {
  wave: 352 / 460,
  heart: 371 / 460,
  bottle: 359 / 460,
  sunglasses: 362 / 460,
  workout: 322 / 460,
  sleep: 345 / 460,
  sparkle: 345 / 460,
  thumbsup: 349 / 460,
};

interface MascotProps {
  pose?: MascotPose;
  /** Hauteur affichée en points — la largeur suit le ratio propre à la pose. */
  size?: number;
}

export function Mascot({ pose = 'sparkle', size = 120 }: MascotProps) {
  const ratio = ASPECT_RATIO[pose];
  return (
    <Image
      source={SOURCES[pose]}
      style={{ width: size * ratio, height: size }}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}
