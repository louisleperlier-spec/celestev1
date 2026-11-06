/**
 * Vrais sentiers autour de soi (OpenStreetMap, API Overpass) : relations `route=hiking` nommées dans un rayon de 30 km,
 * longueur calculée sur le tracé, dénivelé calculé avec l'altitude réelle du terrain (Open-Meteo, modèle Copernicus 90 m).
 * Fonctions pures : la requête réseau est dans `store/randosPres.ts`.
 */
import { denivele, type Difficulte, type PointAlt, type Sentier } from './rando';
import { hav, type Pt } from './velo';

type Noeud = { lat: number; lon: number };
export type ElementOSM = {
  type: string;
  id: number;
  tags?: Record<string, string>;
  members?: { type: string; geometry?: Noeud[] }[];
};

/** Rayon de recherche (m) et requête Overpass (tracés compris). */
export const RAYON = 30000;
export const requeteOverpass = (lat: number, lng: number) =>
  `[out:json][timeout:25];relation["route"="hiking"]["name"](around:${RAYON},${lat.toFixed(4)},${lng.toFixed(4)});out geom 40;`;

/** Tracé brut d'un sentier : morceaux du tracé (chemins de la relation), longueur, distance au point de départ. */
export type Brut = { id: string; nom: string; reseau: string; morceaux: Pt[][]; km: number; boucle: boolean; aMoi: number; depart: Pt };

const longueur = (pts: readonly Pt[]) => pts.reduce((a, p, i) => (i ? a + hav(pts[i - 1], p) : 0), 0);

/** Relations Overpass → sentiers de 1,5 à 25 km, du plus proche au plus loin (8 au plus). */
export function sentiersBruts(els: readonly ElementOSM[], ici: Pt, max = 8): Brut[] {
  const r: Brut[] = [];
  for (const e of els) {
    if (e.type !== 'relation' || !e.tags?.name) continue;
    const morceaux = (e.members ?? [])
      .filter((m) => m.type === 'way' && m.geometry && m.geometry.length > 1)
      .map((m) => m.geometry!.map((n): Pt => [n.lat, n.lon]));
    if (!morceaux.length) continue;
    const km = morceaux.reduce((a, m) => a + longueur(m), 0);
    if (km < 1.5 || km > 25) continue;
    const tous = morceaux.flat();
    let aMoi = Infinity;
    let depart = tous[0];
    for (let k = 0; k < tous.length; k += Math.max(1, Math.floor(tous.length / 200))) {
      const d = hav(ici, tous[k]);
      if (d < aMoi) {
        aMoi = d;
        depart = tous[k];
      }
    }
    const premier = morceaux[0][0];
    const dernier = morceaux[morceaux.length - 1][morceaux[morceaux.length - 1].length - 1];
    r.push({ id: 'osm-' + e.id, nom: e.tags.name, reseau: e.tags.operator ?? e.tags.network ?? '', morceaux, km, boucle: hav(premier, dernier) < 0.4, aMoi, depart });
  }
  return r.sort((a, b) => a.aMoi - b.aMoi).slice(0, max);
}

/** `n` points répartis le long du tracé (pour l'altitude et la carte). */
export function echantillon(b: Brut, n = 60): Pt[] {
  const tous = b.morceaux.flat();
  if (tous.length <= n) return tous;
  const pas = (tous.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, k) => tous[Math.round(k * pas)]);
}

/** Difficulté : facile sous 6 km et 250 m de montée, difficile au-delà de 15 km ou 700 m. */
export const difficulte = (km: number, dplus: number): Difficulte => (dplus > 700 || km > 15 ? 'difficile' : km < 6 && dplus < 250 ? 'facile' : 'modere');

/** Durée estimée (min) : 4 km/h + 1 h par 600 m de montée. */
export const dureeEstimee = (km: number, dplus: number) => Math.round((km / 4 + dplus / 600) * 60 / 5) * 5;

/**
 * Sentier complet à partir du tracé et des altitudes des points échantillonnés.
 * Tracé linéaire (pas une boucle) : aller-retour, distance doublée et profil en miroir.
 */
export function sentierOSM(b: Brut, pts: readonly Pt[], alts: readonly number[]): Sentier {
  const kmAller: number[] = [0];
  for (let k = 1; k < pts.length; k++) kmAller.push(kmAller[k - 1] + hav(pts[k - 1], pts[k]));
  const facteur = kmAller[kmAller.length - 1] > 0 ? b.km / kmAller[kmAller.length - 1] : 1;
  let profil: PointAlt[] = pts.map((_, k) => ({ km: +(kmAller[k] * facteur).toFixed(2), alt: Math.round(alts[k]) }));
  let km = b.km;
  if (!b.boucle) {
    const retour = [...profil].reverse().slice(1).map((p) => ({ km: +(2 * b.km - p.km).toFixed(2), alt: p.alt }));
    profil = [...profil, ...retour];
    km = 2 * b.km;
  }
  const dplus = denivele(profil.map((p) => p.alt));
  const iMax = profil.reduce((m, p, k) => (p.alt > profil[m].alt ? k : m), 0);
  const sommet = pts[Math.min(pts.length - 1, iMax)] ?? b.depart;
  return {
    id: b.id,
    nom: b.nom,
    lieu: b.reseau || 'Sentier balisé',
    region: `À ${b.aMoi < 1 ? 'moins de 1' : Math.round(b.aMoi)} km de toi`,
    km: +km.toFixed(1),
    dplus,
    min: dureeEstimee(km, dplus),
    difficulte: difficulte(km, dplus),
    altDepart: profil[0].alt,
    altSommet: profil[iMax].alt,
    lat: sommet[0],
    lng: sommet[1],
    voir: [],
    recherche: '',
    source: 'osm',
    trace: b.morceaux.map((m) => (m.length > 120 ? m.filter((_, k) => k % Math.ceil(m.length / 120) === 0 || k === m.length - 1) : m)),
    profil,
    kmSommet: profil[iMax].km,
    depart: b.depart,
    boucle: b.boucle,
  };
}
