import AsyncStorage from '@react-native-async-storage/async-storage';

import * as repo from '@/features/hydration/storage-repository';
import { DEFAULT_SETTINGS } from '@/features/hydration/types';

const ONBOARDING_KEY = 'lume.onboarding.completed.v1';

export async function setOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

/**
 * Décide si l'onboarding doit s'afficher. Au-delà du flag, on protège les utilisateurs déjà
 * actifs (données ou réglages non par défaut, ex. lors d'une mise à jour de l'app) : on ne les
 * force jamais dans le parcours, et on pose le flag pour ne plus refaire cette vérification.
 */
export async function shouldShowOnboarding(): Promise<boolean> {
  const alreadyCompleted = (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true';
  if (alreadyCompleted) return false;

  const [entries, settings] = await Promise.all([repo.loadEntries(), repo.loadSettings()]);
  const alreadyActive =
    entries.length > 0 || settings.dailyGoalMl !== DEFAULT_SETTINGS.dailyGoalMl || settings.healthSyncEnabled;

  if (alreadyActive) {
    await setOnboardingCompleted();
    return false;
  }
  return true;
}
