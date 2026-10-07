/**
 * Gel de série (hors cahier des charges, demandé par l'utilisateur, oct. 2026, comme Duolingo) : un jour de séance manqué ne casse
 * pas la série si un gel est en réserve ; il est utilisé tout seul à l'ouverture suivante. On gagne 1 gel tous les 7 jours de série
 * (réserve de 2, 3 avec NÉA Plus) ; 1 gel offert au départ. `streak` (portage du prototype) n'est pas modifié : les jours gelés
 * lui sont donnés comme des jours actifs. Fonctions pures.
 */
import { DAYSPOS } from '@/data/templates';
import type { JoursParSemaine } from '@/data/types';

import { streak, type Log } from './xp';

export const GEL_RESERVE = 2;
export const GEL_RESERVE_PLUS = 3;
export const GEL_PALIER = 7;
export const GELS_DEPART = 1;

export type EtatGel = { gels?: number; gelsUtilises?: string[]; gelPalier?: number };

const jourGele = (k: string) => ({ d: `${k}T12:00:00.000Z` }) as Log;

/** Série de jours en comptant les jours gelés. */
export function serieAvecGels(logs: readonly Log[], days: number, gelsUtilises: readonly string[] = [], now: Date = new Date()): number {
  return gelsUtilises.length ? streak([...logs, ...gelsUtilises.map(jourGele)], days, now) : streak(logs, days, now);
}

/** Série du profil (journal + gels de l'état du jeu). */
export const serie = (e: { logs: readonly Log[]; days: number; jeu: EtatGel }, now: Date = new Date()) => serieAvecGels(e.logs, e.days, e.jeu.gelsUtilises, now);

export const gelsDispo = (j: EtatGel) => j.gels ?? GELS_DEPART;

/**
 * Jours à geler maintenant : le jour prévu manqué le plus récent (avant aujourd'hui, dans les 7 derniers jours), s'il sauve
 * une série d'au moins 2 jours ; recommence tant qu'il reste des gels (plusieurs jours manqués).
 */
export function joursAGeler(logs: readonly Log[], days: number, j: EtatGel, now: Date = new Date()): string[] {
  let stock = gelsDispo(j);
  const utilises = [...(j.gelsUtilises ?? [])];
  const pris: string[] = [];
  while (stock > 0) {
    const sans = serieAvecGels(logs, days, utilises, now);
    // Premier jour manqué qui casse la série : celui où `streak` s'arrête.
    const d = new Date(now);
    let cle: string | null = null;
    for (let k = 0; k <= 7; k++) {
      const key = d.toISOString().slice(0, 10);
      const prevu = DAYSPOS[String(days) as JoursParSemaine].includes((d.getDay() + 6) % 7);
      if (k > 0 && prevu && serieAvecGels(logs, days, [...utilises, key], now) > sans + 1) {
        cle = key;
        break;
      }
      d.setDate(d.getDate() - 1);
    }
    if (!cle) break;
    const avec = serieAvecGels(logs, days, [...utilises, cle], now);
    // La série sauvée (hors jour gelé) doit compter au moins 2 jours.
    if (avec - sans - 1 < 2) break;
    utilises.push(cle);
    pris.push(cle);
    stock--;
  }
  return pris;
}
