// Archétype browse-catalog — hooks des FAVORIS (privés, scopés par user, OPTIMISTES).
// Le cœur se remplit/se vide instantanément à l'appui ; rollback si le serveur refuse.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAuth } from '@/features/auth/auth-context';

import * as repo from './catalog-repository';

function useUid() {
  const { user } = useAuth();
  return user?.id ?? 'anon';
}

/** Les ids favoris de l'utilisateur, prêts à tester (`ids.has(itemId)`). */
export function useFavorites() {
  const uid = useUid();
  const query = useQuery({
    queryKey: ['favorites', uid],
    queryFn: repo.listFavoriteIds,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
  });
  const ids = useMemo(() => new Set(query.data ?? []), [query.data]);
  return { ...query, ids };
}

/** Ajoute / retire un favori — optimiste sur la liste d'ids. */
export function useToggleFavorite() {
  const qc = useQueryClient();
  const uid = useUid();
  return useMutation({
    mutationFn: ({ itemId, favorite }: { itemId: string; favorite: boolean }) =>
      favorite ? repo.addFavorite(itemId) : repo.removeFavorite(itemId),
    onMutate: async ({ itemId, favorite }) => {
      const key = ['favorites', uid];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<string[]>(key) ?? [];
      const next = favorite ? [...new Set([...prev, itemId])] : prev.filter((id) => id !== itemId);
      qc.setQueryData<string[]>(key, next);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(['favorites', uid], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['favorites', uid] }),
  });
}
