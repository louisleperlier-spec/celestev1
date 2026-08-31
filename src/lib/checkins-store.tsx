import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { loadJSON, saveJSON, StorageKeys } from '@/lib/storage';
import type { CheckIn, CheckInStatus, PillarId, ScanEntry } from '@/lib/types';
import { todayKey } from '@/lib/date';

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type CheckInsContextValue = {
  checkIns: CheckIn[];
  scans: ScanEntry[];
  ready: boolean;
  addCheckIn: (input: {
    missionId: string;
    pillar: PillarId;
    status: CheckInStatus;
    note?: string;
    dateKey?: string;
  }) => Promise<void>;
  addScan: (input: Omit<ScanEntry, 'id' | 'createdAt' | 'dateKey'>) => Promise<void>;
};

const CheckInsContext = createContext<CheckInsContextValue | null>(null);

export function CheckInsProvider({ children }: { children: React.ReactNode }) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([
      loadJSON<CheckIn[]>(StorageKeys.checkIns, []),
      loadJSON<ScanEntry[]>(StorageKeys.scans, []),
    ]).then(([storedCheckIns, storedScans]) => {
      setCheckIns(storedCheckIns);
      setScans(storedScans);
      setReady(true);
    });
  }, []);

  const persistCheckIns = useCallback((next: CheckIn[]) => {
    setCheckIns(next);
    saveJSON(StorageKeys.checkIns, next).catch(() => {});
  }, []);

  const persistScans = useCallback((next: ScanEntry[]) => {
    setScans(next);
    saveJSON(StorageKeys.scans, next).catch(() => {});
  }, []);

  const addCheckIn = useCallback<CheckInsContextValue['addCheckIn']>(
    async (input) => {
      const dateKey = input.dateKey ?? todayKey();
      // Une mission = un check-in par jour : on remplace celui du jour s'il existe déjà.
      const withoutSameDay = checkIns.filter(
        (c) => !(c.missionId === input.missionId && c.dateKey === dateKey)
      );
      const entry: CheckIn = {
        id: makeId(),
        missionId: input.missionId,
        pillar: input.pillar,
        status: input.status,
        note: input.note,
        createdAt: new Date().toISOString(),
        dateKey,
      };
      persistCheckIns([entry, ...withoutSameDay]);
    },
    [checkIns, persistCheckIns]
  );

  const addScan = useCallback<CheckInsContextValue['addScan']>(
    async (input) => {
      const entry: ScanEntry = {
        id: makeId(),
        createdAt: new Date().toISOString(),
        dateKey: todayKey(),
        ...input,
      };
      persistScans([entry, ...scans]);
    },
    [scans, persistScans]
  );

  const value = useMemo(
    () => ({ checkIns, scans, ready, addCheckIn, addScan }),
    [checkIns, scans, ready, addCheckIn, addScan]
  );

  return <CheckInsContext.Provider value={value}>{children}</CheckInsContext.Provider>;
}

export function useCheckIns(): CheckInsContextValue {
  const ctx = useContext(CheckInsContext);
  if (!ctx) throw new Error('useCheckIns doit être utilisé dans <CheckInsProvider>');
  return ctx;
}
