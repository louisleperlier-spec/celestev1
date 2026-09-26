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
import { toast } from '@/components/ui/Toast';
import { autresActifs } from './ligue';
import { QUESTS } from '@/data/ligue';

import { actifsEquipe } from '@/lib/ligue';
import type { MessageChat, QuotaChat } from '@/lib/coach';
import { basculerRenouvellement, brancherPremium, nouvelAbonnement, type OffreId, type Premium } from '@/lib/premium';
import { notifsDues, rappelPost, REGLAGES_DEFAUT, type EnAttente, type Notif, type NouvelleNotif, type ReglagesNotifs } from '@/lib/notifs';
import { ajouterNuit, type MesureVFC, type Nuit } from '@/lib/sommeil';
import { boosts, gainXp, lvlInfo, streak, todayQuests, type Log, type QuestId, type QuetesDuJour } from '@/lib/xp';

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
  /** Historique des gains d'XP (400 derniers). */
  xpLog: { d: string; xp: number; l: string }[];
  /** Turbos x2 gagnés (1 par niveau), utilisables avec NÉA Plus. */
  tokens: number;
  quests: QuetesDuJour | null;
  /** Fin du Turbo x2 (horodatage). */
  boostUntil: number;
  /** Séances du catalogue ajoutées au calendrier, par `addedKey`. */
  added: Partial<Record<string, SeanceId>>;
  /** Intensité choisie par séance du catalogue. */
  wkMod: Partial<Record<SeanceId, Intensite>>;
  /** Nuits notées (60 dernières), de la plus ancienne à la plus récente. */
  nights: Nuit[];
  /** Mesures de récupération d'1 minute. */
  hrvChecks: MesureVFC[];
  /** Réglages des notifications (S.nset). */
  nset: ReglagesNotifs;
  /** Rappels VFC post-entraînement à venir. */
  pending: EnAttente[];
  /** Notifications reçues (40 dernières, la plus récente en premier). */
  notifs: Notif[];
  /** Jour du dernier bilan de nuit et du dernier rappel du coucher. */
  lastWake: string | null;
  lastBed: string | null;
  /** Conversation avec le coach IA (S.chat), coach de cette conversation, messages envoyés aujourd'hui (S.chatQ). */
  chat: MessageChat[];
  chatCoach: CoachId | null;
  chatQ: QuotaChat | null;
  /** Abonnement NÉA Plus (S.premium). */
  premium: Premium | null;
  /** Offre de sortie : fin du compte à rebours de 10 min, et refusée (proposée une seule fois). */
  exitUntil: number;
  exitDeclined: boolean;
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
  /** Ajoute de l'XP (× boosts) et renvoie le gain (addXp du prototype). */
  addXp: (base: number, label: string) => number;
  /** Valide une quête du jour si elle en fait partie (quest du prototype). */
  quest: (id: QuestId) => void;
  /** Enregistre une séance ou une sortie terminée (la plus récente en premier). */
  addLog: (l: Log) => void;
  /** Enregistre une nuit (+10 XP « Sommeil »). */
  noterNuit: (n: Nuit) => void;
  /** Enregistre une mesure de récupération (+10 XP « Mesure VFC »). */
  noterMesure: (m: MesureVFC) => void;
  /** Nouveaux réglages : le bilan et le coucher peuvent revenir aujourd'hui. */
  reglerNotifs: (n: ReglagesNotifs) => void;
  /** Rappel VFC après une séance ou une sortie (schedulePost). */
  programmerPost: (kind: 'muscu' | 'velo', endHrv: number | null) => void;
  /** Achat NÉA Plus (buySheet) : abonnement, rappel de fin d'essai au jour 2, +50 XP. */
  acheterPlus: (id: OffreId) => void;
  /** Annuler / réactiver le renouvellement (subSheet). */
  basculerRenouvellement: () => void;
  /** Ajoute les notifications dues et les renvoie (notifTick). */
  tickNotifs: (now?: Date) => Notif[];
  /** Ajoute une notification (notify). */
  notifier: (n: NouvelleNotif) => Notif;
  lireNotifs: () => void;
  lireNotif: (id: string) => void;
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
  xpLog: [],
  tokens: 0,
  quests: null,
  boostUntil: 0,
  added: {},
  wkMod: {},
  nights: [],
  hrvChecks: [],
  nset: REGLAGES_DEFAUT,
  pending: [],
  notifs: [],
  lastWake: null,
  lastBed: null,
  chat: [],
  chatCoach: null,
  chatQ: null,
  premium: null,
  exitUntil: 0,
  exitDeclined: false,
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
      addXp: (base, label) => {
        const st = get();
        const before = lvlInfo(st.xp).n;
        const g = gainXp(base, boosts(streak(st.logs, st.days), st.boostUntil, actifsEquipe(autresActifs(), st.logs)));
        const xpLog = [...st.xpLog, { d: new Date().toISOString(), xp: g, l: label }].slice(-400);
        const after = lvlInfo(st.xp + g).n;
        set({ xp: st.xp + g, xpLog, tokens: st.tokens + Math.max(0, after - before) });
        if (after > before) setTimeout(() => toast('Niveau ' + after + ' ! +1 Turbo x2 gagné'), 400);
        return g;
      },
      quest: (id) => {
        const q = todayQuests(get().quests);
        if (!q.ids.includes(id) || q.done.includes(id)) {
          set({ quests: q });
          return;
        }
        set({ quests: { ...q, done: [...q.done, id] } });
        const g = get().addXp(QUESTS.find((x) => x[0] === id)![2], 'Quête');
        setTimeout(() => toast('Quête réussie : +' + g + ' XP'), 900);
      },
      addLog: (l) => set({ logs: [l, ...get().logs] }),
      noterNuit: (n) => {
        set({ nights: ajouterNuit(get().nights, n) });
        get().addXp(10, 'Sommeil');
      },
      noterMesure: (m) => {
        set({ hrvChecks: [...get().hrvChecks, m] });
        get().addXp(10, 'Mesure VFC');
      },
      acheterPlus: (id) => {
        const now = Date.now();
        const premium = nouvelAbonnement(id, now);
        const pending = premium.plan === 'an' ? [...get().pending, { at: now + 2 * 864e5, type: 'trial' as const }] : get().pending;
        set({ premium, pending });
        get().addXp(50, 'NÉA Plus');
      },
      basculerRenouvellement: () => {
        const p = get().premium;
        if (p) set({ premium: basculerRenouvellement(p) });
      },
      reglerNotifs: (nset) => set({ nset, lastWake: null, lastBed: null }),
      programmerPost: (kind, endHrv) => {
        const p = rappelPost(get().nset, kind, endHrv);
        if (p) set({ pending: [...get().pending, p] });
      },
      tickNotifs: (now = new Date()) => {
        const st = get();
        if (!st.onboarded) return [];
        const r = notifsDues(st, now);
        if (!r.notifs.length && r.pending.length === st.pending.length) return [];
        const neuves = r.notifs.map((n, i): Notif => ({ ...n, id: String(+now) + '-' + i, d: now.toISOString(), read: false }));
        set({ pending: r.pending, lastWake: r.lastWake, lastBed: r.lastBed, notifs: [...neuves.reverse(), ...st.notifs].slice(0, 40) });
        return neuves;
      },
      notifier: (n) => {
        const now = new Date();
        const x: Notif = { ...n, id: String(+now), d: now.toISOString(), read: false };
        set({ notifs: [x, ...get().notifs].slice(0, 40) });
        return x;
      },
      lireNotifs: () => {
        if (get().notifs.some((n) => !n.read)) set({ notifs: get().notifs.map((n) => (n.read ? n : { ...n, read: true })) });
      },
      lireNotif: (id) => set({ notifs: get().notifs.map((n) => (n.id === id ? { ...n, read: true } : n)) }),
      reset: () => set(defauts()),
    }),
    {
      name: 'nea2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): EtatSauvegarde => etatSauvegarde(s),
    },
  ),
);

// isPremium() lit l'abonnement du profil.
brancherPremium(() => useProfil.getState().premium);

/** Ce qui est sauvegardé : sur l'appareil, et sur Supabase quand un compte est connecté. */
export type EtatSauvegarde = Omit<Etat, 'obCoachSet'>;

export const etatSauvegarde = (s: Etat): EtatSauvegarde => ({
  ...selectProfil(s),
  onboarded: s.onboarded,
  name: s.name,
  health: s.health,
  wlog: s.wlog,
  logs: s.logs,
  xp: s.xp,
  xpLog: s.xpLog,
  tokens: s.tokens,
  quests: s.quests,
  boostUntil: s.boostUntil,
  added: s.added,
  wkMod: s.wkMod,
  nights: s.nights,
  hrvChecks: s.hrvChecks,
  nset: s.nset,
  pending: s.pending,
  notifs: s.notifs,
  lastWake: s.lastWake,
  lastBed: s.lastBed,
  chat: s.chat,
  chatCoach: s.chatCoach,
  chatQ: s.chatQ,
  premium: s.premium,
  exitUntil: s.exitUntil,
  exitDeclined: s.exitDeclined,
});

/** Remplace l'état local par celui du compte (connexion sur un appareil). */
export const chargerEtat = (e: Partial<EtatSauvegarde>) => useProfil.setState({ ...defauts(), ...e, obCoachSet: true });

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
