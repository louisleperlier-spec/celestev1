import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

import { TRANSITION } from '../config/theme';

/**
 * Enveloppe de scène : entrée et sortie douces (fondu + léger glissement vertical, `TRANSITION` images).
 * La séquence dure `duree + TRANSITION` pour chevaucher l'entrée de la scène suivante.
 */
export const Scene: React.FC<{ children: React.ReactNode; entree?: boolean; sortie?: boolean }> = ({ children, entree = true, sortie = true }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const e = entree ? interpolate(f, [0, TRANSITION], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }) : 1;
  const s = sortie ? interpolate(f, [durationInFrames - TRANSITION, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', easing: Easing.in(Easing.cubic) }) : 1;
  return <AbsoluteFill style={{ opacity: Math.min(e, s), transform: `translateY(${(1 - e) * 40 - (1 - s) * 30}px)` }}>{children}</AbsoluteFill>;
};
