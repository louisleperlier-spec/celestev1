/**
 * Vélo : distance GPS, projection du tracé, parcours simulé, calories et XP d'une sortie.
 * Portage fidèle du prototype (`hav`, `proj`, `mapSvg`, `bikeTick`, `bikeStop`).
 */

/** Point GPS [latitude, longitude]. */
export type Pt = readonly [number, number];

/** Distance en km entre deux points (haversine, hav). */
export function hav(a: Pt, b: Pt): number {
  const R = 6371;
  const t = (x: number) => (x * Math.PI) / 180;
  const dl = t(b[0] - a[0]);
  const dn = t(b[1] - a[1]);
  const h = Math.sin(dl / 2) ** 2 + Math.cos(t(a[0])) * Math.cos(t(b[0])) * Math.sin(dn / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Nouveau point GPS : gardé s'il est à plus de 4 m du précédent (watchPosition du prototype). */
export function ajouterPoint(pts: readonly Pt[], dist: number, pt: Pt): { pts: Pt[]; dist: number } {
  const lp = pts[pts.length - 1];
  if (lp && hav(lp, pt) <= 0.004) return { pts: [...pts], dist };
  return { pts: [...pts, pt], dist: lp ? dist + hav(lp, pt) : dist };
}

/** Départ du parcours simulé quand le GPS est indisponible (Longueuil, cap au hasard). */
export type Sim = { lat: number; lng: number; h: number };
export const simDepart = (random: () => number = Math.random): Sim => ({ lat: 45.5312, lng: -73.5181, h: random() * 6.28 });

/** Une seconde de parcours simulé (bikeTick, mode extérieur sans GPS). */
export function pasSimule(s: Sim, spd: number, pts: readonly Pt[], dist: number, random: () => number = Math.random) {
  const h = s.h + (random() - 0.5) * 0.35;
  const v = Math.max(12, Math.min(32, (spd || 20) + (random() - 0.5) * 1.6));
  const m = v / 3.6;
  const lat = s.lat + (Math.cos(h) * m) / 110540;
  const lng = s.lng + (Math.sin(h) * m) / (111320 * Math.cos((lat * Math.PI) / 180));
  const pt: Pt = [lat, lng];
  const lp = pts[pts.length - 1];
  return { sim: { lat, lng, h }, spd: v, pts: [...pts, pt], dist: lp ? dist + hav(lp, pt) : dist };
}

/** Une seconde en stationnaire : vitesse selon la résistance (bikeTick). */
export const vitesseStationnaire = (lvl: number, random: () => number = Math.random) => 14 + lvl * 1.3 + (random() - 0.5) * 1.5;

/** Intensité cardio simulée : résistance en stationnaire, vitesse dehors. */
export const intensiteVelo = (mode: 'ext' | 'int', lvl: number, spd: number) => (mode === 'int' ? 0.35 + lvl * 0.05 : Math.min(0.9, Math.max(0.3, spd / 34)));

/** Calories d'une sortie : MET selon la vitesse moyenne × poids × durée (bikeStop). */
export function caloriesVelo(dist: number, sec: number, weight: number): number {
  const avgS = sec ? dist / (sec / 3600) : 0;
  const met = avgS < 16 ? 4 : avgS < 19 ? 6.8 : avgS < 22 ? 8 : avgS < 25 ? 10 : 12;
  return Math.round((met * weight * sec) / 3600);
}

/** XP de base d'une sortie : 30 + 4 par km. */
export const xpVelo = (dist: number) => 30 + Math.round(dist * 4);

/** Projection plane du tracé en mètres (proj). */
export function proj(pts: readonly Pt[]): [number, number][] {
  if (!pts.length) return [];
  const la0 = (pts[0][0] * Math.PI) / 180;
  return pts.map((p) => [p[1] * 111320 * Math.cos(la0), -p[0] * 110540]);
}

/** Tracé ajusté dans un cadre W × H avec 20 px de marge (mapSvg). */
export function tracePlan(pts: readonly Pt[], W = 340, H = 230): [number, number][] {
  const q = proj(pts);
  if (q.length < 2) return [];
  const x0 = Math.min(...q.map((p) => p[0]));
  const x1 = Math.max(...q.map((p) => p[0]));
  const y0 = Math.min(...q.map((p) => p[1]));
  const y1 = Math.max(...q.map((p) => p[1]));
  const sc = Math.min((W - 40) / Math.max(50, x1 - x0), (H - 40) / Math.max(50, y1 - y0));
  const ox = (W - (x1 - x0) * sc) / 2;
  const oy = (H - (y1 - y0) * sc) / 2;
  return q.map((p) => [(p[0] - x0) * sc + ox, (p[1] - y0) * sc + oy]);
}

/** Lien « Ouvrir dans Plans » : itinéraire à vélo du départ à l'arrivée. */
export const lienPlans = (a: Pt, b: Pt) =>
  `https://maps.apple.com/?saddr=${a[0].toFixed(5)},${a[1].toFixed(5)}&daddr=${b[0].toFixed(5)},${b[1].toFixed(5)}&dirflg=b`;
