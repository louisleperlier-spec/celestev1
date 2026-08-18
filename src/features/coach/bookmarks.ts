import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'lume.coach.bookmarks';

export async function loadBookmarks(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function toggleBookmark(id: string, current: string[]): Promise<string[]> {
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
