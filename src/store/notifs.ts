/**
 * Notifications à l'exécution : horloge (notifTick), bannière dans l'app (banner), ouverture (openNotif),
 * et notifications du téléphone quand NÉA est fermé (expo-notifications, fonctionne dans Expo Go sur iPhone).
 */
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { AppState, Platform } from 'react-native';
import { create } from 'zustand';

import { notifCoucher, notifNuit, notifPost, type ActionNotif, type Notif } from '@/lib/notifs';
import { baseHrv, hm, lastNight, sleepScore } from '@/lib/sommeil';
import { dayKey } from '@/lib/xp';

import { useProfil } from './profil';

/** Bannière affichée en haut de l'écran pendant 7 s (.nbanner). */
export const useBanniere = create<{ n: Notif | null }>(() => ({ n: null }));

let masquer: ReturnType<typeof setTimeout> | null = null;
function banniere(n: Notif) {
  if (masquer) clearTimeout(masquer);
  useBanniere.setState({ n });
  masquer = setTimeout(() => useBanniere.setState({ n: null }), 7000);
}

/** Ouvre l'écran lié à la notification (openNotif). */
export function ouvrirNotif(act: ActionNotif, id?: string) {
  if (id) useProfil.getState().lireNotif(id);
  useBanniere.setState({ n: null });
  if (act === 'hrv') router.push('/recuperation');
  else if (act === 'sleep') router.push('/sommeil');
  else if (act === 'sleepadd') router.push({ pathname: '/sommeil', params: { ajout: '1' } });
  else router.push('/notifications');
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
  await Notifications.cancelAllScheduledNotificationsAsync();
  const st = useProfil.getState();
  if (!st.onboarded) return;
  const base = baseHrv(st.nights, st.hrvChecks);
  const DATE = Notifications.SchedulableTriggerInputTypes.DATE;
  for (const p of st.pending) {
    if (p.at > +now) await Notifications.scheduleNotificationAsync({ content: contenu(notifPost(p, st.nset, base)), trigger: { type: DATE, date: new Date(p.at) } });
  }
  if (st.nset.sleep) {
    let reveil = prochaine(st.nset.wake, now);
    if (st.lastWake === dayKey(reveil)) reveil = new Date(+reveil + 864e5);
    const n = lastNight(st.nights, reveil);
    await Notifications.scheduleNotificationAsync({ content: contenu(notifNuit(n, sleepScore(n, base))), trigger: { type: DATE, date: reveil } });
  }
  if (st.nset.bed) {
    await Notifications.scheduleNotificationAsync({
      content: contenu(notifCoucher(st.nset)),
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: Math.floor(hm(st.nset.bedT) / 60), minute: hm(st.nset.bedT) % 60 },
    });
  }
}

let demarre = false;
/** À appeler une fois au démarrage : horloge, reprogrammation quand l'état change, touche sur une notification. */
export function demarrerNotifs() {
  if (demarre) return;
  demarre = true;
  setInterval(verifierNotifs, 2000);
  if (!natif) return;
  // App ouverte : la bannière de NÉA remplace celle du téléphone.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: false, shouldShowList: true }),
  });
  Notifications.addNotificationResponseReceivedListener((r) => {
    const act = r.notification.request.content.data?.act as ActionNotif | undefined;
    verifierNotifs();
    ouvrirNotif(act ?? 'notifs');
  });
  let t: ReturnType<typeof setTimeout> | null = null;
  const plus_tard = () => {
    if (t) clearTimeout(t);
    t = setTimeout(() => reprogrammer().catch(() => {}), 1000);
  };
  useProfil.subscribe((s, avant) => {
    if (s.nset !== avant.nset || s.pending !== avant.pending || s.nights !== avant.nights || s.lastWake !== avant.lastWake || s.onboarded !== avant.onboarded) plus_tard();
  });
  AppState.addEventListener('change', (a) => {
    if (a === 'active') {
      verifierNotifs();
      plus_tard();
    }
  });
  plus_tard();
}
