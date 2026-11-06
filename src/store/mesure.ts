/**
 * Mesure de récupération d'1 minute (objet `M` et `mTick` du prototype), non sauvegardée.
 * FC simulée en attendant Apple Santé ou une ceinture cardio.
 */
import { create } from 'zustand';

import { coeur, hrStats } from '@/lib/coeur';
import { baseHrv, recovStatus, type EtatRecup } from '@/lib/sommeil';

import { useProfil } from './profil';

export type ResultatMesure = { hrv: number; bpm: number; st: EtatRecup; diff: number; base: number };

type Mesure = {
  run: boolean;
  left: number;
  hr: number[];
  rr: number[];
  res: ResultatMesure | null;
  /** Valeurs en direct (livePills). */
  bpm: number;
  zone: number;
  hrv: number;
};

type Actions = {
  lancer: () => void;
  /** Annuler, ou revenir à l'écran de départ (data-mreset). */
  remettre: () => void;
  /** Une seconde : FC au calme, compte à rebours, résultat à 0. */
  tick: () => void;
};

const age = () => useProfil.getState().age;

const repos = (): Mesure => {
  const hr = coeur(age());
  return { run: false, left: 60, hr: [], rr: [], res: null, bpm: hr.bpm, zone: hr.zone(), hrv: hr.rmssd() };
};

export const useMesure = create<Mesure & Actions>()((set, get) => ({
  ...repos(),
  lancer: () => set({ run: true, left: 60, hr: [], rr: [], res: null }),
  remettre: () => set(repos()),
  tick: () => {
    const m = get();
    const hr = coeur(age());
    // Au calme pendant la mesure, repos ordinaire sinon.
    hr.intensity = m.run ? 0.01 : 0.05;
    hr.tick();
    const live = { bpm: hr.bpm, zone: hr.zone(), hrv: hr.rmssd() };
    if (!m.run) {
      set(live);
      return;
    }
    // Même correction que la séance : les battements ajoutés par tick() sont les derniers de rr
    // (rr.slice(longueur avant) du prototype ne renvoie plus rien une fois la mémoire de 300 RR pleine).
    const rr = [...m.rr, ...hr.rr.slice(-Math.max(1, Math.round(hr.bpm / 60)))];
    const hrs = [...m.hr, hr.bpm];
    const left = m.left - 1;
    if (left > 0) {
      set({ ...live, rr, hr: hrs, left });
      return;
    }
    const p = useProfil.getState();
    const st = hrStats(hrs, rr, p.age);
    const b = baseHrv(p.nights, p.hrvChecks);
    const res: ResultatMesure = { hrv: st.hrv, bpm: st.avg, st: recovStatus(st.hrv, b), diff: Math.round(((st.hrv - b) / b) * 100), base: b };
    set({ ...live, rr, hr: hrs, left: 0, run: false, res });
    p.noterMesure({ d: new Date().toISOString(), hrv: st.hrv, bpm: st.avg, kind: new Date().getHours() < 11 ? 'matin' : 'post' });
  },
}));
