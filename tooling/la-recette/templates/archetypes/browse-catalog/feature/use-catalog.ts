// Archétype browse-catalog — hooks React Query pour le CATALOGUE (liste filtrée + détail).
// Le catalogue est PUBLIC (mêmes données pour tous) → clé de cache par filtres, pas par user.
import { useQuery, useQueryClient } from '@tanstack/react-query';

import * as repo from './catalog-repository';
import { type CatalogFilters, type CatalogItem } from './types';

/** Le catalogue filtré. La clé inclut les filtres → chaque combinaison est cachée à part. */
export function useCatalog(filters: CatalogFilters) {
  return useQuery({
    queryKey: ['catalog', filters.category ?? 'all', filters.search?.trim() ?? ''],
    queryFn: () => repo.listCatalog(filters),
    refetchOnReconnect: 'always',
  });
}

/** Une fiche — semée depuis n'importe quel cache liste déjà chargé (ouverture instantanée). */
export function useCatalogItem(id: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['catalog', 'one', id],
    queryFn: () => repo.getCatalogItem(id),
    initialData: () => {
      const lists = qc.getQueriesData<CatalogItem[]>({ queryKey: ['catalog'] });
      for (const [, data] of lists) {
        const hit = Array.isArray(data) ? data.find((i) => i.id === id) : undefined;
        if (hit) return hit;
      }
      return undefined;
    },
  });
}
