/**
 * Sport en direct (hors cahier des charges, demandé par l'utilisateur, oct. 2026) : chrono, FC de l'Apple Watch (sinon estimée)
 * et notification « Tennis en cours » (posée au départ, rappels tant que NÉA est en arrière-plan, bilan à la fin).
 * Non sauvegardé ; à la fin, l'activité passe par `enregistrerSport` (journal, XP, Apple Santé) avec la FC moyenne et max.
 */
import * as Notifications from 'expo-notifications';
import { AppState, type NativeEventSubscription } from 'react-native';
import { create } from 'zustand';

import { coeur, hrStats, type SourceFC } from '@/lib/coeur';
import { INTENSITES, kcalSport, sportParId, type Intensite } from '@/lib/sports';

import { enregistrerSport, type ResultatActivite } from './activites';
import { arreterMontre, suivreMontre } from './montre';
import { useProfil } from './profil';

type SportLive = {
  run: boolean;
  sport: string | null;
  intensite: Intensite;
  paused: boolean;
  el: number;
  debut: number;
  hr: number[];
  rrs: number[];
  bpm: number;
  zone: 1 | 2 | 3 | 4 | 5;
  src: SourceFC;
};

type Actions = {
  demarrer: (id: string, intensite: Intensite) => void;
  pause: () => void;
  changerIntensite: (i: Intensite) => void;
  /** Termine : enregistre si au moins 1 min, sinon abandonne. */
  terminer: () => (ResultatActivite & { min: number; avg: number; max: number }) | null;
  abandonner: () => void;
};

const ID_NOTIF = 'nea.sport';
const RAPPELS = [10, 20, 30, 45, 60, 90, 120];
let horloge: ReturnType<typeof setInterval> | null = null;
let ecoute: NativeEventSubscription | null = null;

const age = () => useProfil.getState().age;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

async function notifier(titre: string, corps: string, identifier = ID_NOTIF, secondes?: number) {
  try {
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: { title: titre, body: corps, data: { act: 'sport' } },
      trigger: secondes ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secondes } : null,
    });
  } catch {
    // Notifications refusées : le suivi continue dans l'app.
  }
}

async function annulerRappels() {
  try {
    await Promise.all(RAPPELS.map((m) => Notifications.cancelScheduledNotificationAsync(`${ID_NOTIF}.${m}`)));
  } catch {
    // rien à annuler
  }
}

/** En arrière-plan, le JS s'arrête : on pose d'avance des rappels « Tennis en cours depuis 20 min ». */
function programmerRappels() {
  const s = useSportLive.getState();
  const sp = sportParId(s.sport ?? undefined);
  if (!s.run || !sp) return;
  const deja = Math.floor((Date.now() - s.debut) / 60000);
  for (const m of RAPPELS) {
    if (m <= deja) continue;
    void notifier(`${sp.nom} en cours · ${m} min`, 'NÉA suit ton cœur. Touche pour voir ton BPM ou terminer.', `${ID_NOTIF}.${m}`, (m - deja) * 60);
  }
}

export const useSportLive = create<SportLive & Actions>()((set, get) => {
  const tick = () => {
    const v = get();
    const hr = coeur(age());
    const sp = sportParId(v.sport ?? undefined);
    if (v.run && !v.paused && sp) {
      // Intensité du cœur simulé : MET du sport × intensité ressentie (la FC de la montre prend le dessus si elle existe).
      hr.intensity = Math.min(0.92, Math.max(0.25, (sp.met / 11) * INTENSITES[v.intensite].facteur));
      hr.tick();
      const rrs = [...v.rrs, ...hr.rr.slice(-Math.max(1, Math.round(hr.bpm / 60)))].slice(-3600);
      set({ el: Math.round((Date.now() - v.debut) / 1000), hr: [...v.hr, hr.bpm], rrs, bpm: hr.bpm, zone: hr.zone(), src: hr.src });
    } else {
      hr.intensity = 0.05;
      hr.tick();
      set({ bpm: hr.bpm, zone: hr.zone(), src: hr.src });
    }
  };
  const arreter = () => {
    if (horloge) clearInterval(horloge);
    horloge = null;
    ecoute?.remove();
    ecoute = null;
    arreterMontre();
    void annulerRappels();
    void Notifications.dismissNotificationAsync(ID_NOTIF).catch(() => {});
  };

  return {
    run: false,
    sport: null,
    intensite: 'moderee',
    paused: false,
    el: 0,
    debut: 0,
    hr: [],
    rrs: [],
    bpm: 0,
    zone: 1,
    src: 'sim',
    demarrer: (id, intensite) => {
      const sp = sportParId(id);
      if (!sp || get().run) return;
      set({ run: true, sport: id, intensite, paused: false, el: 0, debut: Date.now(), hr: [], rrs: [] });
      horloge = setInterval(tick, 1000);
      suivreMontre();
      void notifier(`${sp.nom} en cours`, 'NÉA capte ton BPM. Touche pour suivre ta séance.');
      ecoute = AppState.addEventListener('change', (etat) => {
        if (etat === 'background') programmerRappels();
        else if (etat === 'active') void annulerRappels();
      });
    },
    // Pause simple : le chrono suit l'heure de départ, on décale le départ de la durée de la pause.
    pause: () => {
      const v = get();
      if (!v.paused) set({ paused: true });
      else set({ paused: false, debut: Date.now() - v.el * 1000 });
    },
    changerIntensite: (i) => set({ intensite: i }),
    terminer: () => {
      const v = get();
      const sp = sportParId(v.sport ?? undefined);
      arreter();
      set({ run: false });
      const min = Math.round(v.el / 60);
      if (!sp || min < 1) return null;
      const st = hrStats(v.hr, v.rrs, age());
      const r = enregistrerSport(sp.id, min, v.intensite, false, { hrAvg: st.avg, hrMax: st.max, hrv: st.hrv });
      if (!r) return null;
      void notifier(`${sp.nom} terminé · ${mmss(v.el)}`, `${st.avg} BPM en moyenne · ${r.cal} kcal · +${r.xp} XP`, `${ID_NOTIF}.fin`);
      return { ...r, min, avg: st.avg, max: st.max };
    },
    abandonner: () => {
      arreter();
      set({ run: false, sport: null });
    },
  };
});

/** Calories estimées en direct. */
export const kcalEnDirect = (id: string | null, el: number, i: Intensite) => {
  const sp = sportParId(id ?? undefined);
  return sp ? kcalSport(sp.met, useProfil.getState().weight, el / 60, i) : 0;
};
