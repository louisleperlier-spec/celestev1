import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persistance locale (hors-ligne, sans backend). Suffisant pour le journal et les
 * préférences tant que Supabase n'est pas branché (cf. README — étape volontairement
 * reportée). Migration future : lire ces clés et les pousser vers Supabase à la connexion.
 */

const KEYS = {
  journal: 'celeste.journal.v1',
  points: 'celeste.points.v1',
  cardRevealedOn: 'celeste.card-revealed-on.v1',
} as const;

export type JournalEntry = { id: string; date: string; joy: string; intention: string };

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const raw = await AsyncStorage.getItem(KEYS.journal);
  return raw ? (JSON.parse(raw) as JournalEntry[]) : [];
}

export async function addJournalEntry(entry: Omit<JournalEntry, 'id' | 'date'>): Promise<JournalEntry[]> {
  const entries = await getJournalEntries();
  const next: JournalEntry = { ...entry, id: `${Date.now()}`, date: new Date().toISOString() };
  const updated = [next, ...entries];
  await AsyncStorage.setItem(KEYS.journal, JSON.stringify(updated));
  return updated;
}

export async function deleteJournalEntry(id: string): Promise<JournalEntry[]> {
  const entries = await getJournalEntries();
  const updated = entries.filter((e) => e.id !== id);
  await AsyncStorage.setItem(KEYS.journal, JSON.stringify(updated));
  return updated;
}

export async function clearJournal(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.journal);
}

export async function getPoints(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEYS.points);
  return raw ? Number(raw) : 0;
}

export async function addPoints(amount: number): Promise<number> {
  const current = await getPoints();
  const next = current + amount;
  await AsyncStorage.setItem(KEYS.points, String(next));
  return next;
}

function todayKey(date: Date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function isCardRevealedToday(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEYS.cardRevealedOn);
  return raw === todayKey();
}

export async function markCardRevealedToday(): Promise<void> {
  await AsyncStorage.setItem(KEYS.cardRevealedOn, todayKey());
}
