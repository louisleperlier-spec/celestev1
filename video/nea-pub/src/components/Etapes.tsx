import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { TEXTES } from '../config/textes';
import { COULEURS, OMBRE_DOUCE, POLICE, RESSORT, SURE } from '../config/theme';

/**
 * Navigation par étapes en haut : Programme · Séance · Progrès. L'onglet actif est orange ;
 * la pastille glisse de l'étape précédente vers l'étape active (`de` → `actif`).
 */
export const Etapes: React.FC<{ actif: number; de?: number; entree?: number }> = ({ actif, de = actif, entree = 0 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({ frame: f - entree, fps, config: RESSORT });
  const glisse = spring({ frame: f - entree - 4, fps, config: RESSORT });
  const pos = de + (actif - de) * glisse;
  const largeur = 900;
  const cell = largeur / TEXTES.etapes.length;
  return (
    <div style={{ position: 'absolute', top: SURE.haut + 30, left: 60, width: largeur, height: 96, borderRadius: 48, background: COULEURS.creme, boxShadow: OMBRE_DOUCE, opacity: e, transform: `translateY(${(1 - e) * -30}px)` }}>
      <div style={{ position: 'absolute', top: 8, left: 8 + pos * cell, width: cell - 16, height: 80, borderRadius: 40, background: COULEURS.orange }} />
      {TEXTES.etapes.map((t, i) => {
        const proche = Math.max(0, 1 - Math.abs(pos - i));
        return (
          <div key={t} style={{ position: 'absolute', left: i * cell, top: 0, width: cell, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: POLICE, fontWeight: 800, fontSize: 36, color: proche > 0.5 ? COULEURS.blanc : COULEURS.noir }}>
            <span style={{ width: 38, height: 38, borderRadius: 19, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, background: proche > 0.5 ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)', opacity: interpolate(proche, [0, 1], [0.9, 1]) }}>
              {i + 1}
            </span>
            {t}
          </div>
        );
      })}
    </div>
  );
};
