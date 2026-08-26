// Archétype timer-session — hooks React Query pour l'historique.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-context';

import * as repo from './sessions-repository';
import { type SessionInput } from './types';

function useUid() {
  const { user } = useAuth();
  return user?.id ?? 'anon';
}

export function useSessions() {
  const uid = useUid();
  return useQuery({
    queryKey: ['sessions', uid],
    queryFn: repo.listSessions,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
  });
}

export function useSaveSession() {
  const qc = useQueryClient();
  const uid = useUid();
  return useMutation({
    mutationFn: (input: SessionInput) => repo.saveSession(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions', uid] }),
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  const uid = useUid();
  return useMutation({
    mutationFn: (id: string) => repo.deleteSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions', uid] }),
  });
}
