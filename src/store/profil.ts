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
import { buildPlan, coachValide, type Duree, type Jours, type Plan, type Profil } from '@/lib/plan';
import { addedKey, type Intensite, type Semaine } from '@/lib/semaine';
import { ACCUEIL_DEFAUT, type CarteAccueil } from '@/lib/accueil';
import { JEU_DEFAUT, type EtatJeu } from '@/lib/jeu';
import { toast } from '@/components/ui/Toast';
import { autresActifs } from './ligue';
import { QUESTS } from '@/data/ligue';

import { actifsEquipe } from '@/lib/ligue';
import type { MessageChat, QuotaChat } from '@/lib/coach';
import { basculerRenouvellement, brancherPremium, nouvelAbonnement, type OffreId, type Premium } from '@/lib/premium';
import { journeeDu, VERRES_EAU, type Journee } from '@/lib/journee';
import { coucherPour, OBJECTIF_SOMMEIL, REVEIL_DEFAUT, type NoteSoir, type Reveil } from '@/lib/reveil';
import { ALERTES_DEFAUT, notifsDues, rappelPost, REGLAGES_DEFAUT, type AlertesSante, type EnAttente, type Notif, type NouvelleNotif, type ReglagesNotifs } from '@/lib/notifs';
import { ajouterNuit, type MesureVFC, type Nuit } from '@/lib/sommeil';
import { serie } from '@/lib/gel';
import { boosts, gainXp, lvlInfo, todayQuests, type Log, type QuestId, type QuetesDuJour } from '@/lib/xp';

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
  /** Séances du plan faites à la maison, par `addedKey` (valable pour la semaine). */
  maison: Partial<Record<string, boolean>>;
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
  /** Cartes de l'Accueil : ordre et visibilité (« Mon écran d'accueil »). */
  accueil: CarteAccueil[];
  /** Alertes santé de l'iPhone (VFC, eau, vélo, pas), envoyées au module natif (store/alertes.ts). */
  alertesSante: AlertesSante;
  /** Jour du dernier bilan de nuit et du dernier rappel du coucher. */
  lastWake: string | null;
  lastBed: string | null;
  /** Conversation avec le coach IA (S.chat), coach de cette conversation, messages envoyés aujourd'hui (S.chatQ). */
  chat: MessageChat[];
  chatCoach: CoachId | null;
  chatQ: QuotaChat | null;
  /** Abonnement NÉA Plus (S.premium). */
  premium: Premium | null;
  /** Cartes récompense, records et défis de la semaine (`lib/jeu.ts`, hors prototype). */
  jeu: EtatJeu;
  /** « Ta journée » : verres d'eau et pause respiration du jour (cochés à la main). */
  journee: Journee | null;
  /** Partie Sommeil (maquettes, oct. 2026) : réveil de l'iPhone, objectif de sommeil (h), notes du soir, début de la nuit en cours. */
  reveil: Reveil;
  objectifSommeil: number;
  notesSoir: NoteSoir[];
  nuitDebut: number | null;
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
  /** Séance du jour i à la maison (true) ou au lieu habituel (false), pour cette semaine. */
  aLaMaison: (i: number, oui: boolean) => void;
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
  /** « Ta journée » : un verre d'eau de plus, pause respiration faite / défaite, fête de la journée parfaite. */
  ajouterVerre: () => void;
  basculerCalme: () => void;
  marquerJourneeFetee: () => void;
  /** Réveil (heure, jours, son, vibration) : met aussi à jour le réveil et le coucher des notifications (coucher = réveil − objectif). */
  reglerReveil: (r: Reveil, objectif?: number) => void;
  ajouterNoteSoir: (n: NoteSoir) => void;
  commencerNuit: () => void;
  terminerNuit: () => void;
  /** Enregistre une nuit (+10 XP « Sommeil »). */
  noterNuit: (n: Nuit) => void;
  /** Enregistre une mesure de récupération (+10 XP « Mesure VFC »). */
  noterMesure: (m: MesureVFC) => void;
  /** Nouveaux réglages : le bilan et le coucher peuvent revenir aujourd'hui. */
  reglerNotifs: (n: ReglagesNotifs) => void;
  /** Rappel VFC après une séance ou une sortie (schedulePost). */
  programmerPost: (kind: 'muscu' | 'velo' | 'course' | 'rando', endHrv: number | null) => void;
  /** Achat NÉA Plus (buySheet) : abonnement, rappel de fin d'essai au jour 2, +50 XP. */
  acheterPlus: (id: OffreId) => void;
  /** Après un vrai achat App Store (l'abonnement vient de RevenueCat) : +50 XP et rappel de fin d'essai. */
  recompenserAchat: () => void;
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
  maison: {},
  nights: [],
  hrvChecks: [],
  nset: REGLAGES_DEFAUT,
  pending: [],
  notifs: [],
  lastWake: null,
  lastBed: null,
  accueil: [...ACCUEIL_DEFAUT],
  alertesSante: { ...ALERTES_DEFAUT },
  chat: [],
  chatCoach: null,
  chatQ: null,
  premium: null,
  jeu: JEU_DEFAUT,
  journee: null,
  reveil: REVEIL_DEFAUT,
  objectifSommeil: OBJECTIF_SOMMEIL,
  notesSoir: [],
  nuitDebut: null,
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
      aLaMaison: (i, oui) => {
        const maison = { ...get().maison };
        if (oui) maison[addedKey(i)] = true;
        else delete maison[addedKey(i)];
        set({ maison });
      },
      setIntensite: (id, v) => set({ wkMod: { ...get().wkMod, [id]: v } }),
      suivre: (id) => set({ progs: { ...get().progs, [get().coach]: id }, progStart: new Date().toISOString() }),
      addXp: (base, label) => {
        const st = get();
        const before = lvlInfo(st.xp).n;
        const g = gainXp(base, boosts(serie(st), st.boostUntil, actifsEquipe(autresActifs(), st.logs)));
        const xpLog = [...st.xpLog, { d: new Date().toISOString(), xp: g, l: label }].slice(-400);
        const after = lvlInfo(st.xp + g).n;
        set({ xp: st.xp + g, xpLog, tokens: st.tokens + Math.max(0, after - before) });
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
      ajouterVerre: () => {
        const j = journeeDu(get().journee);
        set({ journee: { ...j, eau: Math.min(VERRES_EAU, j.eau + 1) } });
      },
      basculerCalme: () => {
        const j = journeeDu(get().journee);
        set({ journee: { ...j, calme: !j.calme } });
      },
      marquerJourneeFetee: () => set({ journee: { ...journeeDu(get().journee), fete: true } }),
      reglerReveil: (r, objectif = get().objectifSommeil) =>
        set({ reveil: r, objectifSommeil: objectif, nset: { ...get().nset, wake: r.h, bedT: coucherPour(r.h, objectif) } }),
      ajouterNoteSoir: (n) => set({ notesSoir: [n, ...get().notesSoir.filter((x) => x.d.slice(0, 10) !== n.d.slice(0, 10))].slice(0, 120) }),
      commencerNuit: () => set({ nuitDebut: Date.now() }),
      terminerNuit: () => set({ nuitDebut: null }),
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
      recompenserAchat: () => {
        const p = get().premium;
        if (p?.trialEnd) set({ pending: [...get().pending, { at: p.trialEnd - 864e5, type: 'trial' as const }] });
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
      // État enregistré avant le retrait de Blaze et Rex : coach et programmes suivis remis à un coach existant.
      merge: (sauve, actuel) => ({ ...actuel, ...nettoyer((sauve ?? {}) as Partial<EtatSauvegarde>) }),
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
  maison: s.maison,
  nights: s.nights,
  hrvChecks: s.hrvChecks,
  nset: s.nset,
  pending: s.pending,
  notifs: s.notifs,
  lastWake: s.lastWake,
  lastBed: s.lastBed,
  accueil: s.accueil,
  alertesSante: s.alertesSante,
  chat: s.chat,
  chatCoach: s.chatCoach,
  chatQ: s.chatQ,
  premium: s.premium,
  jeu: s.jeu,
  journee: s.journee,
  reveil: s.reveil,
  objectifSommeil: s.objectifSommeil,
  notesSoir: s.notesSoir,
  nuitDebut: s.nuitDebut,
  exitUntil: s.exitUntil,
  exitDeclined: s.exitDeclined,
});

/** Remplace l'état local par celui du compte (connexion sur un appareil). */
/** Blaze et Rex retirés : leur coach devient Luna / Axel, leurs programmes suivis sont oubliés. */
function nettoyer(e: Partial<EtatSauvegarde>): Partial<EtatSauvegarde> {
  if (!e.coach && !e.progs) return e;
  const progs = Object.fromEntries(Object.entries(e.progs ?? {}).filter(([c]) => coachValide(c) === c)) as EtatSauvegarde['progs'];
  return { ...e, ...(e.coach ? { coach: coachValide(e.coach) } : {}), progs };
}

export const chargerEtat = (e: Partial<EtatSauvegarde>) => useProfil.setState({ ...defauts(), ...nettoyer(e), obCoachSet: true });

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

/** Le plan refait avec le matériel de la maison (pour les séances faites à la maison) ; null si le lieu est déjà la maison. */
export const planMaisonDe = (p: Profil): Plan | null => (p.gear === 'maison' ? null : buildPlan({ ...p, gear: 'maison' }));

/** Semaine courante hors React (notifications, montre, coach…). */
export function semaineDe(st: Etat): Semaine {
  const p = selectProfil(st);
  return { plan: buildPlan(p), planMaison: planMaisonDe(p), weight: st.weight, added: st.added, wkMod: st.wkMod, maison: st.maison };
}

/** Semaine courante : plan + séances ajoutées + intensités + séances à la maison. */
export function useSemaine(): Semaine {
  const plan = usePlan();
  const p = useProfil(useShallow(selectProfil));
  const planMaison = useMemo(() => planMaisonDe(p), [p]);
  const { weight, added, wkMod, maison } = useProfil(useShallow((s) => ({ weight: s.weight, added: s.added, wkMod: s.wkMod, maison: s.maison })));
  return useMemo(() => ({ plan, planMaison, weight, added, wkMod, maison }), [plan, planMaison, weight, added, wkMod, maison]);
}
