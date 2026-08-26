// Archétype timer-session — accès données de l'historique des séances.
import { supabase } from '@/services/supabase/client';

import { type Session, type SessionInput } from './types';

export async function listSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, label, duration_seconds, completed_at')
    .order('completed_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as Session[];
}

/** Enregistre une séance terminée. Appelée par le timer sur `onComplete`. */
export async function saveSession(input: SessionInput): Promise<Session> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not_authenticated');
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      label: input.label ?? null,
      duration_seconds: input.duration_seconds,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Session;
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) throw error;
}
