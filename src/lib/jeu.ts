/**
 * Cartes récompense, records et défis de la semaine (hors prototype, demandés par l'utilisateur, oct. 2026).
 * Fonctions pures : l'état (`EtatJeu`) est rangé dans le profil, les effets (XP, fêtes) dans `store/jeu.ts`.
 *
 * Cartes : les 50 exercices + les 4 coachs (54). Rareté : Légendaire = coach ; Épique = exercice de niveau 2 ou 3 ;
 * Rare = niveau 1 sur machine, poulie ou vélo ; Commune = niveau 1 aux haltères ou au poids du corps.
 * Une carte à chaque activité terminée, un booster de 3 (dont une Rare ou mieux) pour un niveau ou un défi,
 * une carte Rare ou mieux pour un record. Doubles recyclés en XP ; une Légendaire nouvelle donne un Turbo x2.
 */
import { COACHES } from '@/data/coaches';
import { EXERCICES } from '@/data/exercices';
import { SENTIERS } from '@/data/randos';
import { GROUPES } from '@/data/referentiels';
import type { CoachId, Exercice, ExerciceId } from '@/data/types';

import type { MesureVFC, Nuit } from './sommeil';
import { weekDates } from './semaine';
import type { MissionId } from './succes';
import { hash, type Log } from './xp';
import type { EtatGel } from './gel';

/** 0 Commune, 1 Rare, 2 Épique, 3 Légendaire. */
export type Rarete = 0 | 1 | 2 | 3;
export const RARETES = ['Commune', 'Rare', 'Épique', 'Légendaire'] as const;
/** Chances de tirage (%) par rareté. */
export const CHANCES = [62, 26, 10, 2] as const;
/** XP d'une carte en double. */
export const XP_DOUBLE = [5, 15, 40, 100] as const;

export type CarteId = `ex:${ExerciceId}` | `coach:${CoachId}` | `rando:${string}`;
/** `rando` : carte « Explorateur » d'un sentier, gagnée seulement en le faisant (jamais tirée au hasard). */
export type Carte = { id: CarteId; nom: string; sous: string; rarete: Rarete; ex?: ExerciceId; coach?: CoachId; rando?: string };

const rareteExercice = (e: Exercice): Rarete =>
  e.niveau >= 2 ? 2 : e.materiel === 'mac' || e.materiel === 'pou' || e.materiel === 'velo' ? 1 : 0;

export const CARTES: readonly Carte[] = [
  ...COACHES.map((c): Carte => ({ id: `coach:${c.id}`, nom: c.nom, sous: c.style, rarete: 3, coach: c.id })),
  ...EXERCICES.map((e): Carte => ({ id: `ex:${e.id}`, nom: e.nom, sous: GROUPES[e.groupe], rarete: rareteExercice(e), ex: e.id })),
  ...SENTIERS.map((r): Carte => ({ id: `rando:${r.id}`, nom: r.nom, sous: 'Explorateur', rarete: 3, rando: r.id })),
];
const PAR_ID = new Map(CARTES.map((c) => [c.id, c]));
export const carte = (id: CarteId) => PAR_ID.get(id)!;

/** Une carte au hasard, de rareté au moins `min`. */
export function tirer(min: Rarete = 0, rnd: () => number = Math.random): CarteId {
  const poids: number[] = CHANCES.map((c, r) => (r >= min ? c : 0));
  let x = rnd() * poids.reduce((a, b) => a + b, 0);
  let r = 3 as Rarete;
  for (let k = 0; k < 4; k++) {
    if (x < poids[k]) {
      r = k as Rarete;
      break;
    }
    x -= poids[k];
  }
  const liste = CARTES.filter((c) => c.rarete === r && !c.rando);
  return liste[Math.floor(rnd() * liste.length) % liste.length].id;
}

/** Cartes gagnées, pas encore ouvertes. */
export type Paquet = { id: string; d: string; source: string; cartes: CarteId[] };

/** `n` cartes ; la dernière est au moins de rareté `min` (booster : une Rare garantie). */
export function nouveauPaquet(n: number, source: string, min: Rarete = 0, rnd: () => number = Math.random): Paquet {
  const cartes = Array.from({ length: n }, (_, k) => tirer(k === n - 1 ? min : 0, rnd));
  const d = new Date().toISOString();
  return { id: d + '-' + Math.floor(rnd() * 1e6), d, source, cartes };
}

export type Records = { vol: number; kmVelo: number; kmCourse: number; min: number; serie: number };
export type DefiId = 'seances' | 'km' | 'nuits' | 'recup' | 'xp' | 'minutes';
export type EtatJeu = {
  /** Nombre d'exemplaires de chaque carte (doubles compris). */
  cartes: Partial<Record<CarteId, number>>;
  paquets: Paquet[];
  records: Records;
  /** Défis réussis de la semaine `sem` (lundi AAAA-MM-JJ). */
  defis: { sem: string; pris: DefiId[] };
  /** Cartes succès : missions récompensées et records battus (champs ajoutés après coup, d'où l'option). */
  missions?: MissionId[];
  nbRecords?: number;
} & EtatGel;
export const JEU_DEFAUT: EtatJeu = { cartes: {}, paquets: [], records: { vol: 0, kmVelo: 0, kmCourse: 0, min: 0, serie: 0 }, defis: { sem: '', pris: [] } };

export type Tirage = { id: CarteId; nouvelle: boolean; xp: number };

/** Ouvre un paquet : cartes ajoutées à la collection, XP des doubles, Turbos des Légendaires nouvelles. */
export function ouvrir(jeu: EtatJeu, id: string): { jeu: EtatJeu; tirages: Tirage[]; xp: number; turbos: number } | null {
  const p = jeu.paquets.find((x) => x.id === id);
  if (!p) return null;
  const cartes = { ...jeu.cartes };
  const tirages = p.cartes.map((c): Tirage => {
    const n = cartes[c] ?? 0;
    cartes[c] = n + 1;
    return { id: c, nouvelle: n === 0, xp: n === 0 ? 0 : XP_DOUBLE[carte(c).rarete] };
  });
  const xp = tirages.reduce((a, t) => a + t.xp, 0);
  const turbos = tirages.filter((t) => t.nouvelle && carte(t.id).rarete === 3).length;
  return { jeu: { ...jeu, cartes, paquets: jeu.paquets.filter((x) => x.id !== id) }, tirages, xp, turbos };
}

/** Cartes différentes possédées. */
export const possedees = (jeu: EtatJeu) => CARTES.filter((c) => (jeu.cartes[c.id] ?? 0) > 0).length;

const dec1 = (v: number) => v.toFixed(1).replace('.', ',');
const milliers = (v: number) => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Meilleures valeurs d'un journal (séance la plus lourde, plus longues sorties, plus longue activité). */
export function meilleurs(logs: readonly Log[]): Omit<Records, 'serie'> {
  const max = (f: (l: Log) => number) => logs.reduce((a, l) => Math.max(a, f(l)), 0);
  return {
    vol: max((l) => (l.type === 'muscu' ? l.vol : 0)),
    kmVelo: max((l) => (l.type === 'velo' ? (l.dist ?? 0) : 0)),
    kmCourse: max((l) => (l.type === 'course' ? (l.dist ?? 0) : 0)),
    min: max((l) => l.min),
  };
}

/** Records battus par une nouvelle activité (seulement s'il y avait déjà une valeur à battre). */
export function recordsBattus(avant: readonly Log[], l: Log): { titre: string; valeur: string }[] {
  const m = meilleurs(avant);
  const r: { titre: string; valeur: string }[] = [];
  if (l.type === 'muscu' && m.vol > 0 && l.vol > m.vol) r.push({ titre: 'Séance la plus lourde', valeur: milliers(l.vol) + ' kg soulevés' });
  if (l.type === 'velo' && m.kmVelo > 0 && (l.dist ?? 0) > m.kmVelo) r.push({ titre: 'Plus longue sortie vélo', valeur: dec1(l.dist ?? 0) + ' km' });
  if (l.type === 'course' && m.kmCourse > 0 && (l.dist ?? 0) > m.kmCourse) r.push({ titre: 'Plus longue course', valeur: dec1(l.dist ?? 0) + ' km' });
  if (!r.length && m.min > 0 && l.min > m.min) r.push({ titre: 'Plus longue activité', valeur: l.min + ' min' });
  return r;
}

export const TEXTES_RECORDS: readonly [keyof Records, string, (v: number) => string][] = [
  ['vol', 'Séance la plus lourde', (v) => milliers(v) + ' kg'],
  ['kmCourse', 'Plus longue course', (v) => dec1(v) + ' km'],
  ['kmVelo', 'Plus longue sortie vélo', (v) => dec1(v) + ' km'],
  ['serie', 'Meilleure série', (v) => v + ' j'],
];

const DEFIS: Record<DefiId, { icone: string; titre: (but: number) => string; but: (jours: number) => number }> = {
  seances: { icone: 'dumb', titre: (b) => `Fais ${b} séances ou sorties`, but: (j) => j },
  km: { icone: 'bike', titre: (b) => `Parcours ${b} km à vélo ou en courant`, but: () => 10 },
  nuits: { icone: 'moon', titre: (b) => `Note ${b} nuits de sommeil`, but: () => 5 },
  recup: { icone: 'pulse', titre: (b) => `Fais ${b} mesures de récupération`, but: () => 2 },
  xp: { icone: 'bolt', titre: (b) => `Gagne ${b} XP`, but: () => 400 },
  minutes: { icone: 'clock', titre: (b) => `Bouge ${b} minutes`, but: () => 150 },
};
const AUTRES: DefiId[] = ['km', 'nuits', 'recup', 'xp', 'minutes'];

/** Les 3 défis de la semaine : séances + 2 tirés selon le lundi. */
export function defisSemaine(sem: string): DefiId[] {
  const i = Math.floor(hash(sem) * AUTRES.length);
  return ['seances', AUTRES[i], AUTRES[(i + 2) % AUTRES.length]];
}

export type SuiviDefis = { logs: readonly Log[]; nights: readonly Nuit[]; hrvChecks: readonly MesureVFC[]; xpLog: readonly { d: string; xp: number }[]; days: number };
export type Defi = { id: DefiId; icone: string; titre: string; fait: number; but: number };

/** Avancement d'un défi depuis le lundi de la semaine. */
export function defi(id: DefiId, s: SuiviDefis, now: Date = new Date()): Defi {
  const lundi = weekDates(now)[0];
  const dans = (d: string) => new Date(d) >= lundi;
  const logs = s.logs.filter((l) => dans(l.d));
  const fait =
    id === 'seances'
      ? logs.length
      : id === 'km'
        ? Math.floor(logs.reduce((a, l) => a + (l.type !== 'muscu' ? (l.dist ?? 0) : 0), 0))
        : id === 'nuits'
          ? s.nights.filter((n) => dans(n.d)).length
          : id === 'recup'
            ? s.hrvChecks.filter((c) => dans(c.d)).length
            : id === 'xp'
              ? s.xpLog.filter((x) => dans(x.d)).reduce((a, x) => a + x.xp, 0)
              : logs.reduce((a, l) => a + l.min, 0);
  const d = DEFIS[id];
  const but = d.but(s.days);
  return { id, icone: d.icone, titre: d.titre(but), fait: Math.min(fait, but), but };
}
