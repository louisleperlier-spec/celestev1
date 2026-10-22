/**
 * « Ta journée » (hors prototype, demandé par l'utilisateur, oct. 2026) : les choses à faire aujourd'hui pour une bonne journée.
 * Cochées seules d'après le journal (séance ou sortie, mesure de récupération, nuit, calories) ; l'eau et la pause respiration
 * se cochent à la main (état `journee` du profil, remis à zéro chaque jour).
 */
import { cleNuit, type Cercle } from './cercles';
import type { MesureVFC, Nuit } from './sommeil';
import { dayKey, type Log } from './xp';

/** Ce qui se coche à la main, pour le jour `d` (AAAA-MM-JJ). */
export type Journee = { d: string; eau: number; calme: boolean; fete?: boolean };

export const VERRES_EAU = 8;

export type IdTache = 'seance' | 'bouger' | 'recup' | 'nuit' | 'eau' | 'calme';

export type Tache = {
  id: IdTache;
  titre: string;
  sous: string;
  fait: boolean;
  /** Avancement 0 → 1 (barre fine sous la ligne). */
  progres: number;
  icone: 'dumb' | 'bike' | 'flame' | 'pulse' | 'moon' | 'wave' | 'run' | 'cloud';
};

export type DonneesJournee = {
  logs: readonly Log[];
  hrvChecks: readonly MesureVFC[];
  nights: readonly Nuit[];
  journee: Journee | null | undefined;
  /** Séance prévue aujourd'hui (null : jour de repos). */
  seance: { titre: string; min: number; sortie: boolean } | null;
  /** Cercles Bouger et Exercice du jour (avec Apple Santé s'il est là). */
  bouger: Cercle;
  exercice: Cercle;
};

const memeJour = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** État manuel du jour (vide si la date a changé). */
export const journeeDu = (j: Journee | null | undefined, now: Date = new Date()): Journee =>
  j && j.d === dayKey(now) ? j : { d: dayKey(now), eau: 0, calme: false };

export function tachesDuJour(e: DonneesJournee, now: Date = new Date()): Tache[] {
  const j = journeeDu(e.journee, now);
  const actAuj = e.logs.filter((l) => memeJour(new Date(l.d), now));
  const minAuj = Math.max(e.exercice.val, actAuj.reduce((a, l) => a + l.min, 0));
  const t: Tache[] = [];
  if (e.seance) {
    t.push({
      id: 'seance',
      titre: e.seance.sortie ? 'Ta sortie du jour' : 'Ta séance du jour',
      sous: `${e.seance.titre} · ${Math.round(e.seance.min)} min`,
      fait: actAuj.length > 0,
      progres: actAuj.length > 0 ? 1 : 0,
      icone: e.seance.sortie ? 'bike' : 'dumb',
    });
  } else {
    t.push({ id: 'seance', titre: 'Bouge 20 minutes', sous: 'Jour de repos : marche, vélo tranquille ou rando', fait: minAuj >= 20, progres: Math.min(1, minAuj / 20), icone: 'run' });
  }
  const pb = e.bouger.obj > 0 ? e.bouger.val / e.bouger.obj : 0;
  t.push({ id: 'bouger', titre: 'Atteins ton objectif Bouger', sous: `${e.bouger.val} / ${e.bouger.obj} kcal`, fait: pb >= 1, progres: Math.min(1, pb), icone: 'flame' });
  const mesure = e.hrvChecks.some((c) => memeJour(new Date(c.d), now));
  t.push({ id: 'recup', titre: 'Mesure ta récupération', sous: mesure ? 'Faite aujourd’hui' : '1 minute, au calme', fait: mesure, progres: mesure ? 1 : 0, icone: 'pulse' });
  const nuit = e.nights.find((n) => n.d === cleNuit(now));
  t.push({
    id: 'nuit',
    titre: 'Note ta nuit',
    sous: nuit ? `${String(nuit.h).replace('.', ',')} h de sommeil${nuit.src === 'sante' ? ' (Apple Santé)' : ''}` : 'Sommeil, qualité et VFC nocturne',
    fait: !!nuit,
    progres: nuit ? 1 : 0,
    icone: 'moon',
  });
  t.push({ id: 'eau', titre: `Bois ${VERRES_EAU} verres d’eau`, sous: `${j.eau} / ${VERRES_EAU} verres · touche + à chaque verre`, fait: j.eau >= VERRES_EAU, progres: Math.min(1, j.eau / VERRES_EAU), icone: 'cloud' });
  t.push({ id: 'calme', titre: 'Prends 2 min pour souffler', sous: j.calme ? 'Fait, bien joué' : 'Inspire 4 s, expire 6 s', fait: j.calme, progres: j.calme ? 1 : 0, icone: 'wave' });
  return t;
}

/** Phrase d'encouragement selon le nombre de tâches faites. */
export function phraseJournee(faites: number, total: number): string {
  if (faites >= total) return 'Journée parfaite ! Tu as tout coché 🎉';
  const reste = total - faites;
  if (faites === 0) return 'Six petites choses pour une journée au top ☀️';
  if (reste === 1) return 'Plus qu’une chose et c’est la journée parfaite 🔥';
  return `Encore ${reste} choses pour une journée au top 💪`;
}
