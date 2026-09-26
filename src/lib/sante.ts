/**
 * Apple Santé (lecture seule) : poids, dernière nuit (coucher, réveil, VFC nocturne, FC au repos).
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
] as const;

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
/** Demande l'accès en lecture (la fenêtre d'Apple ne s'affiche qu'une fois). */
async function autoriser(m: HK): Promise<void> {
  if (autorise) return;
  await m.requestAuthorization({ toRead: LECTURE });
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

export type NuitSante = { coucher: string; reveil: string; hrv: number | null; rhr: number | null };

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
    return { coucher: hhmm(coucher), reveil: hhmm(reveil), hrv: hv || null, rhr: repos[0] ? Math.round(repos[0].quantity) : null };
  } catch {
    return null;
  }
}
