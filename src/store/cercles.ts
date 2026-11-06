/**
 * Cercles de la semaine : données NÉA du profil + activité Apple Santé (calories actives, minutes d'exercice)
 * rafraîchie quand un écran avec des cercles s'affiche.
 */
import { useMemo } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { cerclesJour, joursSemaine, type Cercle } from '@/lib/cercles';
import { sesKcal } from '@/lib/plan';
import { activiteSante, type ActiviteJour } from '@/lib/sante';
import { dayKey } from '@/lib/xp';

import { usePlan, useProfil } from './profil';

/** Activité Apple Santé de la semaine (lundi → aujourd'hui), null sans Apple Santé. */
const useActivite = create<{ lundi: string | null; jours: ActiviteJour[] | null }>(() => ({ lundi: null, jours: null }));

export async function rafraichirActivite() {
  const lundi = joursSemaine()[0];
  const jours = await activiteSante(lundi);
  useActivite.setState({ lundi: dayKey(lundi), jours });
}

/** Les cercles de chaque jour de la semaine (lundi à dimanche) et l'indice d'aujourd'hui. */
export function useCercles(): { semaine: Cercle[][]; auj: number; sante: boolean } {
  const plan = usePlan();
  const e = useProfil(useShallow((s) => ({ logs: s.logs, nights: s.nights, hrvChecks: s.hrvChecks, weight: s.weight, dur: s.dur })));
  const act = useActivite();
  return useMemo(() => {
    const jours = joursSemaine();
    const ses = plan.sessions;
    const objKcal = ses.length ? ses.reduce((a, s) => a + sesKcal(s, e.weight), 0) / ses.length : 300;
    const donnees = { logs: e.logs, nights: e.nights, hrvChecks: e.hrvChecks, objKcal, objMin: e.dur };
    const valide = act.jours && act.lundi === dayKey(jours[0]);
    const semaine = jours.map((j, i) => cerclesJour(j, donnees, valide ? act.jours![i] : null));
    return { semaine, auj: (new Date().getDay() + 6) % 7, sante: !!valide };
  }, [plan, e, act]);
}
