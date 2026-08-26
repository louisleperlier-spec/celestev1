// Archétype list-crud — hooks React Query (données serveur) : liste, détail, CRUD.
// Mutations OPTIMISTES (l'UI réagit tout de suite, rollback si le serveur refuse) →
// l'app reste fluide même sur réseau lent.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-context';

import * as repo from './items-repository';
import { type Item, type ItemInput } from './types';

// Clés de cache SCOPÉES par utilisateur : après déconnexion puis connexion d'un autre
// compte sur le même appareil, on ne doit jamais réafficher les données du précédent.
function useUid() {
  const { user } = useAuth();
  return user?.id ?? 'anon';
}

/** La liste des items. */
export function useItems() {
  const uid = useUid();
  return useQuery({
    queryKey: ['items', uid],
    queryFn: repo.listItems,
    // Reflète la réalité serveur dès qu'on (r)ouvre l'écran et dès qu'on retrouve le réseau.
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
  });
}

/** Un item par id — semé depuis le cache liste pour un ouvrir instantané / hors-ligne. */
export function useItem(id: string) {
  const uid = useUid();
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['items', uid, 'one', id],
    queryFn: () => repo.getItem(id),
    initialData: () => qc.getQueryData<Item[]>(['items', uid])?.find((i) => i.id === id),
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  const uid = useUid();
  return useMutation({
    mutationFn: (input: ItemInput) => repo.createItem(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', uid] }),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  const uid = useUid();
  return useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: Partial<ItemInput> }) =>
      repo.updateItem(id, fields),
    // Patch optimiste de la liste ET du détail (matché par préfixe ['items', uid]).
    onMutate: async ({ id, fields }) => {
      await qc.cancelQueries({ queryKey: ['items', uid] });
      const prev = qc.getQueriesData({ queryKey: ['items', uid] });
      qc.setQueriesData({ queryKey: ['items', uid] }, (data: unknown) => {
        if (Array.isArray(data)) return data.map((i: Item) => (i.id === id ? { ...i, ...fields } : i));
        if (data && (data as Item).id === id) return { ...(data as Item), ...fields };
        return data;
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: () => qc.invalidateQueries({ queryKey: ['items', uid] }),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  const uid = useUid();
  return useMutation({
    mutationFn: (id: string) => repo.deleteItem(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['items', uid] });
      const prev = qc.getQueriesData({ queryKey: ['items', uid] });
      qc.setQueriesData({ queryKey: ['items', uid] }, (data: unknown) =>
        Array.isArray(data) ? data.filter((i: Item) => i.id !== id) : data,
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => ctx?.prev.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: () => qc.invalidateQueries({ queryKey: ['items', uid] }),
  });
}
