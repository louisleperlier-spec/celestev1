import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { COULEURS, POLICE, RESSORT } from '../config/theme';

export type Morceau = { texte: string; couleur?: string };

/**
 * Titre très lisible (Inter ExtraBold) dont les mots montent l'un après l'autre avec un ressort court.
 * `morceaux` permet de colorer une partie (ex. « quoi faire ? » en orange). Jamais coupé : retour à la ligne normal.
 */
export const TitreAnime: React.FC<{
  morceaux: readonly Morceau[];
  taille: number;
  debut?: number;
  ecart?: number;
  aligner?: 'center' | 'left';
  couleur?: string;
  style?: React.CSSProperties;
}> = ({ morceaux, taille, debut = 0, ecart = 2, aligner = 'center', couleur = COULEURS.blanc, style }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mots = morceaux.flatMap((m) => m.texte.split(/(?<= )/).filter(Boolean).map((t) => ({ t, c: m.couleur ?? couleur })));
  return (
    <div style={{ fontFamily: POLICE, fontWeight: 800, fontSize: taille, lineHeight: 1.08, letterSpacing: -taille * 0.025, textAlign: aligner, color: couleur, ...style }}>
      {mots.map((m, i) => {
        const p = spring({ frame: f - debut - i * ecart, fps, config: RESSORT });
        return (
          <span key={i} style={{ display: 'inline-block', whiteSpace: 'pre', color: m.c, opacity: interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }), transform: `translateY(${(1 - p) * 34}px)` }}>
            {m.t}
          </span>
        );
      })}
    </div>
  );
};
