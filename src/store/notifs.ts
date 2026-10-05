/**
 * Notifications à l'exécution : horloge (notifTick), bannière dans l'app (banner), ouverture (openNotif),
 * et notifications du téléphone quand NÉA est fermé (expo-notifications, fonctionne dans Expo Go sur iPhone).
 */
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { AppState, Platform } from 'react-native';
import { create } from 'zustand';

import { bilanCoeur, conseilRythme, texteBilanCoeur } from '@/lib/bilanCoeur';
import { motivationDuJour } from '@/lib/motivation';
import { COULEURS_NOTIF, notifCoucher, notifEssai, notifNuit, notifPost, type ActionNotif, type Notif, type NouvelleNotif } from '@/lib/notifs';
import { buildPlan, todayIdx } from '@/lib/plan';
import { sessionForDay } from '@/lib/semaine';
import { baseHrv, hm, lastNight, sleepScore } from '@/lib/sommeil';
import { dayKey } from '@/lib/xp';

import { NeaMontre } from '../../modules/nea-montre/src';

import { selectProfil, useProfil } from './profil';

/** Bannière affichée en haut de l'écran pendant 7 s (.nbanner). */
export const useBanniere = create<{ n: Notif | null }>(() => ({ n: null }));

let masquer: ReturnType<typeof setTimeout> | null = null;
function banniere(n: Notif) {
  if (masquer) clearTimeout(masquer);
  useBanniere.setState({ n });
  masquer = setTimeout(() => useBanniere.setState({ n: null }), 7000);
}

/** Ouvre l'écran lié à la notification (openNotif). */
export function ouvrirNotif(act: ActionNotif, id?: string, lien?: string) {
  if (id) useProfil.getState().lireNotif(id);
  useBanniere.setState({ n: null });
  if (act === 'activite' && lien) router.push({ pathname: '/activite', params: { d: lien } });
  else if (act === 'hrv') router.push('/recuperation');
  else if (act === 'sleep') router.push('/sommeil');
  else if (act === 'sleepadd') router.push({ pathname: '/sommeil', params: { ajout: '1' } });
  else if (act === 'sortie') router.push('/velo');
  else if (act === 'accueil') router.push('/accueil');
  else if (act === 'sport') router.push('/sport-en-cours');
  else if (act === 'seance') router.push(lien && /^\d$/.test(lien) ? { pathname: '/seance/[jour]', params: { jour: lien } } : '/programme');
  else router.push('/notifications');
}

const MIN_RALENTIR = 30;

/**
 * « L'heure de ralentir » (maquette de l'utilisateur) : dans l'heure qui précède le coucher choisi, NÉA ouvert pose un compte à rebours
 * sur l'écran verrouillé (Activité en direct, build 25+) ; retiré 30 min après l'heure du coucher ou si le rappel est coupé.
 */
export function verifierCoucher(now: Date = new Date()) {
  if (!NeaMontre?.demarrerCoucher) return;
  const st = useProfil.getState();
  const cible = new Date(now);
  cible.setHours(Math.floor(hm(st.nset.bedT) / 60), hm(st.nset.bedT) % 60, 0, 0);
  // Écart ramené entre −12 h et +12 h (coucher après minuit).
  let ecart = (+cible - +now) / 60000;
  if (ecart > 720) ecart -= 1440;
  if (ecart <= -720) ecart += 1440;
  const coucher = +now + ecart * 60000;
  try {
    if (st.onboarded && st.nset.bed && ecart > 0 && ecart <= 60) NeaMontre.demarrerCoucher(coucher);
    else if (!st.nset.bed || ecart <= -30 || ecart > 60) NeaMontre.finCoucher?.();
  } catch {
    // build sans Activité en direct
  }
}

/** Nouvelle notification (activité de la montre…) : ajoutée à la liste et montrée en bannière. */
export function annoncer(n: NouvelleNotif) {
  banniere(useProfil.getState().notifier(n));
}

/** Une vérification : ajoute les notifications dues et montre la dernière en bannière. */
export function verifierNotifs() {
  const neuves = useProfil.getState().tickNotifs();
  if (neuves.length) banniere(neuves[0]);
}

/* ---------- Notifications du téléphone ---------- */

const natif = Platform.OS !== 'web';

export type Autorisation = 'granted' | 'denied' | 'undetermined' | 'indisponible';

export async function autorisation(): Promise<Autorisation> {
  if (!natif) return 'indisponible';
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/** « Autoriser aussi hors de l'app ». */
export async function demanderAutorisation(): Promise<Autorisation> {
  if (!natif) return 'indisponible';
  const { status } = await Notifications.requestPermissionsAsync();
  if (status === 'granted') await reprogrammer();
  return status;
}

const contenu = (n: { title: string; body: string; act: ActionNotif }) => ({ title: n.title, body: n.body, data: { act: n.act } });

/** Prochaine occurrence d'une heure « 07:30 » (aujourd'hui si elle n'est pas passée). */
function prochaine(h: string, now: Date): Date {
  const d = new Date(now);
  d.setHours(Math.floor(hm(h) / 60), hm(h) % 60, 0, 0);
  if (+d <= +now) d.setDate(d.getDate() + 1);
  return d;
}

/**
 * Reprogramme les notifications du téléphone : rappels VFC en attente, prochain bilan de nuit, rappel du coucher chaque jour.
 * Le texte du bilan est celui connu maintenant (le plus souvent « Comment as-tu dormi ? », la nuit n'étant pas encore notée).
 */
export async function reprogrammer(now: Date = new Date()) {
  if (!natif) return;
  if ((await Notifications.getPermissionsAsync()).status !== 'granted') return;
  // Seulement les nôtres : les rappels d'eau posés par le module natif (« nea.… ») restent programmés.
  const prevues = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(prevues.filter((n) => !n.identifier.startsWith('nea.')).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  const st = useProfil.getState();
  if (!st.onboarded) return;
  const base = baseHrv(st.nights, st.hrvChecks);
  const DATE = Notifications.SchedulableTriggerInputTypes.DATE;
  for (const p of st.pending) {
    if (p.at <= +now) continue;
    const n = p.type === 'trial' ? notifEssai(st.premium) : notifPost(p, st.nset, base);
    if (n) await Notifications.scheduleNotificationAsync({ content: contenu(n), trigger: { type: DATE, date: new Date(p.at) } });
  }
  if (st.nset.sleep) {
    let reveil = prochaine(st.nset.wake, now);
    if (st.lastWake === dayKey(reveil)) reveil = new Date(+reveil + 864e5);
    const n = lastNight(st.nights, reveil);
    await Notifications.scheduleNotificationAsync({ content: contenu(notifNuit(n, sleepScore(n, base))), trigger: { type: DATE, date: reveil } });
  }
  // Motivation du jour : les 7 prochains matins, un message différent chaque jour (jamais le même avant d'avoir vu les 123).
  if (st.nset.motiv !== false) {
    const h = st.nset.motivT ?? '08:00';
    let jour = prochaine(h, now);
    for (let k = 0; k < 7; k++, jour = new Date(+jour + 864e5)) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Ta dose de motivation 🔥', body: motivationDuJour(st.progStart, st.name, jour), data: { act: 'accueil' } },
        trigger: { type: DATE, date: jour },
      });
    }
  }
  // Conseil cœur : un jour sur deux à 17 h 30, pour améliorer ton rythme (le bilan du matin arrive quand ta nuit est connue).
  if (st.nset.coeur !== false) {
    let jour = prochaine('17:30', now);
    for (let k = 0; k < 4; k++, jour = new Date(+jour + 2 * 864e5)) {
      await Notifications.scheduleNotificationAsync({ content: { ...conseilRythme(jour), data: { act: 'sleep' } }, trigger: { type: DATE, date: jour } });
    }
  }
  // « On bouge ensemble ? » à 18 h les jours de séance (pas aujourd'hui si une séance est déjà faite) ; sur la montre :
  // écran d'Axel avec haltère, Commencer / Dans 30 min (catégorie NEA_SEANCE, enregistrée par le module natif).
  if (st.nset.seance !== false) {
    const sem = { plan: buildPlan(selectProfil(st)), weight: st.weight, added: st.added, wkMod: st.wkMod };
    const auj = todayIdx();
    const faiteAuj = st.logs.some((l) => l.type === 'muscu' && new Date(l.d).toDateString() === now.toDateString());
    for (let k = 0; k < 7; k++) {
      const quand = new Date(now);
      quand.setDate(now.getDate() + k);
      quand.setHours(18, 0, 0, 0);
      if (+quand <= +now || (k === 0 && faiteAuj)) continue;
      const jour = (auj + k) % 7;
      const s = sessionForDay(sem, jour);
      if (!s || s.ride || !s.items.length) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'On bouge ensemble ? 💪',
          body: `${s.titre} · ${Math.round(s.min)} min`,
          categoryIdentifier: 'NEA_SEANCE',
          data: { act: 'seance', d: String(jour), nea: { genre: 'seance', titre: s.titre, min: Math.round(s.min) } },
        },
        trigger: { type: DATE, date: quand },
      });
    }
  }
  if (st.nset.bed) {
    await Notifications.scheduleNotificationAsync({
      content: contenu(notifCoucher(st.nset)),
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: Math.floor(hm(st.nset.bedT) / 60), minute: hm(st.nset.bedT) % 60 },
    });
    // « L'heure de ralentir » 30 min avant : la toucher ouvre NÉA, qui pose le compte à rebours sur l'écran verrouillé.
    const avant = (hm(st.nset.bedT) - MIN_RALENTIR + 1440) % 1440;
    await Notifications.scheduleNotificationAsync({
      content: { title: "L'heure de ralentir 🌙", body: `Ton coucher dans ${MIN_RALENTIR} min. Pose l'écran, baisse la lumière, respire.`, data: { act: 'sleep' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: Math.floor(avant / 60), minute: avant % 60 },
    });
  }
}

/**
 * Bilan du cœur de la dernière nuit (FC au repos, VFC) : une fois par nuit, pour une nuit des dernières 24 h,
 * dans la liste des notifications et en bannière.
 */
export function verifierCoeur(now: Date = new Date()) {
  const st = useProfil.getState();
  if (!st.onboarded || st.nset.coeur === false) return;
  const b = bilanCoeur(st.nights);
  if (!b || +now - +new Date(b.d) > 864e5) return;
  if (st.notifs.some((n) => n.type === 'coeur' && n.lien === b.d)) return;
  annoncer({ type: 'coeur', icon: 'heart', col: COULEURS_NOTIF.coeur, act: 'sleep', lien: b.d, ...texteBilanCoeur(b, now) });
}

let demarre = false;
/** À appeler une fois au démarrage : horloge, reprogrammation quand l'état change, touche sur une notification. */
export function demarrerNotifs() {
  if (demarre) return;
  demarre = true;
  setInterval(verifierNotifs, 2000);
  setInterval(() => verifierCoucher(), 60_000);
  // Bilan du cœur : au lancement et à chaque nouvelle nuit.
  setTimeout(() => verifierCoeur(), 3000);
  useProfil.subscribe((s, avant) => {
    if (s.nights !== avant.nights) verifierCoeur();
  });
  if (!natif) return;
  // App ouverte : la bannière de NÉA remplace celle du téléphone.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: false, shouldShowList: true }),
  });
  Notifications.addNotificationResponseReceivedListener((r) => {
    const c = r.notification.request.content;
    const data = c.data as { act?: ActionNotif; d?: string } | undefined;
    // Boutons des notifications (aussi sur la montre) : plus tard, séance, respiration / mesure, récupération.
    if (r.actionIdentifier === 'nea.plustard') {
      void Notifications.scheduleNotificationAsync({
        identifier: `nea.plustard.${Date.now()}`,
        content: { title: c.title ?? '', body: c.body ?? '', data: c.data, categoryIdentifier: c.categoryIdentifier ?? undefined },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 30 * 60 },
      });
      return;
    }
    verifierNotifs();
    if (r.actionIdentifier === 'nea.seance') return ouvrirNotif('seance', undefined, data?.act === 'seance' ? data.d : String(todayIdx()));
    if (r.actionIdentifier === 'nea.respirer' || r.actionIdentifier === 'nea.calme') return ouvrirNotif('hrv');
    if (r.actionIdentifier === 'nea.recup') return ouvrirNotif('sleep');
    ouvrirNotif(data?.act ?? 'notifs', undefined, data?.d);
  });
  let t: ReturnType<typeof setTimeout> | null = null;
  const plus_tard = () => {
    if (t) clearTimeout(t);
    t = setTimeout(() => reprogrammer().catch(() => {}), 1000);
  };
  useProfil.subscribe((s, avant) => {
    if (s.nset !== avant.nset || s.pending !== avant.pending || s.premium !== avant.premium || s.nights !== avant.nights || s.lastWake !== avant.lastWake || s.onboarded !== avant.onboarded || s.logs !== avant.logs || s.added !== avant.added) plus_tard();
  });
  AppState.addEventListener('change', (a) => {
    if (a === 'active') {
      verifierCoucher();
      verifierNotifs();
      plus_tard();
  verifierCoucher();
    }
  });
  plus_tard();
}
