// Archétype ai-feed — hooks React Query pour le FEED (liste), le détail, favori, suppression.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-context';

import * as repo from './creations-repository';
import { type Creation } from './types';

function useUid() {
  const { user } = useAuth();
  return user?.id ?? 'anon';
}

export function useCreations() {
  const uid = useUid();
  return useQuery({
    queryKey: ['creations', uid],
    queryFn: repo.listCreations,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
  });
}

export function useCreation(id: string) {
  const uid = useUid();
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['creations', uid, 'one', id],
    queryFn: () => repo.getCreation(id),
    initialData: () => qc.getQueryData<Creation[]>(['creations', uid])?.find((c) => c.id === id),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const uid = useUid();
  return useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) =>
      repo.setFavorite(id, favorite),
    onMutate: async ({ id, favorite }) => {
      await qc.cancelQueries({ queryKey: ['creations', uid] });
      const prev = qc.getQueriesData({ queryKey: ['creations', uid] });
      qc.setQueriesData({ queryKey: ['creations', uid] }, (data: unknown) => {
        if (Array.isArray(data)) return data.map((c: Creation) => (c.id === id ? { ...c, favorite } : c));
        if (data && (data as Creation).id === id) return { ...(data as Creation), favorite };
        return data;
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: () => qc.invalidateQueries({ queryKey: ['creations', uid] }),
  });
}

export function useDeleteCreation() {
  const qc = useQueryClient();
  const uid = useUid();
  return useMutation({
    mutationFn: (id: string) => repo.deleteCreation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['creations', uid] }),
  });
}
