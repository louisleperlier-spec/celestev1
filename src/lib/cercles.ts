/**
 * Cercles du jour (ajout validé, absent du prototype), comme les anneaux d'activité d'Apple :
 * Bouger (calories actives), Exercice (minutes), Sommeil (heures de la nuit) et Récupération (VFC du jour / référence).
 * Avec Apple Santé, Bouger et Exercice viennent de la montre (qui compte aussi les séances NÉA enregistrées) ;
 * sinon, des séances et sorties vélo NÉA du jour.
 */
import type { ActiviteJour } from './sante';
import { baseHrv, type MesureVFC, type Nuit } from './sommeil';
import { dayKey, type Log } from './xp';

export type IdCercle = 'bouger' | 'exercice' | 'sommeil' | 'recup';

export type Cercle = { id: IdCercle; nom: string; val: number; obj: number; unite: string };

/** Objectif de sommeil : 8 h, la durée qui donne le maximum au score de nuit. */
export const OBJ_SOMMEIL = 8;

/** Même jour local. */
const memeJour = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Clé de la nuit qui se termine le matin de `jour` (même calcul que `nouvelleNuit`). */
export function cleNuit(jour: Date): string {
  const d = new Date(jour.getFullYear(), jour.getMonth(), jour.getDate() - 1, 12);
  return dayKey(d);
}

export type DonneesCercles = {
  logs: readonly Log[];
  nights: readonly Nuit[];
  hrvChecks: readonly MesureVFC[];
  /** Objectif Bouger : calories d'une séance moyenne du programme. */
  objKcal: number;
  /** Objectif Exercice : durée d'une séance choisie dans l'onboarding. */
  objMin: number;
};

/** Les 4 cercles d'un jour. `sante` : activité lue dans Apple Santé pour ce jour, s'il y en a. */
export function cerclesJour(jour: Date, e: DonneesCercles, sante?: ActiviteJour | null): Cercle[] {
  const logs = e.logs.filter((l) => memeJour(new Date(l.d), jour));
  const kcal = sante ? sante.kcal : logs.reduce((a, l) => a + l.cal, 0);
  const min = sante ? sante.min : logs.reduce((a, l) => a + l.min, 0);
  const nuit = e.nights.find((n) => n.d === cleNuit(jour));
  // Récupération : mesure du matin de ce jour, sinon VFC nocturne de sa nuit, comparée à la VFC de référence.
  const mesure = [...e.hrvChecks].reverse().find((c) => c.kind === 'matin' && memeJour(new Date(c.d), jour));
  const hrv = mesure?.hrv ?? nuit?.hrv ?? 0;
  const base = baseHrv(e.nights, e.hrvChecks);
  return [
    { id: 'bouger', nom: 'Bouger', val: Math.round(kcal), obj: Math.max(1, Math.round(e.objKcal)), unite: 'kcal' },
    { id: 'exercice', nom: 'Exercice', val: Math.round(min), obj: Math.max(1, e.objMin), unite: 'min' },
    { id: 'sommeil', nom: 'Sommeil', val: nuit?.h ?? 0, obj: OBJ_SOMMEIL, unite: 'h' },
    { id: 'recup', nom: 'Récupération', val: hrv ? Math.round((hrv / base) * 100) : 0, obj: 100, unite: '%' },
  ];
}

/** Part remplie d'un cercle (au-delà de 1 : objectif dépassé, le cercle fait plus d'un tour). */
export const part = (c: Cercle) => (c.obj > 0 ? c.val / c.obj : 0);

/** Les 7 jours de la semaine (lundi à dimanche) contenant `now`. */
export function joursSemaine(now: Date = new Date()): Date[] {
  const l = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => new Date(l.getFullYear(), l.getMonth(), l.getDate() + i));
}
