import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

import { addDays, dateKey, todayKey } from '@/lib/date';

/**
 * Scan — suivi visuel quotidien (photo du visage, ressenti déclaré). Un outil de comparaison,
 * pas un capteur : aucune analyse d'image, aucune mesure objective. Les photos ne quittent
 * JAMAIS l'appareil — aucun upload, aucune analytique, aucune copie en cache partagé.
 */

export type ScanFeeling = 1 | 2 | 3 | 4 | 5;

export interface ScanZones {
  eyes: number; // 1-5, déclaré
  cheeks: number; // 1-5, déclaré
  jaw: number; // 1-5, déclaré
}

export interface Scan {
  id: string;
  date: string; // AAAA-MM-JJ local
  uri: string; // chemin local du fichier
  feeling: ScanFeeling; // ressenti déclaré : 1 = très gonflé, 5 = très net
  zones: ScanZones;
  waterMl: number; // hydratation du jour, copiée depuis le store au moment de l'enregistrement
  note: string | null;
}

const SCANS_INDEX_KEY = 'lume.scans.v1';
const SCANS_DIR_NAME = 'scans';

function scansDirectory(): Directory {
  const dir = new Directory(Paths.document, SCANS_DIR_NAME);
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

async function loadIndex(): Promise<Scan[]> {
  const raw = await AsyncStorage.getItem(SCANS_INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveIndex(scans: readonly Scan[]): Promise<void> {
  await AsyncStorage.setItem(SCANS_INDEX_KEY, JSON.stringify(scans));
}

/**
 * Enregistre un scan. `scan.uri` doit pointer vers la photo fraîchement capturée (emplacement
 * temporaire) — elle est copiée dans le dossier géré par Lume (`documentDirectory/scans/`),
 * jamais référencée depuis son emplacement d'origine. Idempotent sur `scan.id`.
 */
export async function saveScan(scan: Scan): Promise<Scan> {
  const dir = scansDirectory();
  const source = new File(scan.uri);
  const destination = new File(dir, `${scan.id}${source.extension || '.jpg'}`);
  if (destination.exists) destination.delete();
  source.copy(destination);

  const saved: Scan = { ...scan, uri: destination.uri };
  const scans = await loadIndex();
  await saveIndex([...scans.filter((s) => s.id !== saved.id), saved]);
  return saved;
}

/** Tous les scans, triés du plus ancien au plus récent. */
export async function listScans(): Promise<Scan[]> {
  const scans = await loadIndex();
  return [...scans].sort((a, b) => a.date.localeCompare(b.date));
}

export async function deleteScan(id: string): Promise<void> {
  const scans = await loadIndex();
  const target = scans.find((s) => s.id === id);
  if (!target) return;
  await saveIndex(scans.filter((s) => s.id !== id));
  try {
    const file = new File(target.uri);
    if (file.exists) file.delete();
  } catch {
    // le fichier a peut-être déjà disparu — la métadonnée reste la source de vérité pour l'UI
  }
}

/** Supprime toutes les photos et métadonnées — bouton "Supprimer toutes mes photos" (Profil). */
export async function deleteAllScans(): Promise<void> {
  const scans = await loadIndex();
  for (const scan of scans) {
    try {
      const file = new File(scan.uri);
      if (file.exists) file.delete();
    } catch {
      // ignore
    }
  }
  await saveIndex([]);
}

export async function todayScan(): Promise<Scan | null> {
  const scans = await loadIndex();
  return scans.find((s) => s.date === todayKey()) ?? null;
}

/** Nombre de photos stockées + espace occupé (octets) — pour l'écran Profil. */
export async function scanStorageStats(): Promise<{ count: number; bytes: number }> {
  const scans = await loadIndex();
  let bytes = 0;
  for (const scan of scans) {
    try {
      const file = new File(scan.uri);
      if (file.exists) bytes += file.size;
    } catch {
      // ignore
    }
  }
  return { count: scans.length, bytes };
}

/** Le scan dont la date est la plus proche de `daysBack` jours avant celle de `scan`. */
export async function compareWith(scan: Scan, daysBack: number): Promise<Scan | null> {
  const scans = await loadIndex();
  const candidates = scans.filter((s) => s.id !== scan.id);
  if (candidates.length === 0) return null;

  const targetDate = dateKey(addDays(new Date(`${scan.date}T00:00:00`), -daysBack));
  let closest: Scan | null = null;
  let closestDiff = Infinity;
  for (const candidate of candidates) {
    const diff = Math.abs(daysBetween(candidate.date, targetDate));
    if (diff < closestDiff) {
      closest = candidate;
      closestDiff = diff;
    }
  }
  return closest;
}

export interface ScanTrend {
  average7: number | null;
  average30: number | null;
}

/** Évolution du ressenti déclaré moyen sur les 7 et 30 derniers jours (relatif au scan le plus récent). */
export function trend(scans: readonly Scan[]): ScanTrend {
  if (scans.length === 0) return { average7: null, average30: null };
  const mostRecentDate = scans.reduce((latest, s) => (s.date > latest ? s.date : latest), scans[0].date);
  const reference = new Date(`${mostRecentDate}T00:00:00`);

  return {
    average7: averageFeelingSince(scans, reference, 7),
    average30: averageFeelingSince(scans, reference, 30),
  };
}

function averageFeelingSince(scans: readonly Scan[], reference: Date, windowDays: number): number | null {
  const cutoff = dateKey(addDays(reference, -(windowDays - 1)));
  const referenceKey = dateKey(reference);
  const inWindow = scans.filter((s) => s.date >= cutoff && s.date <= referenceKey);
  if (inWindow.length === 0) return null;
  const sum = inWindow.reduce((total, s) => total + s.feeling, 0);
  return Math.round((sum / inWindow.length) * 10) / 10;
}

function daysBetween(dateKeyA: string, dateKeyB: string): number {
  const a = new Date(`${dateKeyA}T00:00:00`).getTime();
  const b = new Date(`${dateKeyB}T00:00:00`).getTime();
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}
