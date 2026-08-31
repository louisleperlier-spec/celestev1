import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { loadJSON, saveJSON, StorageKeys } from '@/lib/storage';
import type { CategoryId, Entry } from '@/lib/types';
import { todayKey } from '@/lib/date';

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type EntriesContextValue = {
  entries: Entry[];
  ready: boolean;
  addEntry: (input: {
    category: CategoryId;
    presetId: string;
    label: string;
    points: number;
    note?: string;
    dateKey?: string;
  }) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
};

const EntriesContext = createContext<EntriesContextValue | null>(null);

export function EntriesProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadJSON<Entry[]>(StorageKeys.entries, []).then((stored) => {
      setEntries(stored);
      setReady(true);
    });
  }, []);

  const persist = useCallback((next: Entry[]) => {
    setEntries(next);
    saveJSON(StorageKeys.entries, next).catch(() => {});
  }, []);

  const addEntry = useCallback<EntriesContextValue['addEntry']>(
    async (input) => {
      const entry: Entry = {
        id: makeId(),
        category: input.category,
        presetId: input.presetId,
        label: input.label,
        points: input.points,
        note: input.note,
        createdAt: new Date().toISOString(),
        dateKey: input.dateKey ?? todayKey(),
      };
      persist([entry, ...entries]);
    },
    [entries, persist]
  );

  const removeEntry = useCallback(
    async (id: string) => {
      persist(entries.filter((e) => e.id !== id));
    },
    [entries, persist]
  );

  const value = useMemo(
    () => ({ entries, ready, addEntry, removeEntry }),
    [entries, ready, addEntry, removeEntry]
  );

  return <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>;
}

export function useEntries(): EntriesContextValue {
  const ctx = useContext(EntriesContext);
  if (!ctx) throw new Error('useEntries doit être utilisé dans <EntriesProvider>');
  return ctx;
}
