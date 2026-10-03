/**
 * Randonnée (hors prototype, maquettes de l'utilisateur, oct. 2026) : fonctions pures.
 * Dénivelé positif mesuré à partir de l'altitude GPS (lissée, seuil de 3 m contre le bruit), profil d'altitude,
 * calories (MET 6 + effort de montée), XP, rando de la semaine, badges du récap.
 */
import { hash } from './xp';

export type Difficulte = 'facile' | 'modere' | 'difficile';
export const DIFFICULTES: Record<Difficulte, string> = { facile: 'Facile', modere: 'Modéré', difficile: 'Difficile' };
export type Voir = 'belvedere' | 'chute' | 'lac' | 'riviere';
export const VOIR: Record<Voir, string> = { belvedere: 'Belvédère', chute: 'Chute', lac: 'Lac', riviere: 'Rivière' };

/** Sentier proposé (données indicatives, à vérifier auprès du parc avant de partir). */
export type Sentier = {
  id: string;
  nom: string;
  lieu: string;
  region: string;
  km: number;
  dplus: number;
  /** Durée estimée (min). */
  min: number;
  difficulte: Difficulte;
  altDepart: number;
  altSommet: number;
  /** Coordonnées approximatives du secteur (météo, carte). */
  lat: number;
  lng: number;
  voir: Voir[];
  /** Recherche Apple Plans pour l'itinéraire. */
  recherche: string;
};

export type PointAlt = { km: number; alt: number };

/** Dénivelé positif d'une suite d'altitudes : moyenne glissante sur 5 points puis montées de plus de 3 m. */
export function denivele(alts: readonly number[]): number {
  if (alts.length < 2) return 0;
  const lisse = alts.map((_, i) => {
    const f = alts.slice(Math.max(0, i - 2), i + 3);
    return f.reduce((a, b) => a + b, 0) / f.length;
  });
  let d = 0;
  let base = lisse[0];
  for (const a of lisse) {
    if (a > base + 3) {
      d += a - base;
      base = a;
    } else if (a < base) base = a;
  }
  return Math.round(d);
}

/** Profil d'altitude approximatif d'un sentier (aller-retour : montée régulière puis descente). */
export function profilSentier(s: Sentier, n = 40): PointAlt[] {
  return Array.from({ length: n + 1 }, (_, k) => {
    const x = k / n;
    const u = 1 - Math.abs(2 * x - 1);
    // Montée en S (plus raide au milieu), petites ondulations du terrain.
    const forme = u * u * (3 - 2 * u) + Math.sin(x * Math.PI * 9) * 0.025 * u;
    return { km: +(s.km * x).toFixed(2), alt: Math.round(s.altDepart + (s.altSommet - s.altDepart) * forme) };
  });
}

/** Points d'altitude mesurés pour le profil du récap (au plus `n` points). */
export function profilMesure(pts: readonly PointAlt[], n = 60): PointAlt[] {
  if (pts.length <= n) return [...pts];
  const pas = (pts.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, k) => pts[Math.round(k * pas)]);
}

/** Calories : MET 6 (randonnée) × poids × heures, + 0,6 kcal par kg et par 100 m de montée. */
export const caloriesRando = (sec: number, kg: number, dplus: number) => Math.round(6 * kg * (sec / 3600) + 0.006 * kg * dplus);

/** XP : 40 + 6 par km + 1 par 25 m de montée. */
export const xpRando = (km: number, dplus: number) => Math.round(40 + 6 * km + dplus / 25);

/** Rando de la semaine : choisie selon le lundi (même pour tout le monde). */
export const randoSemaine = <T>(liste: readonly T[], lundi: string): T => liste[Math.floor(hash('rando' + lundi) * liste.length) % liste.length];

export type Badge = { id: 'sommet1' | 'd500' | 'tot' | 'km10'; titre: string; icone: 'hexa' | 'trend' | 'sun' | 'pin' };

/** Badges d'une rando : 1re rando, 500 m de montée, départ avant 8 h, 10 km. */
export function badgesRando(r: { dplus: number; km: number; debut: Date; premiere: boolean }): Badge[] {
  const b: Badge[] = [];
  if (r.premiere) b.push({ id: 'sommet1', titre: '1re rando', icone: 'hexa' });
  if (r.dplus >= 500) b.push({ id: 'd500', titre: '500 m de D+', icone: 'trend' });
  if (r.debut.getHours() < 8) b.push({ id: 'tot', titre: 'Lève-tôt', icone: 'sun' });
  if (r.km >= 10) b.push({ id: 'km10', titre: '10 km', icone: 'pin' });
  return b;
}

/** « 3 h 30 », « 45 min ». */
export const duree = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ' ' + String(min % 60).padStart(2, '0') : ''}` : `${min} min`);
