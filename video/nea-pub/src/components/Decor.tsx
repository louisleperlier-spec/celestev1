import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

import { COULEURS } from '../config/theme';

/** Petit cube 3D (6 faces CSS), blanc ou orange, qui flotte et tourne doucement. */
const Cube: React.FC<{ taille: number; couleur: 'blanc' | 'orange'; rot: number }> = ({ taille, couleur, rot }) => {
  const t = taille / 2;
  const base = couleur === 'orange' ? [COULEURS.orange, '#FF8A47', '#D9560F'] : ['#FFFFFF', '#E9E6E0', '#C9C6C0'];
  const faces: [string, string][] = [
    [`translateZ(${t}px)`, base[0]],
    [`rotateY(180deg) translateZ(${t}px)`, base[2]],
    [`rotateY(90deg) translateZ(${t}px)`, base[1]],
    [`rotateY(-90deg) translateZ(${t}px)`, base[1]],
    [`rotateX(90deg) translateZ(${t}px)`, base[0]],
    [`rotateX(-90deg) translateZ(${t}px)`, base[2]],
  ];
  return (
    <div style={{ width: taille, height: taille, transformStyle: 'preserve-3d', transform: `rotateX(${-25 + rot * 0.4}deg) rotateY(${rot}deg)` }}>
      {faces.map(([tr, c], i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, background: c, borderRadius: taille * 0.12, transform: tr, backfaceVisibility: 'hidden' }} />
      ))}
    </div>
  );
};

/** Disque épais vu en perspective (pastille 3D). */
const Disque: React.FC<{ taille: number; couleur: 'blanc' | 'orange'; rot: number }> = ({ taille, couleur, rot }) => {
  const [face, tranche] = couleur === 'orange' ? [COULEURS.orange, '#C24C0B'] : ['#FFFFFF', '#BEBAB2'];
  const inclinaison = 0.45 + 0.15 * Math.sin(rot / 40);
  return (
    <div style={{ width: taille, height: taille, position: 'relative', transform: `rotate(${rot * 0.3}deg) scaleY(${inclinaison})` }}>
      <div style={{ position: 'absolute', inset: 0, top: taille * 0.16, borderRadius: '50%', background: tranche }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, #fff8 0%, ${face} 55%)` }} />
    </div>
  );
};

type Forme = { type: 'cube' | 'disque'; couleur: 'blanc' | 'orange'; x: number; y: number; taille: number; phase: number; vitesse: number };

/** Formes en périphérie seulement (jamais sur le texte ni les cartes). */
const FORMES: Forme[] = [
  { type: 'cube', couleur: 'orange', x: 26, y: 1040, taille: 46, phase: 0, vitesse: 1 },
  { type: 'disque', couleur: 'blanc', x: 985, y: 330, taille: 52, phase: 1.3, vitesse: 0.8 },
  { type: 'cube', couleur: 'blanc', x: 985, y: 980, taille: 34, phase: 2.1, vitesse: 1.2 },
  { type: 'disque', couleur: 'orange', x: 22, y: 700, taille: 44, phase: 0.7, vitesse: 0.9 },
  { type: 'cube', couleur: 'orange', x: 950, y: 1520, taille: 40, phase: 2.8, vitesse: 1.1 },
  { type: 'disque', couleur: 'blanc', x: 70, y: 1750, taille: 36, phase: 1.9, vitesse: 1 },
  { type: 'cube', couleur: 'blanc', x: 420, y: 40, taille: 26, phase: 3.4, vitesse: 0.7 },
];

/** Fond : graphite (ou couleur donnée), léger dégradé, formes 3D qui flottent en périphérie. */
export const Decor: React.FC<{ fond?: string; formes?: boolean; opacite?: number }> = ({ fond = COULEURS.graphite, formes = true, opacite = 1 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: fond }}>
      <AbsoluteFill style={{ background: 'radial-gradient(120% 70% at 50% 35%, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0) 60%)' }} />
      {formes &&
        FORMES.map((s, i) => {
          const dy = Math.sin(f / 30 * s.vitesse + s.phase) * 14;
          const dx = Math.cos(f / 45 * s.vitesse + s.phase) * 6;
          const rot = f * 0.9 * s.vitesse + s.phase * 40;
          return (
            <div key={i} style={{ position: 'absolute', left: s.x + dx, top: s.y + dy, perspective: 400, opacity: 0.9 * opacite, filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.35))' }}>
              {s.type === 'cube' ? <Cube taille={s.taille} couleur={s.couleur} rot={rot} /> : <Disque taille={s.taille} couleur={s.couleur} rot={rot} />}
            </div>
          );
        })}
    </AbsoluteFill>
  );
};
