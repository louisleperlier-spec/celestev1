/**
 * Activités notées à la main (hors cahier des charges, demandées par l'utilisateur, oct. 2026) : un autre sport (tennis, natation…)
 * ou une séance de musculation libre (tractions & co, séries notées). Même suite qu'une séance : journal, XP, quête, carte, Apple Santé.
 */
import type { ExerciceId } from '@/data/types';
import { exercice } from '@/lib/plan';
import { enregistrerEntrainement } from '@/lib/sante';
import { INTENSITES, kcalSport, MET_MUSCU_LIBRE, sportParId, volumeLibre, xpMuscuLibre, xpSport, type Intensite, type SerieLibre } from '@/lib/sports';

import { useProfil } from './profil';

/** Fin de l'activité : maintenant, ou hier à la même heure. */
const finActivite = (hier: boolean) => new Date(Date.now() - (hier ? 864e5 : 0));

export type ResultatActivite = { xp: number; cal: number };

/** `titre` : nom affiché dans le journal (ex. une séance de yoga guidée), sinon le nom du sport. */
export function enregistrerSport(
  id: string,
  min: number,
  intensite: Intensite,
  hier: boolean,
  fc?: { hrAvg: number; hrMax: number; hrv: number },
  titre?: string,
): ResultatActivite | null {
  const s = sportParId(id);
  if (!s || min < 1) return null;
  const st = useProfil.getState();
  const fin = finActivite(hier);
  const debut = new Date(+fin - min * 60e3);
  const cal = kcalSport(s.met, st.weight, min, intensite);
  st.addLog({ d: fin.toISOString(), debut: debut.toISOString(), type: 'sport', sport: s.id, title: titre ?? s.nom, min, cal, vol: 0, ...(fc && fc.hrAvg > 0 ? fc : {}) });
  const xp = useProfil.getState().addXp(xpSport(min) + (intensite === 'intense' ? 5 : 0), titre ?? s.nom);
  if (!hier) useProfil.getState().quest('seance');
  enregistrerEntrainement({ type: 'sport', debut, fin, kcal: cal, hk: s.hk });
  return { xp, cal };
}

export type ExoLibre = { id: ExerciceId; series: SerieLibre[] };

export function enregistrerMuscuLibre(exos: readonly ExoLibre[], min: number, hier: boolean): ResultatActivite | null {
  const faits = exos.map((e) => ({ ...e, series: e.series.filter((s) => s.reps > 0) })).filter((e) => e.series.length > 0);
  if (!faits.length || min < 1) return null;
  const st = useProfil.getState();
  const fin = finActivite(hier);
  const debut = new Date(+fin - min * 60e3);
  const series = faits.flatMap((e) => e.series);
  const cal = Math.round(MET_MUSCU_LIBRE * INTENSITES.moderee.facteur * st.weight * (min / 60));
  const titre = faits.length === 1 ? exercice(faits[0].id).nom : 'Séance libre';
  st.addLog({ d: fin.toISOString(), debut: debut.toISOString(), type: 'muscu', libre: true, title: titre, min, cal, vol: volumeLibre(series), ex: faits.length });
  const xp = useProfil.getState().addXp(xpMuscuLibre(series.length), 'Séance libre');
  if (!hier) {
    useProfil.getState().quest('seance');
    useProfil.getState().programmerPost('muscu', null);
  }
  enregistrerEntrainement({ type: 'muscu', debut, fin, kcal: cal });
  return { xp, cal };
}
