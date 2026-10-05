/**
 * Moments NÉA sur l'écran verrouillé (Activités en direct, maquettes de l'utilisateur, build 26+) :
 * « L'heure de ralentir » (heure avant le coucher), « Ta séance approche » (15 min avant 18 h un jour de séance),
 * « Une pause pour toi » (respiration d'1 min, écran /respirer), « Objectif atteint ! » (pas du jour, 1 fois par jour, 1 h).
 * iOS ne lance une Activité en direct que NÉA ouvert : les notifications posées d'avance (store/notifs) invitent à l'ouvrir.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { OBJECTIF_PAS } from '@/lib/notifs';
import { buildPlan, todayIdx } from '@/lib/plan';
import { pasDuJour } from '@/lib/sante';
import { sessionForDay } from '@/lib/semaine';
import { hm } from '@/lib/sommeil';
import { dayKey } from '@/lib/xp';

import { NeaMontre } from '../../modules/nea-montre/src';
import { selectProfil, useProfil } from './profil';

export const MIN_RALENTIR = 30;
const HEURE_SEANCE = 18 * 60;

type Moment = {
  type: 'coucher' | 'seance' | 'pause' | 'pas';
  titre: string;
  sous: string;
  symbole: string;
  image: string;
  finMs?: number;
  valeur?: string;
  finTexte?: string;
  visibleMin?: number;
};

function poser(m: Moment) {
  try {
    NeaMontre?.demarrerMoment?.(JSON.stringify(m));
  } catch {
    // build sans Activité en direct
  }
}

export function retirer(type: Moment['type'] | '') {
  try {
    NeaMontre?.finMoment?.(type);
  } catch {
    // build sans Activité en direct
  }
}

/** Écart (min) entre maintenant et l'heure `h` (minutes depuis minuit), ramené entre −12 h et +12 h. */
function ecartMin(h: number, now: Date) {
  let e = h - (now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60);
  if (e > 720) e -= 1440;
  if (e <= -720) e += 1440;
  return e;
}

function verifierCoucher(now: Date) {
  const st = useProfil.getState();
  const e = ecartMin(hm(st.nset.bedT), now);
  if (st.nset.bed && e > 0 && e <= 60) {
    poser({
      type: 'coucher',
      titre: "L'heure de ralentir",
      sous: 'Avant ton coucher.',
      finTexte: "C'est l'heure de dormir.",
      symbole: 'moon.fill',
      image: 'axel_dodo',
      finMs: Math.round(+now + e * 60e3),
    });
    return true;
  }
  if (!st.nset.bed || e <= -30 || e > 60) retirer('coucher');
  return false;
}

function verifierSeance(now: Date) {
  const st = useProfil.getState();
  const e = ecartMin(HEURE_SEANCE, now);
  const faite = st.logs.some((l) => (l.type === 'muscu' || l.type === 'sport') && new Date(l.d).toDateString() === now.toDateString());
  if (st.nset.seance !== false && !faite && e > 0 && e <= 15) {
    const s = sessionForDay({ plan: buildPlan(selectProfil(st)), weight: st.weight, added: st.added, wkMod: st.wkMod }, todayIdx());
    if (s && !s.ride && s.items.length) {
      poser({
        type: 'seance',
        titre: 'Ta séance approche',
        sous: `${s.titre} · ${Math.round(s.min)} min.`,
        finTexte: "C'est parti !",
        symbole: 'dumbbell.fill',
        image: 'axel_seance',
        finMs: Math.round(+now + e * 60e3),
      });
      return true;
    }
  }
  if (faite || e <= -20 || e > 15) retirer('seance');
  return false;
}

const CLE_PAS = 'nea-moment-pas';
const milliers = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Objectif de pas atteint (Apple Santé) : une fois par jour, affiché 1 h. */
async function verifierPas(now: Date) {
  const jour = dayKey(now);
  if ((await AsyncStorage.getItem(CLE_PAS).catch(() => null)) === jour) return;
  const pas = await pasDuJour(now);
  if (pas == null || pas < OBJECTIF_PAS) return;
  await AsyncStorage.setItem(CLE_PAS, jour).catch(() => {});
  poser({ type: 'pas', titre: 'Objectif atteint !', valeur: `${milliers(pas)} pas`, sous: 'Chaque pas compte.', symbole: 'target', image: 'axel_pas', visibleMin: 60 });
}

/** À l'ouverture, au retour dans l'app et chaque minute : pose ou retire les moments du soir et de la séance, fête les pas. */
export function verifierMoments(now: Date = new Date()) {
  if (!NeaMontre?.demarrerMoment || !useProfil.getState().onboarded) return;
  // Un moment à la fois : le coucher passe avant la séance.
  if (!verifierCoucher(now)) verifierSeance(now);
  void verifierPas(now);
}

/** « Une pause pour toi » : compte à rebours de la respiration guidée (écran /respirer). */
export function momentPause(secondes: number) {
  poser({
    type: 'pause',
    titre: 'Une pause pour toi',
    sous: 'Respire avec Axel.',
    finTexte: 'Bien joué.',
    symbole: 'leaf.fill',
    image: 'axel_pause',
    finMs: Date.now() + secondes * 1000,
  });
}
