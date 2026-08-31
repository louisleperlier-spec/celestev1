import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from 'convex/react';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { api } from '../../../convex/_generated/api';
import { convexClient } from './convex-provider';
import { getDeviceId } from './device-id';

const DISPLAY_NAME_KEY = 'lume.displayName.v1';

interface LeaderboardEntry {
  displayName: string;
  currentStreak: number;
  xp: number;
  level: number;
}

interface TeamMe {
  displayName: string;
  currentStreak: number;
  longestStreak: number;
  xp: number;
  level: number;
  teamId: string | null;
  team: { name: string; inviteCode: string } | null;
}

interface TeamContextValue {
  supported: boolean;
  ready: boolean;
  displayName: string | null;
  setDisplayName: (name: string) => Promise<void>;
  me: TeamMe | null;
  leaderboard: LeaderboardEntry[] | null;
  createTeam: (name: string) => Promise<{ teamId: string; inviteCode: string }>;
  joinTeam: (inviteCode: string) => Promise<void>;
  recordDailyResult: (dateKey: string, metGoal: boolean) => Promise<void>;
}

const TeamContext = createContext<TeamContextValue | null>(null);

const UNSUPPORTED_VALUE: TeamContextValue = {
  supported: false,
  ready: true,
  displayName: null,
  setDisplayName: async () => {},
  me: null,
  leaderboard: null,
  createTeam: async () => {
    throw new Error('Équipe indisponible sans build natif + backend Convex configuré.');
  },
  joinTeam: async () => {},
  recordDailyResult: async () => {},
};

/**
 * `supported === false` hors build natif configuré (pas de `EXPO_PUBLIC_CONVEX_URL`) — l'onglet
 * Équipe se dégrade proprement, comme HealthKit/RevenueCat ailleurs dans l'app. Le reste de
 * l'app (journal, score, Coach) n'appelle jamais Convex et reste entièrement local.
 */
export function TeamProvider({ children }: { children: React.ReactNode }) {
  if (!convexClient) {
    return <TeamContext.Provider value={UNSUPPORTED_VALUE}>{children}</TeamContext.Provider>;
  }
  return <ConnectedTeamProvider>{children}</ConnectedTeamProvider>;
}

function ConnectedTeamProvider({ children }: { children: React.ReactNode }) {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [displayName, setDisplayNameState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const [id, storedName] = await Promise.all([getDeviceId(), AsyncStorage.getItem(DISPLAY_NAME_KEY)]);
      setDeviceId(id);
      setDisplayNameState(storedName);
      setReady(true);
    })();
  }, []);

  const getOrCreate = useMutation(api.users.getOrCreate);
  const createTeamMutation = useMutation(api.teams.create);
  const joinTeamMutation = useMutation(api.teams.join);
  const recordDailyResultMutation = useMutation(api.users.recordDailyResult);

  const hasProfile = Boolean(deviceId && displayName);
  const me = useQuery(api.users.me, hasProfile ? { deviceId: deviceId! } : 'skip') as TeamMe | null | undefined;
  const teamId = me?.teamId ?? null;
  const leaderboard = useQuery(api.teams.leaderboard, teamId ? { teamId: teamId as never } : 'skip') as
    | LeaderboardEntry[]
    | undefined;

  useEffect(() => {
    if (!ready || !deviceId || !displayName) return;
    void getOrCreate({ deviceId, displayName });
  }, [ready, deviceId, displayName, getOrCreate]);

  const setDisplayName = async (name: string) => {
    await AsyncStorage.setItem(DISPLAY_NAME_KEY, name);
    setDisplayNameState(name);
  };

  const createTeam = async (name: string) => {
    if (!deviceId) throw new Error('Profil non prêt');
    return await createTeamMutation({ deviceId, name });
  };

  const joinTeam = async (inviteCode: string) => {
    if (!deviceId) throw new Error('Profil non prêt');
    await joinTeamMutation({ deviceId, inviteCode });
  };

  const recordDailyResult = async (dateKey: string, metGoal: boolean) => {
    if (!deviceId || !displayName) return;
    await recordDailyResultMutation({ deviceId, dateKey, metGoal });
  };

  const value: TeamContextValue = {
    supported: true,
    ready,
    displayName,
    setDisplayName,
    me: me ?? null,
    leaderboard: leaderboard ?? null,
    createTeam,
    joinTeam,
    recordDailyResult,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam(): TeamContextValue {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within a TeamProvider');
  return ctx;
}
