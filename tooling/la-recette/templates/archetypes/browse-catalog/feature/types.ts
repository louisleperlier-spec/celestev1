// Archétype browse-catalog — types.
// ADAPTER : renomme `CatalogItem` selon ton domaine (Recipe, Workout, Product, Place…) et
// remplace les champs par les tiens. `category` + `tags` alimentent les filtres.

/** Une fiche du catalogue (table `catalog_items`, en lecture PUBLIQUE aux connectés). */
export type CatalogItem = {
  id: string;
  title: string;
  subtitle: string | null;
  category: string;
  tags: string[];
  description: string | null;
  created_at: string;
};

/** Les filtres appliqués à la liste (recherche plein-titre + catégorie). */
export type CatalogFilters = {
  search?: string;
  /** id de catégorie, ou null pour « toutes ». */
  category?: string | null;
};
