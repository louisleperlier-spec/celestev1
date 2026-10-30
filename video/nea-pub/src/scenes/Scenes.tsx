import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { CarteCapture, type Cadrage, type Surlignage } from '../components/CarteCapture';
import { Decor } from '../components/Decor';
import { Etapes } from '../components/Etapes';
import { Mascotte } from '../components/Mascotte';
import { TitreAnime } from '../components/Texte';
import { ASSETS, ZONES } from '../config/assets';
import { TEXTES } from '../config/textes';
import { COULEURS, OMBRE, OMBRE_DOUCE, POLICE, RESSORT, RESSORT_DOUX, SURE } from '../config/theme';
import { img } from '../config/timeline';

/* ────────── petits éléments ────────── */

/** Petite carte d'exercice « en vrac » (décor de l'accroche, pas une capture de l'app). */
const CarteVrac: React.FC<{ texte: string; x: number; y: number; r: number; style?: React.CSSProperties }> = ({ texte, x, y, r, style }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: `rotate(${r}deg)`, padding: '24px 30px', borderRadius: 28, background: COULEURS.creme, boxShadow: OMBRE_DOUCE, display: 'flex', alignItems: 'center', gap: 16, fontFamily: POLICE, fontWeight: 800, fontSize: 38, color: COULEURS.noir, whiteSpace: 'nowrap', ...style }}>
    <svg width={44} height={44} viewBox="0 0 24 24">
      <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" stroke={COULEURS.orange} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    </svg>
    {texte}
  </div>
);

const Coche: React.FC<{ texte: string; debut: number }> = ({ texte, debut }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - debut, fps, config: RESSORT });
  const trait = interpolate(f, [debut + 4, debut + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '20px 34px 20px 22px', borderRadius: 60, background: COULEURS.noir, opacity: Math.min(1, p * 1.5), transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: 'left center' }}>
      <div style={{ width: 64, height: 64, borderRadius: 32, background: COULEURS.creme, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={38} height={38} viewBox="0 0 24 24">
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke={COULEURS.orange} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - trait} />
        </svg>
      </div>
      <span style={{ fontFamily: POLICE, fontWeight: 800, fontSize: 52, color: COULEURS.blanc }}>{texte}</span>
    </div>
  );
};

/* ────────── scènes ────────── */

/** 0–3 s : accroche. Deux lignes successives, « quoi faire ? » en orange ; la mascotte regarde des cartes qui se dispersent. */
export const Accroche: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const disp = spring({ frame: f - 14, fps, config: RESSORT_DOUX });
  const cartes = [
    { x0: 380, y0: 1080, x1: 70, y1: 820, r: -9 },
    { x0: 360, y0: 1100, x1: 420, y1: 760, r: 7 },
    { x0: 400, y0: 1120, x1: 120, y1: 1240, r: 5 },
  ];
  return (
    <AbsoluteFill>
      <Decor />
      <div style={{ position: 'absolute', top: SURE.haut + 150, left: 60, width: 920 }}>
        <TitreAnime morceaux={[{ texte: TEXTES.accroche.ligne1 }]} taille={100} debut={2} />
        <TitreAnime morceaux={[{ texte: TEXTES.accroche.ligne2Avant }, { texte: TEXTES.accroche.ligne2Orange, couleur: COULEURS.orange }]} taille={100} debut={26} style={{ marginTop: 10 }} />
      </div>
      {cartes.map((c, i) => (
        <CarteVrac
          key={i}
          texte={TEXTES.cartesEnVrac[i]}
          x={c.x0 + (c.x1 - c.x0) * disp + Math.sin(f / 9 + i) * 4}
          y={c.y0 + (c.y1 - c.y0) * disp + Math.cos(f / 10 + i) * 4}
          r={c.r * disp + Math.sin(f / 12 + i * 2) * 2}
          style={{ opacity: Math.min(1, disp * 2) }}
        />
      ))}
      <Mascotte pose="regarde" x={600} y={1060} hauteur={480} entree={0} />
    </AbsoluteFill>
  );
};

/** 3–7 s : la dispersion se range en une carte centrale = la vraie capture de l'accueil. */
export const Solution: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const range = spring({ frame: f - 2, fps, config: RESSORT });
  const carte = spring({ frame: f - 8, fps, config: RESSORT_DOUX });
  const L = 700;
  const H = 1000;
  return (
    <AbsoluteFill>
      <Decor />
      <div style={{ position: 'absolute', top: SURE.haut + 60, left: 60, width: 920 }}>
        <TitreAnime morceaux={[{ texte: TEXTES.solution.ligne1 }]} taille={92} debut={4} />
        <TitreAnime morceaux={[{ texte: TEXTES.solution.ligne2, couleur: COULEURS.orange }]} taille={92} debut={16} style={{ marginTop: 6 }} />
      </div>
      {/* les cartes en vrac se rangent au centre et laissent la place à la capture */}
      {[0, 1, 2].map((i) => (
        <CarteVrac
          key={i}
          texte={TEXTES.cartesEnVrac[i]}
          x={interpolate(range, [0, 1], [[70, 420, 120][i], 330])}
          y={interpolate(range, [0, 1], [[820, 760, 1240][i], 980 + i * 10])}
          r={interpolate(range, [0, 1], [[-9, 7, 5][i], 0])}
          style={{ opacity: interpolate(carte, [0, 0.5], [1, 0], { extrapolateRight: 'clamp' }) }}
        />
      ))}
      <div style={{ position: 'absolute', left: (1080 - SURE.droite + SURE.gauche - L) / 2 + 40, top: 560, opacity: carte, transform: `scale(${0.7 + 0.3 * carte})`, transformOrigin: '50% 40%' }}>
        <CarteCapture
          src={ASSETS.captures.accueil.fichier}
          source={ASSETS.captures.accueil}
          largeur={L}
          hauteur={H}
          cadrages={[
            { frame: 0, zone: ZONES.accueil.seance },
            { frame: img(3.6), zone: { ...ZONES.accueil.seance, y: ZONES.accueil.seance.y + 150 } },
          ]}
        />
      </div>
      <Mascotte pose="acquiesce" x={20} y={1240} hauteur={320} entree={10} />
    </AbsoluteFill>
  );
};

/** Gabarit commun des trois étapes : navigation, titre, grande carte avec cadrages et surlignages, mascotte qui pointe. */
export const Etape: React.FC<{
  index: number;
  titre: string;
  capture: 'programme' | 'progres';
  cadrages: readonly Cadrage[];
  surlignages: readonly Surlignage[];
  /** Direction de la flèche de la mascotte (vers la zone surlignée). */
  vers?: 'droite' | 'hautdroite';
}> = ({ index, titre, capture, cadrages, surlignages, vers = 'droite' }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const carte = spring({ frame: f - 6, fps, config: RESSORT_DOUX });
  const c = ASSETS.captures[capture];
  return (
    <AbsoluteFill>
      <Decor />
      <Etapes actif={index} de={Math.max(0, index - 1)} entree={0} />
      <div style={{ position: 'absolute', top: SURE.haut + 175, left: 60, width: 920 }}>
        <TitreAnime morceaux={[{ texte: titre }]} taille={68} debut={4} aligner="left" />
      </div>
      <div style={{ position: 'absolute', left: 250, top: 420, opacity: carte, transform: `translateY(${(1 - carte) * 60}px) scale(${0.94 + 0.06 * carte})` }}>
        <CarteCapture src={c.fichier} source={c} largeur={730} hauteur={1110} cadrages={cadrages} surlignages={surlignages} />
      </div>
      <Mascotte pose="pointe" vers={vers} x={14} y={1185} hauteur={340} entree={4} />
    </AbsoluteFill>
  );
};

export const Etape1: React.FC = () => (
  <Etape
    index={0}
    titre={TEXTES.etape1}
    capture="programme"
    cadrages={[
      { frame: 0, zone: ZONES.programme.haut },
      { frame: 26, zone: ZONES.programme.haut },
      { frame: 62, zone: { ...ZONES.programme.masse, y: ZONES.programme.masse.y - 300, h: ZONES.programme.masse.h + 600 } },
    ]}
    surlignages={[{ zone: ZONES.programme.masse, debut: 58 }]}
  />
);

export const Etape2: React.FC = () => (
  <Etape
    index={1}
    titre={TEXTES.etape2}
    vers="hautdroite"
    capture="programme"
    cadrages={[
      { frame: 0, zone: { ...ZONES.programme.masse, y: ZONES.programme.masse.y - 300, h: ZONES.programme.masse.h + 600 } },
      { frame: 40, zone: ZONES.programme.seance },
      { frame: 92, zone: ZONES.programme.seance },
      { frame: 124, zone: { ...ZONES.programme.liste, y: ZONES.programme.liste.y - 120, h: ZONES.programme.liste.h + 240 } },
    ]}
    surlignages={[
      { zone: ZONES.programme.liste, debut: 48, fin: 104, assombrir: false },
      { zone: ZONES.programme.seriesReps, debut: 112 },
    ]}
  />
);

export const Etape3: React.FC = () => (
  <Etape
    index={2}
    titre={TEXTES.etape3}
    capture="progres"
    cadrages={[
      { frame: 0, zone: ZONES.progres.haut },
      { frame: 22, zone: ZONES.progres.haut },
      { frame: 58, zone: ZONES.progres.ascension },
      { frame: 104, zone: ZONES.progres.ascension },
      { frame: 134, zone: { ...ZONES.progres.barre, y: ZONES.progres.barre.y - 200, h: ZONES.progres.barre.h + 400 } },
    ]}
    surlignages={[
      { zone: ZONES.progres.ascension, debut: 60, fin: 106, assombrir: false },
      { zone: ZONES.progres.barre, debut: 128 },
    ]}
  />
);

/** Synthèse : fond orange plein écran, deux lignes très grandes, trois coches. */
export const Synthese: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fond = spring({ frame: f, fps, config: RESSORT });
  return (
    <AbsoluteFill>
      <Decor />
      <AbsoluteFill style={{ background: COULEURS.orange, clipPath: `circle(${fond * 130}% at 50% 45%)` }}>
        <Decor fond="transparent" opacite={0.8} />
        <div style={{ position: 'absolute', top: SURE.haut + 200, left: 60, width: 920 }}>
          <TitreAnime morceaux={[{ texte: TEXTES.synthese.ligne1 }]} taille={124} debut={4} couleur={COULEURS.noir} aligner="left" />
          <TitreAnime morceaux={[{ texte: TEXTES.synthese.ligne2 }]} taille={124} debut={14} couleur={COULEURS.blanc} aligner="left" style={{ marginTop: 6 }} />
        </div>
        <div style={{ position: 'absolute', top: 820, left: 60, display: 'flex', flexDirection: 'column', gap: 26 }}>
          {TEXTES.synthese.coches.map((c, i) => (
            <Coche key={c} texte={c} debut={30 + i * 12} />
          ))}
        </div>
      </AbsoluteFill>
      <Mascotte pose="acquiesce" x={720} y={1210} hauteur={330} entree={12} />
    </AbsoluteFill>
  );
};

/** Conclusion : logo typographique, « Ton coach. Ton rythme. », appel à l'action ; la mascotte célèbre. */
export const Conclusion: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: f - 2, fps, config: RESSORT });
  const bouton = spring({ frame: f - 34, fps, config: RESSORT });
  const site = spring({ frame: f - 42, fps, config: RESSORT });
  return (
    <AbsoluteFill>
      <Decor />
      <Mascotte pose="celebre" x={(1080 - 236) / 2 - 20} y={SURE.haut + 40} hauteur={380} entree={6} />
      <div style={{ position: 'absolute', top: 560, left: 60, width: 920, textAlign: 'center', opacity: logo, transform: `scale(${0.85 + 0.15 * logo})` }}>
        <div style={{ fontFamily: POLICE, fontWeight: 800, fontSize: 200, lineHeight: 1, letterSpacing: 6, color: COULEURS.blanc }}>{TEXTES.conclusion.logo}</div>
        <div style={{ margin: '18px auto 0', width: 160 * logo, height: 12, borderRadius: 6, background: COULEURS.orange }} />
      </div>
      <div style={{ position: 'absolute', top: 840, left: 60, width: 920 }}>
        <TitreAnime morceaux={[{ texte: TEXTES.conclusion.ligne1 }]} taille={84} debut={14} />
        <TitreAnime morceaux={[{ texte: TEXTES.conclusion.ligne2, couleur: COULEURS.orange }]} taille={84} debut={22} />
      </div>
      <div style={{ position: 'absolute', top: 1110, left: 60, width: 920, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        <div style={{ padding: '26px 60px', borderRadius: 60, background: COULEURS.orange, boxShadow: OMBRE, fontFamily: POLICE, fontWeight: 800, fontSize: 52, color: COULEURS.noir, opacity: bouton, transform: `scale(${0.8 + 0.2 * bouton})` }}>
          {TEXTES.conclusion.bouton}
        </div>
        <div style={{ padding: '14px 34px', borderRadius: 40, background: COULEURS.creme, fontFamily: POLICE, fontWeight: 800, fontSize: 44, color: COULEURS.noir, opacity: site, transform: `translateY(${(1 - site) * 20}px)` }}>
          {TEXTES.conclusion.site}
        </div>
      </div>
    </AbsoluteFill>
  );
};
