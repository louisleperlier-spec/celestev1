/**
 * Réveil de la partie Sommeil : vraie alarme de l'iPhone (AlarmKit, iOS 26+, module nea-montre), sinon notifications sonores
 * hebdomadaires (son « Réveil doux » du bundle). Les identifiants `nea.reveil.*` ne sont pas effacés par `reprogrammer()`.
 */
import * as Notifications from 'expo-notifications';

import { prochaineSonnerie, type Reveil } from '@/lib/reveil';
import { hm } from '@/lib/sommeil';

import { NeaMontre } from '../../modules/nea-montre/src';

export type ModeReveil = 'alarme' | 'notification' | 'aucun';

const SON = 'reveil_doux.wav';

async function annulerNotifs() {
  try {
    const toutes = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(toutes.filter((n) => n.identifier.startsWith('nea.reveil.')).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  } catch {
    // rien à annuler
  }
}

async function programmerNotifs(r: Reveil) {
  const min = hm(r.h);
  const contenu: Notifications.NotificationContentInput = {
    title: "Bonjour, c'est l'heure ☀️",
    body: 'Ton réveil NÉA. Bois un verre d’eau et ouvre les rideaux.',
    sound: r.son === 'doux' ? SON : 'default',
    data: { act: 'sleepadd' },
  };
  if (!r.jours.length) {
    const d = prochaineSonnerie(r);
    if (d) await Notifications.scheduleNotificationAsync({ identifier: 'nea.reveil.1', content: contenu, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: d } });
    return;
  }
  for (const j of r.jours) {
    await Notifications.scheduleNotificationAsync({
      identifier: `nea.reveil.${j}`,
      content: contenu,
      // weekday : 1 = dimanche … 7 = samedi ; nos jours : 0 = lundi … 6 = dimanche.
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: ((j + 1) % 7) + 1, hour: Math.floor(min / 60), minute: min % 60 },
    });
  }
}

/** (Re)programme le réveil ; retourne la façon dont il sonnera. */
export async function programmerReveil(r: Reveil): Promise<ModeReveil> {
  await annulerNotifs();
  try {
    NeaMontre?.annulerReveil?.();
  } catch {
    // module absent
  }
  if (!r.actif) return 'aucun';
  if (NeaMontre?.reveilDisponible?.() && NeaMontre.programmerReveil) {
    try {
      const m = await NeaMontre.programmerReveil(Math.floor(hm(r.h) / 60), hm(r.h) % 60, r.jours, r.son === 'doux' ? SON : '');
      if (m === 'alarmkit') return 'alarme';
    } catch {
      // repli en notifications
    }
  }
  try {
    const perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) return 'aucun';
    await programmerNotifs(r);
    return 'notification';
  } catch {
    return 'aucun';
  }
}

export const reveilEnAlarme = () => !!NeaMontre?.reveilDisponible?.();
