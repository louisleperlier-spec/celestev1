// Archétype ai-feed — accès données des créations gardées.
import { supabase } from '@/services/supabase/client';

import { type Creation } from './types';

const LIST_COLUMNS = 'id, prompt, result, favorite, created_at';

export async function listCreations(): Promise<Creation[]> {
  const { data, error } = await supabase
    .from('creations')
    .select(LIST_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Creation[];
}

export async function getCreation(id: string): Promise<Creation | null> {
  const { data, error } = await supabase
    .from('creations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Creation | null;
}

/** Garde une génération réussie. Appelée par `use-generate` après le retour de l'IA. */
export async function saveCreation(input: { prompt: string; result: string }): Promise<Creation> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not_authenticated');

  const { data, error } = await supabase
    .from('creations')
    .insert({ user_id: user.id, prompt: input.prompt.slice(0, 800), result: input.result })
    .select()
    .single();
  if (error) throw error;
  return data as Creation;
}

export async function setFavorite(id: string, favorite: boolean): Promise<void> {
  const { error } = await supabase.from('creations').update({ favorite }).eq('id', id);
  if (error) throw error;
}

export async function deleteCreation(id: string): Promise<void> {
  const { error } = await supabase.from('creations').delete().eq('id', id);
  if (error) throw error;
}
