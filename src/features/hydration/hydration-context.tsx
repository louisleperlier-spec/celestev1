import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { generateId } from '@/lib/id';
import { addDays, dateKey, isSameDayKey, lastNDayKeys, todayKey } from '@/lib/date';
import {
  deleteWaterSampleFromHealth,
  isHealthKitSupported,
  readWaterSamples,
  requestHealthAuthorization,
  writeWaterSampleToHealth,
} from '@/services/health/healthkit';

import { computeDayStats } from './scoring';
import * as repo from './storage-repository';
import { DayStats, DrinkType, HydrationEntry, HydrationSettings, DEFAULT_SETTINGS } from './types';

interface HydrationContextValue {
  ready: boolean;
  entries: HydrationEntry[];
  settings: HydrationSettings;
  healthSupported: boolean;
  syncing: boolean;
  lastSyncedAt: string | null;
  todayStats: DayStats;
  statsForDate: (key: string) => DayStats;
  statsForLastDays: (count: number) => DayStats[];
  addEntry: (volumeMl: number, drinkType: DrinkType, loggedAt?: Date) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  setDailyGoal: (goalMl: number) => Promise<void>;
  enableHealthSync: () => Promise<boolean>;
  disableHealthSync: () => Promise<void>;
  syncWithHealth: () => Promise<void>;
}

const HydrationContext = createContext<HydrationContextValue | null>(null);

const SYNC_WINDOW_DAYS = 30;

export function HydrationProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [entries, setEntries] = useState<HydrationEntry[]>([]);
  const [settings, setSettings] = useState<HydrationSettings>(DEFAULT_SETTINGS);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const healthSupported = useMemo(() => isHealthKitSupported(), []);

  useEffect(() => {
    (async () => {
      const [loadedEntries, loadedSettings] = await Promise.all([repo.loadEntries(), repo.loadSettings()]);
      setEntries(loadedEntries);
      setSettings(loadedSettings);
      setReady(true);
    })();
  }, []);

  const persistEntries = useCallback((next: HydrationEntry[]) => {
    setEntries(next);
    void repo.saveEntries(next);
  }, []);

  const syncWithHealth = useCallback(async () => {
    if (!healthSupported || !settings.healthSyncEnabled) return;
    setSyncing(true);
    try {
      const start = addDays(new Date(), -SYNC_WINDOW_DAYS);
      const samples = await readWaterSamples(start, new Date());

      setEntries((current) => {
        const byHealthUUID = new Set(current.filter((e) => e.healthUUID).map((e) => e.healthUUID));
        const byId = new Set(current.map((e) => e.id));
        const additions: HydrationEntry[] = [];

        for (const sample of samples) {
          if (sample.lumeEntryId && byId.has(sample.lumeEntryId)) continue;
          if (byHealthUUID.has(sample.uuid)) continue;
          additions.push({
            id: `hk_${sample.uuid}`,
            volumeMl: Math.round(sample.volumeMl),
            drinkType: 'water',
            loggedAt: sample.loggedAt,
            source: 'healthkit',
            healthUUID: sample.uuid,
          });
        }

        if (additions.length === 0) return current;
        const next = [...current, ...additions];
        void repo.saveEntries(next);
        return next;
      });

      setLastSyncedAt(new Date().toISOString());
    } finally {
      setSyncing(false);
    }
  }, [healthSupported, settings.healthSyncEnabled]);

  useEffect(() => {
    if (ready && settings.healthSyncEnabled) {
      void syncWithHealth();
    }
    // Sync uniquement au chargement initial et quand la synchro passe à "activée".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, settings.healthSyncEnabled]);

  const addEntry = useCallback(
    async (volumeMl: number, drinkType: DrinkType, loggedAt: Date = new Date()) => {
      const entry: HydrationEntry = {
        id: generateId(),
        volumeMl,
        drinkType,
        loggedAt: loggedAt.toISOString(),
        source: 'manual',
      };
      const next = [...entries, entry];
      persistEntries(next);

      if (settings.healthSyncEnabled && healthSupported) {
        const uuid = await writeWaterSampleToHealth(entry.id, volumeMl, loggedAt);
        if (uuid) {
          setEntries((current) => {
            const updated = current.map((e) => (e.id === entry.id ? { ...e, healthUUID: uuid } : e));
            void repo.saveEntries(updated);
            return updated;
          });
        }
      }
    },
    [entries, persistEntries, settings.healthSyncEnabled, healthSupported],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const target = entries.find((e) => e.id === id);
      if (!target) return;
      persistEntries(entries.filter((e) => e.id !== id));
      if (target.healthUUID) {
        void deleteWaterSampleFromHealth(target.healthUUID);
      }
    },
    [entries, persistEntries],
  );

  const setDailyGoal = useCallback(
    async (goalMl: number) => {
      const next = { ...settings, dailyGoalMl: goalMl };
      setSettings(next);
      await repo.saveSettings(next);
    },
    [settings],
  );

  const enableHealthSync = useCallback(async () => {
    const granted = await requestHealthAuthorization();
    const next = { ...settings, healthSyncEnabled: granted };
    setSettings(next);
    await repo.saveSettings(next);
    return granted;
  }, [settings]);

  const disableHealthSync = useCallback(async () => {
    const next = { ...settings, healthSyncEnabled: false };
    setSettings(next);
    await repo.saveSettings(next);
  }, [settings]);

  const statsForDate = useCallback(
    (key: string): DayStats => {
      const dayEntries = entries.filter((e) => isSameDayKey(e.loggedAt, key));
      const now = key === todayKey() ? new Date() : undefined;
      return computeDayStats(key, dayEntries, settings.dailyGoalMl, now);
    },
    [entries, settings.dailyGoalMl],
  );

  const statsForLastDays = useCallback(
    (count: number): DayStats[] => lastNDayKeys(count).map((key) => statsForDate(key)),
    [statsForDate],
  );

  const todayStats = useMemo(() => statsForDate(todayKey()), [statsForDate]);

  const value: HydrationContextValue = {
    ready,
    entries,
    settings,
    healthSupported,
    syncing,
    lastSyncedAt,
    todayStats,
    statsForDate,
    statsForLastDays,
    addEntry,
    deleteEntry,
    setDailyGoal,
    enableHealthSync,
    disableHealthSync,
    syncWithHealth,
  };

  return <HydrationContext.Provider value={value}>{children}</HydrationContext.Provider>;
}

export function useHydration(): HydrationContextValue {
  const ctx = useContext(HydrationContext);
  if (!ctx) throw new Error('useHydration must be used within a HydrationProvider');
  return ctx;
}

export { dateKey };
