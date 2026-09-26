/**
 * Notifications : réglages, rappels en attente, et les notifications dues à un instant donné.
 * Portage fidèle du prototype (`S.nset`, `schedulePost`, `notifTick`, `notify`).
 */
import { dec } from './charges';
import type { Premium } from './premium';
import { dayKey } from './xp';
import { baseHrv, conseilNuit, hm, lastNight, sleepScore, type MesureVFC, type Nuit } from './sommeil';

export type ReglagesNotifs = {
  /** VFC post-entraînement */
  post: boolean;
  /** Délai après la séance, en minutes (0,1 = 6 s pour tester). */
  delay: number;
  /** Bilan de la nuit à l'heure du réveil. */
  sleep: boolean;
  wake: string;
  /** Rappel du coucher. */
  bed: boolean;
  bedT: string;
};

export const REGLAGES_DEFAUT: ReglagesNotifs = { post: true, delay: 10, sleep: true, wake: '07:30', bed: true, bedT: '22:30' };

/** Délais proposés (select du prototype). */
export const DELAIS: readonly (readonly [number, string])[] = [
  [0.1, '6 s (test)'],
  [5, '5 min'],
  [10, '10 min'],
  [30, '30 min'],
  [60, '1 h'],
];

/** Où mène la notification : mesure VFC, sommeil, saisie de la nuit, liste. */
export type ActionNotif = 'hrv' | 'sleep' | 'sleepadd' | 'notifs';

export type Notif = {
  id: string;
  d: string;
  read: boolean;
  type: 'post' | 'sleep' | 'bed' | 'trial';
  icon: 'wave' | 'moon' | 'star';
  col: string;
  act: ActionNotif;
  title: string;
  body: string;
};

export type NouvelleNotif = Omit<Notif, 'id' | 'd' | 'read'>;

/** Rappel en attente (S.pending) : VFC post-entraînement, ou veille de la fin de l'essai NÉA Plus. */
export type EnAttente = { at: number; type: 'post'; kind: 'muscu' | 'velo'; endHrv: number | null } | { at: number; type: 'trial' };

/** Couleurs des pastilles (.nic) reprises du prototype. */
export const COULEURS_NOTIF = { post: '#ff4fa3', sleep: '#6b7cff', bed: '#8a5cff', trial: '#ffb000' } as const;

/** « Ton essai se termine demain » (obligatoire), envoyé seulement si le renouvellement est actif. */
export function notifEssai(p: Premium | null): NouvelleNotif | null {
  if (!p || p.plan === 'vie' || !p.renew) return null;
  return {
    type: 'trial',
    icon: 'star',
    col: COULEURS_NOTIF.trial,
    act: 'notifs',
    title: 'Ton essai se termine demain',
    body: `Ton abonnement NÉA Plus annuel (${p.promo ? '39,99 $' : '59,99 $'}) démarre demain. Tu peux l'annuler dans le Profil, sans frais, jusqu'à demain.`,
  };
}

/** Rappel VFC à programmer après une séance ou une sortie (schedulePost), ou rien si désactivé. */
export function rappelPost(n: ReglagesNotifs, kind: 'muscu' | 'velo', endHrv: number | null, now = Date.now()): EnAttente | null {
  return n.post ? { at: now + n.delay * 60000, type: 'post', kind, endHrv } : null;
}

/** Notification « VFC post-entraînement ». */
export function notifPost(p: Extract<EnAttente, { type: 'post' }>, n: ReglagesNotifs, base: number): NouvelleNotif {
  const d = p.endHrv ? Math.round(((p.endHrv - base) / base) * 100) : null;
  return {
    type: 'post',
    icon: 'wave',
    col: COULEURS_NOTIF.post,
    act: 'hrv',
    title: 'VFC post-entraînement',
    body: `${p.kind === 'velo' ? 'Sortie vélo' : 'Séance'} terminée il y a ${n.delay} min.${p.endHrv ? ` VFC de fin : ${p.endHrv} ms (${d! >= 0 ? '+' : ''}${d} % vs ta moyenne).` : ''} Mesure ta récupération en 1 minute.`,
  };
}

/** Bilan de la nuit (avec une nuit notée) ou invitation à la noter. */
export function notifNuit(nuit: Nuit | null, sc: number | null): NouvelleNotif {
  return nuit && sc != null
    ? {
        type: 'sleep',
        icon: 'moon',
        col: COULEURS_NOTIF.sleep,
        act: 'sleep',
        title: 'Bilan de ta nuit',
        body: `${dec(nuit.h)} h de sommeil${nuit.hrv ? `, VFC nocturne ${nuit.hrv} ms` : ''}. Score de récupération ${sc}/100 : ${conseilNuit(sc).toLowerCase()}.`,
      }
    : {
        type: 'sleep',
        icon: 'moon',
        col: COULEURS_NOTIF.sleep,
        act: 'sleepadd',
        title: 'Comment as-tu dormi ?',
        body: 'Note ta nuit et ta VFC nocturne pour que ton coach adapte ta séance du jour.',
      };
}

/** Rappel du coucher : durée de sommeil jusqu'au réveil. */
export function notifCoucher(n: ReglagesNotifs): NouvelleNotif {
  const mins = (hm(n.wake) + 1440 - hm(n.bedT)) % 1440;
  return {
    type: 'bed',
    icon: 'moon',
    col: COULEURS_NOTIF.bed,
    act: 'sleep',
    title: "C'est l'heure de te coucher",
    body: `Au lit maintenant, tu dormiras ${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')} avant ton réveil de ${n.wake.replace(':', ' h ')}. Écrans off, ta VFC te remerciera.`,
  };
}

export type EtatNotifs = {
  nset: ReglagesNotifs;
  pending: EnAttente[];
  lastWake: string | null;
  lastBed: string | null;
  nights: readonly Nuit[];
  hrvChecks: readonly MesureVFC[];
  premium?: Premium | null;
};

/**
 * Notifications dues maintenant (notifTick) : rappels VFC arrivés à échéance, bilan de nuit dans les 4 h après le réveil,
 * rappel du coucher dans les 2 h après l'heure choisie, une fois par jour chacun.
 */
export function notifsDues(e: EtatNotifs, now: Date = new Date()) {
  const t = +now;
  const out: NouvelleNotif[] = [];
  const base = baseHrv(e.nights, e.hrvChecks);
  const dues = e.pending.filter((p) => p.at <= t);
  dues.forEach((p) => {
    if (p.type === 'trial') {
      const t = notifEssai(e.premium ?? null);
      if (t) out.push(t);
    } else out.push(notifPost(p, e.nset, base));
  });
  const pending = e.pending.filter((p) => p.at > t);
  const today = dayKey(now);
  const m = now.getHours() * 60 + now.getMinutes();
  let { lastWake, lastBed } = e;
  if (e.nset.sleep && lastWake !== today && m >= hm(e.nset.wake) && m < hm(e.nset.wake) + 240) {
    lastWake = today;
    const n = lastNight(e.nights, now);
    out.push(notifNuit(n, sleepScore(n, base)));
  }
  if (e.nset.bed && lastBed !== today && m >= hm(e.nset.bedT) && m < hm(e.nset.bedT) + 120) {
    lastBed = today;
    out.push(notifCoucher(e.nset));
  }
  return { notifs: out, pending, lastWake, lastBed };
}
