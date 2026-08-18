import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'lume.coach.sleepConnected';

/**
 * HealthKit ne révèle jamais fiablement si une lecture a été refusée (contrainte de
 * confidentialité Apple) — comme pour la synchro eau (`hydration-context.tsx`), on retient
 * simplement que l'utilisateur a lancé la demande de connexion, pas le résultat exact.
 */
export async function loadSleepConnected(): Promise<boolean> {
  return (await AsyncStorage.getItem(STORAGE_KEY)) === 'true';
}

export async function setSleepConnected(connected: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, connected ? 'true' : 'false');
}
