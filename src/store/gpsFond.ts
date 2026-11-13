/**
 * GPS des sorties (vélo, course, rando) qui continue écran verrouillé : `startLocationUpdatesAsync` + tâche de fond
 * (`expo-task-manager`), mode « localisation en arrière-plan » d'iOS, autorisation « Toujours ».
 * Le module natif n'existe qu'à partir du build 35 : sans lui (ou sans « Toujours »), `demarrerGpsFond` rend `false`
 * et l'appelant garde le suivi au premier plan (`watchPositionAsync`).
 */
import { requireOptionalNativeModule } from 'expo';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

type TaskManager = typeof import('expo-task-manager');

const TACHE = 'nea-gps-sortie';
let recepteur: ((p: Location.LocationObject) => void) | null = null;
let actif = false;

function taskManager(): TaskManager | null {
  if (Platform.OS === 'web' || !requireOptionalNativeModule('ExpoTaskManager')) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-task-manager') as TaskManager;
  } catch {
    return null;
  }
}

// La tâche doit être déclarée au chargement de l'app (module importé par le layout racine).
const tm = taskManager();
if (tm && !tm.isTaskDefined(TACHE)) {
  tm.defineTask<{ locations: Location.LocationObject[] }>(TACHE, async ({ data, error }) => {
    if (error || !data?.locations) return;
    for (const p of data.locations) recepteur?.(p);
  });
}

/** Lance le GPS de fond ; `false` si impossible (build sans le module, « Toujours » refusé) : utiliser le premier plan. */
export async function demarrerGpsFond(onPosition: (p: Location.LocationObject) => void): Promise<boolean> {
  if (!tm) return false;
  try {
    if (!(await Location.isBackgroundLocationAvailableAsync())) return false;
    const fond = await Location.requestBackgroundPermissionsAsync();
    if (fond.status !== 'granted') return false;
    recepteur = onPosition;
    await Location.startLocationUpdatesAsync(TACHE, {
      accuracy: Location.Accuracy.BestForNavigation,
      activityType: Location.ActivityType.Fitness,
      timeInterval: 1000,
      distanceInterval: 0,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: { notificationTitle: 'NÉA', notificationBody: 'Ta sortie est en cours', notificationColor: '#FF6B1A' },
    });
    actif = true;
    return true;
  } catch {
    recepteur = null;
    return false;
  }
}

export async function arreterGpsFond() {
  recepteur = null;
  if (!actif) return;
  actif = false;
  try {
    if (await Location.hasStartedLocationUpdatesAsync(TACHE)) await Location.stopLocationUpdatesAsync(TACHE);
  } catch {
    // Déjà arrêté.
  }
}
