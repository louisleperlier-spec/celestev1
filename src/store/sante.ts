/**
 * Import automatique de la nuit de l'Apple Watch, à l'ouverture de l'app et à chaque retour au premier plan.
 * Une nuit notée à la main n'est jamais remplacée ; une nuit importée l'est si Apple Santé en a une plus longue
 * (app ouverte au milieu de la nuit). La qualité, que la montre ne donne pas, vaut 4 (🙂, comme la feuille « Ta nuit »).
 */
import { AppState } from 'react-native';

import { nuitSante, santeDisponible } from '@/lib/sante';
import { ajouterNuit, heure, nouvelleNuit } from '@/lib/sommeil';

import { useProfil } from './profil';

async function importerNuit(now: Date = new Date()) {
  if (!useProfil.getState().onboarded) return;
  const s = await nuitSante(now);
  // Réveil depuis au moins 30 min : la nuit est finie.
  if (!s || +now - +s.fin < 30 * 60000) return;
  const n = { ...nouvelleNuit(heure(s.coucher), heure(s.reveil), 4, s.hrv ?? 0, s.rhr ?? 0, s.fin), src: 'sante' as const };
  const st = useProfil.getState();
  const avant = st.nights.find((x) => x.d === n.d);
  if (!avant) st.noterNuit(n);
  else if (avant.src === 'sante' && n.h > avant.h) st.set({ nights: ajouterNuit(st.nights, n) });
}

let demarre = false;
/** À appeler une fois au démarrage. */
export function demarrerSante() {
  if (demarre || !santeDisponible()) return;
  demarre = true;
  importerNuit();
  AppState.addEventListener('change', (a) => {
    if (a === 'active') importerNuit();
  });
}
