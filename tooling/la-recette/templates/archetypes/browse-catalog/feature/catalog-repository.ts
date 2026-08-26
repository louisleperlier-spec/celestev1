// Archétype browse-catalog — accès données (le SEUL endroit qui parle à Supabase).
// Deux entités : le CATALOGUE (lecture publique, filtrable côté serveur) et les FAVORIS de
// l'utilisateur (privés, RLS). La recherche et le filtre catégorie se font en base (pas en
// chargeant tout le catalogue puis en filtrant à la main).
import { supabase } from '@/services/supabase/client';

import { type CatalogFilters, type CatalogItem } from './types';

// Colonnes de la LISTE — pas `select('*')` (le `description` complet ne sert qu'au détail).
const LIST_COLUMNS = 'id, title, subtitle, category, tags, created_at';

/** Liste le catalogue, filtré côté serveur (catégorie + recherche sur le titre). */
export async function listCatalog(filters: CatalogFilters): Promise<CatalogItem[]> {
  let query = supabase.from('catalog_items').select(LIST_COLUMNS).order('title', { ascending: true });

  if (filters.category) query = query.eq('category', filters.category);
  const search = filters.search?.trim();
  if (search) query = query.ilike('title', `%${search}%`); // insensible à la casse

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CatalogItem[];
}

/** Une fiche complète (avec `description`). */
export async function getCatalogItem(id: string): Promise<CatalogItem | null> {
  const { data, error } = await supabase.from('catalog_items').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as CatalogItem | null;
}

/** Les ids des items mis en favori par l'utilisateur (pour cocher les cœurs). */
export async function listFavoriteIds(): Promise<string[]> {
  const { data, error } = await supabase.from('favorites').select('item_id');
  if (error) throw error;
  return (data ?? []).map((r) => (r as { item_id: string }).item_id);
}

/** Ajoute un favori. `user_id` posé ici ; `upsert` idempotent grâce à la PK (user, item). */
export async function addFavorite(itemId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not_authenticated');
  const { error } = await supabase
    .from('favorites')
    .upsert({ user_id: user.id, item_id: itemId }, { onConflict: 'user_id,item_id', ignoreDuplicates: true });
  if (error) throw error;
}

/** Retire un favori (la RLS borne déjà la suppression à mes lignes). */
export async function removeFavorite(itemId: string): Promise<void> {
  const { error } = await supabase.from('favorites').delete().eq('item_id', itemId);
  if (error) throw error;
}
