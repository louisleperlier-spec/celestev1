import React from 'react';
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

import { ASSETS } from '../config/assets';
import { RESSORT } from '../config/theme';

/**
 * Le robot NÉA (image fournie). On l'anime seulement par translation, rotation et léger rebond :
 * jamais d'étirement, son visage n'est pas déformé (échelle uniforme).
 *  - regarde : il se tourne d'un côté puis de l'autre (cartes qui se dispersent) ;
 *  - pointe : il se penche vers la carte, avec une petite flèche orange ;
 *  - acquiesce : deux petits hochements ;
 *  - celebre : saut, rebond et rotation de victoire.
 */
export type Pose = 'regarde' | 'pointe' | 'acquiesce' | 'celebre' | 'repos';

export const Mascotte: React.FC<{
  pose: Pose;
  x: number;
  y: number;
  hauteur: number;
  /** Image (dans la séquence) où il entre. */
  entree?: number;
  /** Côté de la carte pour « pointe ». */
  vers?: 'droite' | 'gauche' | 'haut' | 'hautdroite';
  miroir?: boolean;
}> = ({ pose, x, y, hauteur, entree = 0, vers = 'droite', miroir = false }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const largeur = (hauteur * ASSETS.mascotte.largeur) / ASSETS.mascotte.hauteur;
  const e = spring({ frame: f - entree, fps, config: RESSORT });
  let tx = 0;
  let ty = interpolate(e, [0, 1], [80, 0]);
  let rot = 0;
  const t = Math.max(0, f - entree);
  // respiration discrète
  ty += Math.sin(t / 14) * 4;
  if (pose === 'regarde') rot = Math.sin(t / 11) * 7;
  if (pose === 'pointe') {
    const p = spring({ frame: t - 8, fps, config: RESSORT });
    rot = (vers === 'gauche' ? -1 : 1) * 10 * p;
    tx = (vers === 'gauche' ? -1 : 1) * 14 * p;
  }
  if (pose === 'acquiesce') {
    const n = Math.max(0, t - 6);
    rot = n < 30 ? Math.sin((n / 30) * Math.PI * 4) * 4 * (1 - n / 30) : 0;
    ty += n < 30 ? Math.abs(Math.sin((n / 30) * Math.PI * 4)) * 6 : 0;
  }
  if (pose === 'celebre') {
    const n = Math.max(0, t - 6);
    const saut = Math.abs(Math.sin((Math.min(n, 45) / 45) * Math.PI * 2)) * (n < 45 ? 1 : 0);
    ty -= saut * 70;
    rot = n < 45 ? Math.sin((n / 45) * Math.PI * 4) * 6 : 0;
  }
  const fleche = pose === 'pointe' ? spring({ frame: t - 14, fps, config: RESSORT }) : 0;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: largeur, height: hauteur, opacity: Math.min(1, e * 1.4) }}>
      <div style={{ width: '100%', height: '100%', transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scaleX(${miroir ? -1 : 1})`, transformOrigin: '50% 90%' }}>
        <Img src={staticFile(ASSETS.mascotte.fichier)} style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 18px 24px rgba(0,0,0,0.45))' }} />
      </div>
      {pose === 'pointe' && (
        <svg
          width={120}
          height={80}
          style={{
            position: 'absolute',
            left: vers === 'gauche' ? -110 : largeur - 10,
            top: vers === 'haut' ? -70 : hauteur * 0.18,
            transform: `scale(${fleche}) ${vers === 'gauche' ? 'scaleX(-1)' : ''} ${vers === 'haut' ? 'rotate(-60deg)' : ''} ${vers === 'hautdroite' ? 'rotate(-38deg)' : ''}`,
            transformOrigin: '0% 50%',
            overflow: 'visible',
          }}
        >
          <path d="M6 54 Q 50 8 104 22" stroke="#FF6B1A" strokeWidth={10} fill="none" strokeLinecap="round" />
          <path d="M88 6 L110 22 L86 38" stroke="#FF6B1A" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
};
