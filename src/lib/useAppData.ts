import { useLocalStorage } from "./storage";
import type { EmotionEntry } from "./emotions";
import type { JournalEntry } from "./storage";

const seedEmotions: EmotionEntry[] = [
  { id: "seed-1", familyId: "confiance", intensity: 2, note: "", createdAt: daysAgo(1) },
  { id: "seed-2", familyId: "joie", intensity: 3, note: "", createdAt: daysAgo(2) },
  { id: "seed-3", familyId: "anticipation", intensity: 2, note: "", createdAt: daysAgo(3) },
  { id: "seed-4", familyId: "tristesse", intensity: 1, note: "", createdAt: daysAgo(4) },
  { id: "seed-5", familyId: "peur", intensity: 1, note: "", createdAt: daysAgo(5) },
  { id: "seed-6", familyId: "joie", intensity: 2, note: "", createdAt: daysAgo(6) },
  { id: "seed-7", familyId: "confiance", intensity: 3, note: "", createdAt: daysAgo(7) },
];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export function useEmotionEntries() {
  return useLocalStorage<EmotionEntry[]>("celeste-emotion-entries", seedEmotions);
}

export function useJournalEntries() {
  return useLocalStorage<JournalEntry[]>("celeste-journal-entries", []);
}

export function computeStreak(entries: EmotionEntry[]): number {
  if (entries.length === 0) return 0;
  const days = new Set(entries.map((e) => new Date(e.createdAt).toDateString()));
  let streak = 0;
  const cursor = new Date();
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
