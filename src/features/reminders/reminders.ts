import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import i18n from '@/lib/i18n';
import { generateId } from '@/lib/id';

/**
 * Rappels quotidiens locaux — aucune infrastructure serveur, juste des notifications
 * programmées sur l'appareil via expo-notifications. Pas de push distante : Lume n'a pas de
 * backend. Gratuit : 1 rappel. Premium : plusieurs (la limite se gère côté UI, pas ici).
 */

export interface Reminder {
  id: string;
  hour: number;
  minute: number;
  notificationId: string;
}

const REMINDERS_KEY = 'lume.reminders.v1';

export async function listReminders(): Promise<Reminder[]> {
  const raw = await AsyncStorage.getItem(REMINDERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveIndex(reminders: readonly Reminder[]): Promise<void> {
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

export async function requestReminderPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const result = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return result.granted || result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

/** Ajoute un rappel quotidien à l'heure donnée. Retourne null si la permission est refusée. */
export async function addReminder(hour: number, minute: number): Promise<Reminder | null> {
  const granted = await requestReminderPermission();
  if (!granted) return null;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('reminders.title'),
      body: i18n.t('reminders.body'),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });

  const reminder: Reminder = { id: generateId('reminder'), hour, minute, notificationId };
  const reminders = await listReminders();
  await saveIndex([...reminders, reminder]);
  return reminder;
}

export async function removeReminder(id: string): Promise<void> {
  const reminders = await listReminders();
  const target = reminders.find((r) => r.id === id);
  if (!target) return;
  await Notifications.cancelScheduledNotificationAsync(target.notificationId).catch(() => {});
  await saveIndex(reminders.filter((r) => r.id !== id));
}
