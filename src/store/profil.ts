/**
 * État de l'utilisateur, sauvegardé sur l'appareil.
 * Reprend les champs de l'état `S` du prototype (`DEF`) utiles à l'onboarding et au programme.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import type { CoachId, GoalId, ProgrammeId, SeanceId } from '@/data/types';
import { buildPlan, type Duree, type Jours, type Plan, type Profil } from '@/lib/plan';
import { addedKey, type Intensite, type Semaine } from '@/lib/semaine';
import type { Log } from '@/lib/xp';

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
  /** Séances et sorties terminées (remplies à l'étape 4). */
  logs: Log[];
  xp: number;
  /** Fin du Turbo x2 (horodatage). */
  boostUntil: number;
  /** Séances du catalogue ajoutées au calendrier, par `addedKey`. */
  added: Partial<Record<string, SeanceId>>;
  /** Intensité choisie par séance du catalogue. */
  wkMod: Partial<Record<SeanceId, Intensite>>;
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
  /** Planifie une séance du catalogue le jour i de la semaine en cours. */
  planifier: (i: number, id: SeanceId) => void;
  retirer: (i: number) => void;
  setIntensite: (id: SeanceId, v: Intensite) => void;
  /** Suit un autre programme du coach : il repart de la semaine 1. */
  suivre: (id: ProgrammeId) => void;
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
  logs: [],
  xp: 0,
  boostUntil: 0,
  added: {},
  wkMod: {},
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
      planifier: (i, id) => set({ added: { ...get().added, [addedKey(i)]: id } }),
      retirer: (i) => {
        const added = { ...get().added };
        delete added[addedKey(i)];
        set({ added });
      },
      setIntensite: (id, v) => set({ wkMod: { ...get().wkMod, [id]: v } }),
      suivre: (id) => set({ progs: { ...get().progs, [get().coach]: id }, progStart: new Date().toISOString() }),
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
        logs: s.logs,
        xp: s.xp,
        boostUntil: s.boostUntil,
        added: s.added,
        wkMod: s.wkMod,
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

/** Semaine courante : plan + séances ajoutées + intensités. */
export function useSemaine(): Semaine {
  const plan = usePlan();
  const { weight, added, wkMod } = useProfil(useShallow((s) => ({ weight: s.weight, added: s.added, wkMod: s.wkMod })));
  return useMemo(() => ({ plan, weight, added, wkMod }), [plan, weight, added, wkMod]);
}
