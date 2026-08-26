// Archétype list-crud — couche d'accès aux données (repository).
// SEUL endroit qui parle à Supabase pour cette entité : les hooks et les écrans passent
// TOUJOURS par ici (jamais d'appel `supabase.from(...)` dans un composant).
import { supabase } from '@/services/supabase/client';

import { type Item, type ItemInput } from './types';

// Colonnes chargées pour la LISTE — ne jamais faire `select('*')` sur une longue liste
// (perf). Le détail (`getItem`) charge tout.
const LIST_COLUMNS = 'id, title, note, done, created_at';

/** Liste les items de l'utilisateur (plus récents d'abord). */
export async function listItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select(LIST_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Item[];
}

/** Récupère un item par id. `maybeSingle` → null si introuvable / pas le nôtre (RLS),
 *  sans lever d'erreur : on distingue « supprimé » d'une vraie panne réseau. */
export async function getItem(id: string): Promise<Item | null> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Item | null;
}

/** Crée un item pour l'utilisateur connecté. `user_id` est posé ici, jamais par le client
 *  à l'aveugle : c'est ce que la policy RLS vérifie (`with check auth.uid() = user_id`). */
export async function createItem(input: ItemInput): Promise<Item> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not_authenticated');

  const { data, error } = await supabase
    .from('items')
    .insert({
      user_id: user.id,
      title: input.title.trim().slice(0, 120),
      note: input.note?.trim() || null,
      done: input.done ?? false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Item;
}

/** Met à jour partiellement un item. */
export async function updateItem(id: string, fields: Partial<ItemInput>): Promise<void> {
  const { error } = await supabase.from('items').update(fields).eq('id', id);
  if (error) throw error;
}

/** Supprime un item. */
export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
}
