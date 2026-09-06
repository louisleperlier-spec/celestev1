import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // stockage indisponible (mode privé, quota) — on continue silencieusement
    }
  }, [key, value]);

  return [value, setValue] as const;
}

export interface JournalEntry {
  id: string;
  title: string;
  body: string;
  familyId?: string;
  createdAt: string;
}
