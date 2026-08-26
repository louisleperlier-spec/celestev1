// Archétype browse-catalog — les CATÉGORIES de filtre (donnée pure, sans logique).
// ADAPTER : mets les catégories de TON catalogue. Leur `id` doit correspondre à la colonne
// `category` des lignes semées dans `db/001_catalog.sql`. Le `labelKey` renvoie à l'i18n.
//
// Alternative : si tes catégories sont nombreuses / dynamiques, charge-les depuis la base
// (`select distinct category from catalog_items`) au lieu de cette liste figée.

export type Category = { id: string; labelKey: string };

export const CATEGORIES: Category[] = [
  { id: 'featured', labelKey: 'catalog.cat.featured' },
  { id: 'trending', labelKey: 'catalog.cat.trending' },
  { id: 'classics', labelKey: 'catalog.cat.classics' },
];
