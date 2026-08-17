import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_SETTINGS, HydrationEntry, HydrationSettings } from './types';

/**
 * Persistance locale — Lume est une app mono-utilisateur, l'appareil est la source de vérité
 * locale (Apple Santé est la source de vérité partagée, voir services/health).
 */

const ENTRIES_KEY = 'lume.entries.v1';
const SETTINGS_KEY = 'lume.settings.v1';

export async function loadEntries(): Promise<HydrationEntry[]> {
  const raw = await AsyncStorage.getItem(ENTRIES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveEntries(entries: readonly HydrationEntry[]): Promise<void> {
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export async function loadSettings(): Promise<HydrationSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: HydrationSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
