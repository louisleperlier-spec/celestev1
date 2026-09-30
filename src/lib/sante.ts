/**
 * Apple Santé : lecture du poids, de la dernière nuit (coucher, réveil, VFC nocturne, FC au repos), des calories actives
 * et minutes d'exercice (cercles) et de la FC de la montre ; écriture des séances et sorties vélo comme entraînements.
 * Le module natif n'existe que dans la version de développement / App Store : dans Expo Go, sur le web
 * et sur Android, `santeDisponible()` renvoie false et l'app garde la saisie manuelle du prototype.
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type HK = typeof import('@kingstinct/react-native-healthkit');

const LECTURE = [
  'HKCategoryTypeIdentifierSleepAnalysis',
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKQuantityTypeIdentifierBodyMass',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKQuantityTypeIdentifierAppleExerciseTime',
  'HKQuantityTypeIdentifierHeartRate',
] as const;

const ECRITURE = ['HKWorkoutTypeIdentifier', 'HKQuantityTypeIdentifierActiveEnergyBurned', 'HKQuantityTypeIdentifierDistanceCycling'] as const;

let hk: HK | null | undefined;

/** Charge le module natif seulement là où il existe (un import direct planterait dans Expo Go). */
function module(): HK | null {
  if (hk !== undefined) return hk;
  hk = null;
  if (Platform.OS !== 'ios' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return hk;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const m = require('@kingstinct/react-native-healthkit') as HK;
    if (m.isHealthDataAvailable()) hk = m;
  } catch {
    hk = null;
  }
  return hk;
}

/** Apple Santé est utilisable sur cet appareil. */
export const santeDisponible = () => module() !== null;

let autorise = false;
/** Demande l'accès en lecture et en écriture (la fenêtre d'Apple ne s'affiche qu'une fois). */
async function autoriser(m: HK): Promise<void> {
  if (autorise) return;
  await m.requestAuthorization({ toRead: LECTURE, toShare: ECRITURE });
  autorise = true;
}

const moyenne = (v: readonly number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0);
const hhmm = (d: Date) => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');

/** Dernier poids enregistré dans Apple Santé (kg, 1 décimale), ou null. */
export async function poidsSante(): Promise<number | null> {
  const m = module();
  if (!m) return null;
  try {
    await autoriser(m);
    const s = await m.queryQuantitySamples('HKQuantityTypeIdentifierBodyMass', { limit: 1, ascending: false, unit: 'kg' });
    return s[0] ? Math.round(s[0].quantity * 10) / 10 : null;
  } catch {
    return null;
  }
}

/** `fin` : heure exacte du dernier réveil (pour n'importer la nuit qu'une fois levé). */
export type NuitSante = { coucher: string; reveil: string; hrv: number | null; rhr: number | null; fin: Date };

/**
 * Dernière nuit des 24 dernières heures : premier endormissement et dernier réveil (phases de sommeil de la montre),
 * VFC nocturne = moyenne des VFC (SDNN, celle affichée dans l'app Santé) mesurées pendant la nuit, dernière FC au repos.
 */
export async function nuitSante(now: Date = new Date()): Promise<NuitSante | null> {
  const m = module();
  if (!m) return null;
  try {
    await autoriser(m);
    const debut = new Date(+now - 24 * 36e5);
    const phases = await m.queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', {
      limit: 0,
      ascending: true,
      filter: { date: { startDate: debut, endDate: now } },
    });
    // 0 = au lit, 2 = éveillé ; 1, 3, 4, 5 = endormi (non précisé, léger, profond, paradoxal)
    const dort = phases.filter((p) => ![0, 2].includes(Number(p.value)));
    if (!dort.length) return null;
    const coucher = new Date(Math.min(...dort.map((p) => +new Date(p.startDate))));
    const reveil = new Date(Math.max(...dort.map((p) => +new Date(p.endDate))));
    const vfc = await m.queryQuantitySamples('HKQuantityTypeIdentifierHeartRateVariabilitySDNN', {
      limit: 0,
      unit: 'ms',
      filter: { date: { startDate: coucher, endDate: reveil } },
    });
    const repos = await m.queryQuantitySamples('HKQuantityTypeIdentifierRestingHeartRate', {
      limit: 1,
      ascending: false,
      unit: 'count/min',
      filter: { date: { startDate: debut, endDate: now } },
    });
    const hv = Math.round(moyenne(vfc.map((s) => s.quantity)));
    return { coucher: hhmm(coucher), reveil: hhmm(reveil), hrv: hv || null, rhr: repos[0] ? Math.round(repos[0].quantity) : null, fin: reveil };
  } catch {
    return null;
  }
}

/** Calories actives et minutes d'exercice d'un jour (données des cercles d'activité d'Apple). */
export type ActiviteJour = { kcal: number; min: number };

/** Activité des jours de `debut` (minuit) à maintenant, un élément par jour dans l'ordre, ou null sans Apple Santé. */
export async function activiteSante(debut: Date, now: Date = new Date()): Promise<ActiviteJour[] | null> {
  const m = module();
  if (!m) return null;
  try {
    await autoriser(m);
    const filtre = { filter: { date: { startDate: debut, endDate: now } } };
    const [kcal, min] = await Promise.all([
      m.queryStatisticsCollectionForQuantity('HKQuantityTypeIdentifierActiveEnergyBurned', ['cumulativeSum'], debut, { day: 1 }, { ...filtre, unit: 'kcal' }),
      m.queryStatisticsCollectionForQuantity('HKQuantityTypeIdentifierAppleExerciseTime', ['cumulativeSum'], debut, { day: 1 }, { ...filtre, unit: 'min' }),
    ]);
    const jours = Math.round((+new Date(now.getFullYear(), now.getMonth(), now.getDate()) - +debut) / 864e5) + 1;
    const index = (d?: Date) => (d ? Math.round((+new Date(d) - +debut) / 864e5) : -1);
    const out: ActiviteJour[] = Array.from({ length: jours }, () => ({ kcal: 0, min: 0 }));
    kcal.forEach((r) => {
      const i = index(r.startDate);
      if (out[i]) out[i].kcal = Math.round(r.sumQuantity?.quantity ?? 0);
    });
    min.forEach((r) => {
      const i = index(r.startDate);
      if (out[i]) out[i].min = Math.round(r.sumQuantity?.quantity ?? 0);
    });
    return out;
  } catch {
    return null;
  }
}

/** Mesures de FC d'Apple Santé entre deux instants (entraînement de la montre), dans l'ordre : [ms, bpm]. */
export async function fcEntre(debut: Date, fin: Date): Promise<[number, number][]> {
  const m = module();
  if (!m) return [];
  try {
    await autoriser(m);
    const s = await m.queryQuantitySamples('HKQuantityTypeIdentifierHeartRate', {
      limit: 0,
      ascending: true,
      unit: 'count/min',
      filter: { date: { startDate: debut, endDate: fin } },
    });
    return s.map((x) => [+new Date(x.startDate), Math.round(x.quantity)] as [number, number]);
  } catch {
    return [];
  }
}

/** FC mesurée par la montre il y a moins de `maxSec` secondes, ou null (pas de montre, pas d'entraînement lancé dessus). */
export async function fcRecente(maxSec = 20, now: Date = new Date()): Promise<number | null> {
  const m = module();
  if (!m) return null;
  try {
    await autoriser(m);
    const s = await m.queryQuantitySamples('HKQuantityTypeIdentifierHeartRate', {
      limit: 1,
      ascending: false,
      unit: 'count/min',
      filter: { date: { startDate: new Date(+now - maxSec * 1000), endDate: now } },
    });
    return s[0] ? Math.round(s[0].quantity) : null;
  } catch {
    return null;
  }
}

/** Enregistre une séance (renforcement) ou une sortie vélo dans Apple Santé : elle compte pour les cercles d'Apple. */
export async function enregistrerEntrainement(e: { type: 'muscu' | 'velo'; debut: Date; fin: Date; kcal: number; km?: number }): Promise<void> {
  const m = module();
  if (!m || +e.fin <= +e.debut) return;
  try {
    await autoriser(m);
    const mesures: Parameters<HK['saveWorkoutSample']>[1][number][] = [
      { startDate: e.debut, endDate: e.fin, quantityType: 'HKQuantityTypeIdentifierActiveEnergyBurned', quantity: Math.max(0, e.kcal), unit: 'kcal' },
    ];
    if (e.km) mesures.push({ startDate: e.debut, endDate: e.fin, quantityType: 'HKQuantityTypeIdentifierDistanceCycling', quantity: e.km * 1000, unit: 'm' });
    // 50 = renforcement musculaire traditionnel, 13 = vélo (HKWorkoutActivityType)
    await m.saveWorkoutSample(e.type === 'velo' ? 13 : 50, mesures, e.debut, e.fin, { energyBurned: Math.max(0, e.kcal), distance: e.km ? e.km * 1000 : undefined });
  } catch {
    // Refus de l'écriture ou erreur : la séance reste enregistrée dans NÉA.
  }
}
