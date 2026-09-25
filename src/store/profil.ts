/**
 * État de l'utilisateur, sauvegardé sur l'appareil.
 * Reprend les champs de l'état `S` du prototype (`DEF`) utiles à l'onboarding et au programme.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import type { CoachId, GoalId } from '@/data/types';
import { buildPlan, type Duree, type Jours, type Plan, type Profil } from '@/lib/plan';

/** Questionnaire santé : 5 cases (0/1) + les deux confirmations. */
export type Sante = {
  flags: (0 | 1)[];
  /** « NÉA ne remplace pas un avis médical… » (toujours obligatoire). */
  ack?: boolean;
  /** « J'ai consulté, ou je choisis de commencer doucement… » (obligatoire si une case est cochée). */
  ack2?: boolean;
  /** Date de la dernière réponse (ISO). */
  d?: string;
};

export type PeseeJour = { d: string; kg: number };

type Etat = Profil & {
  onboarded: boolean;
  name: string;
  health: Sante | null;
  /** Historique du poids, une valeur par jour. */
  wlog: PeseeJour[];
  /** Le coach recommandé a déjà été appliqué à l'écran « Choisis ton coach » (non sauvegardé). */
  obCoachSet: boolean;
};

type Actions = {
  set: (p: Partial<Etat>) => void;
  toggleGoal: (g: GoalId) => void;
  /** Choix d'un coach par son avatar : redémarre le programme. */
  pickCoach: (c: CoachId) => void;
  /** Coach suivant / précédent (flèches). */
  stepCoach: (delta: 1 | -1, ordre: readonly CoachId[]) => void;
  toggleHealthFlag: (i: number) => void;
  toggleHealthAck: (k: 'ack' | 'ack2') => void;
  logWeight: (kg: number) => void;
  reset: () => void;
};

const defauts = (): Etat => ({
  onboarded: false,
  coach: 'axel',
  goals: [],
  level: 'deb',
  gear: 'maison',
  days: 4 as Jours,
  dur: 45 as Duree,
  name: '',
  weight: 74,
  age: 28,
  progs: {},
  progStart: new Date().toISOString(),
  health: null,
  wlog: [],
  obCoachSet: false,
});

const santeVide = (): Sante => ({ flags: [0, 0, 0, 0, 0] });

export const useProfil = create<Etat & Actions>()(
  persist(
    (set, get) => ({
      ...defauts(),
      set: (p) => set(p),
      toggleGoal: (g) => {
        const goals = get().goals;
        set({ goals: goals.includes(g) ? goals.filter((x) => x !== g) : [...goals, g], obCoachSet: false });
      },
      pickCoach: (c) => set({ coach: c, progStart: new Date().toISOString() }),
      stepCoach: (delta, ordre) => {
        const i = ordre.indexOf(get().coach);
        set({ coach: ordre[(i + delta + ordre.length) % ordre.length] });
      },
      toggleHealthFlag: (i) => {
        const h = get().health ?? santeVide();
        const flags = [...h.flags];
        flags[i] = flags[i] ? 0 : 1;
        set({ health: { ...h, flags } });
      },
      toggleHealthAck: (k) => {
        const h = get().health ?? santeVide();
        set({ health: { ...h, [k]: !h[k], d: new Date().toISOString() } });
      },
      logWeight: (kg) => {
        const jour = new Date().toISOString().slice(0, 10);
        set({ wlog: [...get().wlog.filter((x) => x.d !== jour), { d: jour, kg }], weight: kg });
      },
      reset: () => set(defauts()),
    }),
    {
      name: 'nea2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): Omit<Etat, 'obCoachSet'> => ({
        ...selectProfil(s),
        onboarded: s.onboarded,
        name: s.name,
        health: s.health,
        wlog: s.wlog,
      }),
    },
  ),
);

/** Profil courant pour le générateur de programme. */
export const selectProfil = (s: Etat): Profil => ({
  coach: s.coach,
  goals: s.goals,
  level: s.level,
  gear: s.gear,
  days: s.days,
  dur: s.dur,
  weight: s.weight,
  age: s.age,
  progs: s.progs,
  progStart: s.progStart,
});

/** Au moins une case du questionnaire santé est cochée. */
export const healthFlagged = (h: Sante | null) => !!h && h.flags.some(Boolean);

/** Programme de la semaine, recalculé quand le profil change (`replan()` du prototype). */
export function usePlan(): Plan {
  const p = useProfil(useShallow(selectProfil));
  return useMemo(() => buildPlan(p), [p]);
}
