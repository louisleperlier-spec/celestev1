import AsyncStorage from '@react-native-async-storage/async-storage';

import { generateId } from '@/lib/id';

/**
 * Identifiant d'appareil stable, généré une fois et persisté localement — sert de clé pour le
 * profil Équipe (Convex), sans email ni mot de passe. Si l'app est désinstallée, un nouvel
 * identifiant sera généré (comportement attendu : pas de compte à récupérer, comme le reste de
 * l'app qui est locale par défaut).
 */
const DEVICE_ID_KEY = 'lume.deviceId.v1';

let cached: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) {
    cached = stored;
    return stored;
  }
  const id = generateId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  cached = id;
  return id;
}
