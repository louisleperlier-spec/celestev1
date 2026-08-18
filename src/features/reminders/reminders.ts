import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import i18n from '@/lib/i18n';

/**
 * Rappel quotidien local — aucune infrastructure serveur, juste une notification programmée
 * sur l'appareil via expo-notifications. Pas de push distante : Lume n'a pas de backend.
 */

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = { enabled: false, hour: 9, minute: 0 };

const SETTINGS_KEY = 'lume.reminder.settings.v1';
const NOTIFICATION_ID_KEY = 'lume.reminder.notificationId.v1';

export async function loadReminderSettings(): Promise<ReminderSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_REMINDER_SETTINGS;
  try {
    return { ...DEFAULT_REMINDER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
}

async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function requestReminderPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const result = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return result.granted || result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

async function cancelExistingReminder(): Promise<void> {
  const id = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
  if (!id) return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
}

/** Active (ou reprogramme) le rappel quotidien à l'heure donnée. Retourne false si la permission est refusée. */
export async function enableReminder(hour: number, minute: number): Promise<boolean> {
  const granted = await requestReminderPermission();
  if (!granted) {
    await saveReminderSettings({ enabled: false, hour, minute });
    return false;
  }

  await cancelExistingReminder();
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('reminders.title'),
      body: i18n.t('reminders.body'),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
  await AsyncStorage.setItem(NOTIFICATION_ID_KEY, id);
  await saveReminderSettings({ enabled: true, hour, minute });
  return true;
}

export async function disableReminder(): Promise<void> {
  await cancelExistingReminder();
  const current = await loadReminderSettings();
  await saveReminderSettings({ ...current, enabled: false });
}
