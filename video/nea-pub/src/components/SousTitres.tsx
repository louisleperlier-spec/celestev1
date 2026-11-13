import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

import mots from '../config/mots.json';
import { SOUS_TITRE_REMPLACE, VOIX } from '../config/textes';
import { COULEURS, FORMAT, POLICE, SURE } from '../config/theme';
import { SCENES, VOIX_DELAI } from '../config/timeline';

type Mot = { mot: string; debut: number; fin: number };
type Groupe = { mots: string[]; debut: number; fin: number; cles: string[] };

/** Groupes courts (2 à 7 mots) recalés sur l'instant de chaque mot de la voix off. */
export const GROUPES: Groupe[] = SCENES.flatMap((s, i) => {
  const liste = (mots as Mot[][])[i];
  const v = VOIX[i];
  const out: Groupe[] = [];
  let k = 0;
  for (const n of v.groupes) {
    const part = liste.slice(k, k + n);
    k += n;
    if (!part.length) continue;
    const txt = part.map((m) => SOUS_TITRE_REMPLACE[m.mot] ?? m.mot).filter(Boolean);
    out.push({ mots: txt, debut: s.debut + VOIX_DELAI + part[0].debut - 0.05, fin: s.debut + VOIX_DELAI + part[part.length - 1].fin + 0.25, cles: v.cles });
  }
  // chaque groupe reste affiché jusqu'au suivant (pas de trou entre deux groupes)
  for (let j = 0; j < out.length - 1; j++) out[j].fin = Math.max(out[j].fin, out[j + 1].debut);
  return out;
});

/** Sous-titres synchronisés, au-dessus de la zone réservée en bas ; mot important en orange. */
export const SousTitres: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const g = GROUPES.find((x) => t >= x.debut && t < x.fin);
  if (!g) return null;
  const pIn = interpolate(t, [g.debut, g.debut + 0.12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pOut = interpolate(t, [g.fin - 0.1, g.fin], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', left: 60, width: FORMAT.largeur - 60 - SURE.droite, bottom: SURE.bas + 20, display: 'flex', justifyContent: 'center', opacity: Math.min(pIn, pOut) }}>
      <div style={{ maxWidth: '100%', padding: '14px 28px', borderRadius: 26, background: 'rgba(17,17,20,0.88)', fontFamily: POLICE, fontWeight: 800, fontSize: 46, lineHeight: 1.2, color: COULEURS.blanc, textAlign: 'center', transform: `translateY(${(1 - pIn) * 10}px)` }}>
        {g.mots.map((m, i) => (
          <span key={i} style={{ color: g.cles.some((c) => m.toLowerCase().startsWith(c.toLowerCase())) ? COULEURS.orange : COULEURS.blanc }}>
            {m}
            {i < g.mots.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </div>
  );
};
