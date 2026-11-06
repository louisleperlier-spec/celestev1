import React from 'react';
import { Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import type { Zone } from '../config/assets';
import { COULEURS, OMBRE } from '../config/theme';

export type Cadrage = { frame: number; zone: Zone };
export type Surlignage = { zone: Zone; debut: number; fin?: number; assombrir?: boolean };

const ease = Easing.bezier(0.33, 0, 0.15, 1);

/** Zone de cadrage à l'image `f`, interpolée entre les étapes (mouvement de caméra doux). */
function zoneA(f: number, cadrages: readonly Cadrage[]): Zone {
  if (f <= cadrages[0].frame) return cadrages[0].zone;
  for (let i = 0; i < cadrages.length - 1; i++) {
    const a = cadrages[i];
    const b = cadrages[i + 1];
    if (f <= b.frame) {
      const p = interpolate(f, [a.frame, b.frame], [0, 1], { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      return { x: a.zone.x + (b.zone.x - a.zone.x) * p, y: a.zone.y + (b.zone.y - a.zone.y) * p, l: a.zone.l + (b.zone.l - a.zone.l) * p, h: a.zone.h + (b.zone.h - a.zone.h) * p };
    }
  }
  return cadrages[cadrages.length - 1].zone;
}

/**
 * Grande carte arrondie (cadre crème) qui montre une vraie capture de l'app. On ne fait que recadrer,
 * zoomer et surligner : l'interface elle-même n'est jamais redessinée.
 */
export const CarteCapture: React.FC<{
  src: string;
  source: { largeur: number; hauteur: number };
  largeur: number;
  hauteur: number;
  cadrages: readonly Cadrage[];
  surlignages?: readonly Surlignage[];
  style?: React.CSSProperties;
}> = ({ src, source, largeur, hauteur, cadrages, surlignages = [], style }) => {
  const f = useCurrentFrame();
  const bord = 14;
  const vw = largeur - 2 * bord;
  const vh = hauteur - 2 * bord;
  const z = zoneA(f, cadrages);
  // L'échelle fait tenir la zone dans la carte, sans jamais laisser de vide autour de la capture.
  const s = Math.max(Math.min(vw / z.l, vh / z.h), vw / source.largeur);
  const ox = Math.min(0, Math.max(vw - source.largeur * s, vw / 2 - (z.x + z.l / 2) * s));
  const oy = Math.min(0, Math.max(vh - source.hauteur * s, vh / 2 - (z.y + z.h / 2) * s));
  return (
    <div style={{ width: largeur, height: hauteur, borderRadius: 56, background: COULEURS.creme, padding: bord, boxShadow: OMBRE, ...style }}>
      <div style={{ width: vw, height: vh, borderRadius: 44, overflow: 'hidden', position: 'relative', background: '#0E0E11' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: source.largeur, height: source.hauteur, transformOrigin: '0 0', transform: `translate(${ox}px, ${oy}px) scale(${s})` }}>
          <Img src={staticFile(src)} style={{ width: source.largeur, height: source.hauteur, display: 'block' }} />
          {surlignages.map((h, i) => {
            const pIn = interpolate(f, [h.debut, h.debut + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
            const pOut = h.fin === undefined ? 1 : interpolate(f, [h.fin, h.fin + 8], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const o = pIn * pOut;
            if (o <= 0) return null;
            const r = 14 / s + 30;
            const trait = 7 / s;
            const marge = 10;
            const { x, y, l, h: hh } = { x: h.zone.x - marge, y: h.zone.y - marge, l: h.zone.l + 2 * marge, h: h.zone.h + 2 * marge };
            return (
              <svg key={i} width={source.largeur} height={source.hauteur} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
                {h.assombrir !== false && (
                  <path
                    fillRule="evenodd"
                    fill={`rgba(0,0,0,${0.45 * o})`}
                    d={`M0 0H${source.largeur}V${source.hauteur}H0Z M${x + r} ${y}H${x + l - r}A${r} ${r} 0 0 1 ${x + l} ${y + r}V${y + hh - r}A${r} ${r} 0 0 1 ${x + l - r} ${y + hh}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + hh - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`}
                  />
                )}
                <rect x={x} y={y} width={l} height={hh} rx={r} fill="none" stroke={COULEURS.orange} strokeWidth={trait} pathLength={100} strokeDasharray={100} strokeDashoffset={100 - pIn * 100} opacity={pOut} />
              </svg>
            );
          })}
        </div>
      </div>
    </div>
  );
};
