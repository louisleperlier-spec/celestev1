import { Platform } from 'react-native';

import * as HealthKit from '@kingstinct/react-native-healthkit';

/**
 * Pont Apple Santé — un seul type suivi : l'eau bue (HKQuantityTypeIdentifierDietaryWater).
 *
 * ⚠️ Nécessite un build natif (dev client / EAS), PAS Expo Go — HealthKit est un module natif.
 * Toutes les fonctions se dégradent en no-op silencieux hors iOS ou sans build natif, pour que
 * le reste de l'app (saisie manuelle, notes, tendances) reste utilisable partout.
 */

const WATER_IDENTIFIER = 'HKQuantityTypeIdentifierDietaryWater' as const;
const WATER_UNIT = 'mL' as const;
const LUME_METADATA_KEY = 'LumeEntryId';

export function isHealthKitSupported(): boolean {
  if (Platform.OS !== 'ios') return false;
  try {
    return HealthKit.isHealthDataAvailable();
  } catch {
    return false;
  }
}

export async function requestHealthAuthorization(): Promise<boolean> {
  if (!isHealthKitSupported()) return false;
  try {
    return await HealthKit.requestAuthorization({
      toShare: [WATER_IDENTIFIER],
      toRead: [WATER_IDENTIFIER],
    });
  } catch {
    return false;
  }
}

/** Écrit une entrée locale dans Apple Santé. Retourne l'UUID HealthKit créé, ou null si indisponible. */
export async function writeWaterSampleToHealth(
  lumeEntryId: string,
  volumeMl: number,
  date: Date,
): Promise<string | null> {
  if (!isHealthKitSupported()) return null;
  try {
    const sample = await HealthKit.saveQuantitySample(
      WATER_IDENTIFIER,
      WATER_UNIT,
      volumeMl,
      date,
      date,
      { [LUME_METADATA_KEY]: lumeEntryId } as never,
    );
    return sample?.uuid ?? null;
  } catch {
    return null;
  }
}

export async function deleteWaterSampleFromHealth(uuid: string): Promise<void> {
  if (!isHealthKitSupported()) return;
  try {
    await HealthKit.deleteObjects(WATER_IDENTIFIER, { uuid });
  } catch {
    // best-effort : si Apple Santé refuse (déjà supprimé, permission retirée…), on n'interrompt pas l'app.
  }
}

export interface HealthWaterSample {
  uuid: string;
  volumeMl: number;
  loggedAt: string; // ISO 8601
  /** Renseigné quand Lume est la source de cet échantillon (évite les doublons à la lecture). */
  lumeEntryId?: string;
}

/** Lit tous les échantillons "eau" d'Apple Santé sur la période — toutes sources confondues. */
export async function readWaterSamples(startDate: Date, endDate: Date): Promise<HealthWaterSample[]> {
  if (!isHealthKitSupported()) return [];
  try {
    const samples = await HealthKit.queryQuantitySamples(WATER_IDENTIFIER, {
      filter: { date: { startDate, endDate } },
      limit: 0,
      ascending: true,
      unit: WATER_UNIT,
    });
    return samples.map((sample) => ({
      uuid: sample.uuid,
      volumeMl: sample.quantity,
      loggedAt: sample.startDate.toISOString(),
      lumeEntryId: (sample.metadata as Record<string, unknown> | undefined)?.[LUME_METADATA_KEY] as
        | string
        | undefined,
    }));
  } catch {
    return [];
  }
}
