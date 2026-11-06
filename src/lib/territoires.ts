/**
 * Territoires : la ville découpée en hexagones d'environ 150 m (pointe en haut), calculés dans le plan de Mercator.
 * Même grille partout : une case = coordonnées axiales (q, r), stockées telles quelles par Supabase (supabase/territoires.sql).
 * Fonctions pures (pas d'import de l'app) : utilisables avec Node.
 */
import type { Pt } from './velo';

/** Rayon d'un hexagone en mètres de Mercator (≈ 85 m réels à Montréal, soit ≈ 150 m d'un côté à l'autre). */
export const TAILLE = 120;
const R_TERRE = 6378137;
const S3 = Math.sqrt(3);

export type Case = { q: number; r: number };
export const cleCase = (c: Case) => `${c.q}:${c.r}`;

/** Point GPS → plan de Mercator (mètres). */
export function mercator([lat, lng]: Pt): [number, number] {
  const x = (R_TERRE * lng * Math.PI) / 180;
  const y = R_TERRE * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  return [x, y];
}

/** Plan de Mercator → point GPS. */
export function inverse(x: number, y: number): Pt {
  const lng = (x / R_TERRE) * (180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(y / R_TERRE)) - Math.PI / 2) * (180 / Math.PI);
  return [lat, lng];
}

/** Arrondi d'une position fractionnaire à l'hexagone le plus proche (coordonnées cubiques). */
function arrondir(qf: number, rf: number): Case {
  const sf = -qf - rf;
  let q = Math.round(qf);
  let r = Math.round(rf);
  const s = Math.round(sf);
  const dq = Math.abs(q - qf);
  const dr = Math.abs(r - rf);
  const ds = Math.abs(s - sf);
  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;
  // + 0 : jamais de -0 (clé « -0:3 » différente de « 0:3 »).
  return { q: q + 0, r: r + 0 };
}

const depuisPlan = (x: number, y: number): Case => arrondir(((S3 / 3) * x - y / 3) / TAILLE, ((2 / 3) * y) / TAILLE);

/** Case qui contient un point GPS. */
export const caseDe = (p: Pt): Case => depuisPlan(...mercator(p));

/** Centre d'une case. */
export const centre = ({ q, r }: Case): Pt => inverse(TAILLE * (S3 * q + (S3 / 2) * r), TAILLE * 1.5 * r);

/** Les 6 sommets d'une case (pour dessiner l'hexagone sur la carte). */
export function sommets({ q, r }: Case): Pt[] {
  const cx = TAILLE * (S3 * q + (S3 / 2) * r);
  const cy = TAILLE * 1.5 * r;
  return Array.from({ length: 6 }, (_, i) => {
    const a = ((60 * i + 30) * Math.PI) / 180;
    return inverse(cx + TAILLE * Math.cos(a), cy + TAILLE * Math.sin(a));
  });
}

/** Au-delà, deux points GPS successifs sont un saut du GPS (tunnel, perte de signal) : on ne relie pas. */
const SAUT_MAX = 600;

/**
 * Cases traversées par un tracé, dans l'ordre et sans doublon : chaque segment est parcouru par pas d'un tiers de case,
 * pour ne rater aucune case même si les points GPS sont espacés.
 */
export function casesTrace(pts: readonly Pt[]): Case[] {
  const vues = new Set<string>();
  const res: Case[] = [];
  const ajouter = (c: Case) => {
    const k = cleCase(c);
    if (!vues.has(k)) {
      vues.add(k);
      res.push(c);
    }
  };
  const plan = pts.map(mercator);
  plan.forEach(([x, y], i) => {
    if (i === 0) return ajouter(depuisPlan(x, y));
    const [x0, y0] = plan[i - 1];
    const d = Math.hypot(x - x0, y - y0);
    // Distance réelle ≈ distance de Mercator × cos(latitude).
    const reel = d * Math.cos((pts[i][0] * Math.PI) / 180);
    if (reel <= SAUT_MAX) {
      const n = Math.ceil(d / (TAILLE / 3));
      for (let k = 1; k < n; k++) ajouter(depuisPlan(x0 + ((x - x0) * k) / n, y0 + ((y - y0) * k) / n));
    }
    ajouter(depuisPlan(x, y));
  });
  return res;
}

/** Cases (q, r) couvrant une zone de carte, avec une case de marge ; null si la zone est trop grande (carte trop dézoomée). */
export function bornes(nord: number, sud: number, ouest: number, est: number): { q0: number; q1: number; r0: number; r1: number } | null {
  const coins = [caseDe([nord, ouest]), caseDe([nord, est]), caseDe([sud, ouest]), caseDe([sud, est])];
  const qs = coins.map((c) => c.q);
  const rs = coins.map((c) => c.r);
  const b = { q0: Math.min(...qs) - 1, q1: Math.max(...qs) + 1, r0: Math.min(...rs) - 1, r1: Math.max(...rs) + 1 };
  return (b.q1 - b.q0) * (b.r1 - b.r0) > 12000 ? null : b;
}

/** Rayons (en cases) des classements : quartier ≈ 3 km, ville ≈ 15 km. */
export const RAYON_QUARTIER = 20;
export const RAYON_VILLE = 100;

/** Surface approximative d'une case en km² (hexagone de ~85 m de rayon à 45° de latitude). */
export const surfaceCase = (lat: number) => {
  const a = TAILLE * Math.cos((lat * Math.PI) / 180);
  return ((3 * S3) / 2) * a * a * 1e-6;
};
