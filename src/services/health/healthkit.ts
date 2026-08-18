import { Platform } from 'react-native';

import type * as HealthKitModule from '@kingstinct/react-native-healthkit';

/**
 * Pont Apple Santé — deux types suivis : l'eau bue (HKQuantityTypeIdentifierDietaryWater,
 * lecture + écriture) et le sommeil (HKCategoryTypeIdentifierSleepAnalysis, lecture seule, pour
 * le Dashboard sommeil du Coach).
 *
 * ⚠️ Nécessite un build natif (dev client / EAS), PAS Expo Go — HealthKit est un module natif.
 * `@kingstinct/react-native-healthkit` instancie son binding natif dès son import (Nitro
 * `createHybridObject` throw si le natif n'est pas enregistré) : un `import` statique planterait
 * donc l'app au démarrage dans Expo Go. On charge le module en lazy via `require`, sous `try/catch`,
 * uniquement quand on en a besoin — jamais au chargement du bundle.
 */

const WATER_IDENTIFIER = 'HKQuantityTypeIdentifierDietaryWater' as const;
const WATER_UNIT = 'mL' as const;
const LUME_METADATA_KEY = 'LumeEntryId';

let cachedModule: typeof HealthKitModule | null | undefined;

function loadHealthKit(): typeof HealthKitModule | null {
  if (cachedModule !== undefined) return cachedModule;
  if (Platform.OS !== 'ios') {
    cachedModule = null;
    return cachedModule;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require('@kingstinct/react-native-healthkit') as typeof HealthKitModule;
  } catch {
    cachedModule = null;
  }
  return cachedModule;
}

export function isHealthKitSupported(): boolean {
  const HealthKit = loadHealthKit();
  if (!HealthKit) return false;
  try {
    return HealthKit.isHealthDataAvailable();
  } catch {
    return false;
  }
}

export async function requestHealthAuthorization(): Promise<boolean> {
  const HealthKit = loadHealthKit();
  if (!HealthKit || !isHealthKitSupported()) return false;
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
  const HealthKit = loadHealthKit();
  if (!HealthKit || !isHealthKitSupported()) return null;
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
  const HealthKit = loadHealthKit();
  if (!HealthKit || !isHealthKitSupported()) return;
  try {
    await HealthKit.deleteObjects(WATER_IDENTIFIER, { uuid });
  } catch {
    // best-effort : si Apple Santé refuse (déjà supprimé, permission retirée…), on n'interrompt pas l'app.
  }
}

const SLEEP_IDENTIFIER = 'HKCategoryTypeIdentifierSleepAnalysis' as const;

/** Demande l'accès en lecture au sommeil — séparé de `requestHealthAuthorization` (eau) : on ne
 * demande cette permission que quand l'utilisateur ouvre le Dashboard sommeil, pas avant. */
export async function requestSleepAuthorization(): Promise<boolean> {
  const HealthKit = loadHealthKit();
  if (!HealthKit || !isHealthKitSupported()) return false;
  try {
    return await HealthKit.requestAuthorization({ toShare: [], toRead: [SLEEP_IDENTIFIER] });
  } catch {
    return false;
  }
}

export interface HealthSleepSample {
  uuid: string;
  startedAt: string; // ISO 8601
  endedAt: string; // ISO 8601
  /** false pour les phases "au lit" (inBed) ou "éveillé" (awake) — true seulement si endormi. */
  isAsleep: boolean;
}

/** Lit les échantillons "sommeil" d'Apple Santé sur la période — toutes sources confondues. */
export async function readSleepSamples(startDate: Date, endDate: Date): Promise<HealthSleepSample[]> {
  const HealthKit = loadHealthKit();
  if (!HealthKit || !isHealthKitSupported()) return [];
  try {
    const samples = await HealthKit.queryCategorySamples(SLEEP_IDENTIFIER, {
      filter: { date: { startDate, endDate } },
      limit: 0,
      ascending: true,
    });
    return samples.map((sample) => ({
      uuid: sample.uuid,
      startedAt: sample.startDate.toISOString(),
      endedAt: sample.endDate.toISOString(),
      isAsleep:
        sample.value !== HealthKit.CategoryValueSleepAnalysis.inBed &&
        sample.value !== HealthKit.CategoryValueSleepAnalysis.awake,
    }));
  } catch {
    return [];
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
  const HealthKit = loadHealthKit();
  if (!HealthKit || !isHealthKitSupported()) return [];
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
