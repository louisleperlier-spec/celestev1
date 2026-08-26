// Archétype tracker-streak — accès données : habitudes + coches journalières.
import { supabase } from '@/services/supabase/client';

import { type Habit, type HabitEntry } from './types';

export async function listHabits(): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('id, name, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Habit[];
}

/** Coches sur une fenêtre récente (par défaut ~400 j) : assez pour le streak et un
 *  calendrier, sans tout charger. */
export async function listEntries(sinceDays = 400): Promise<HabitEntry[]> {
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);
  const sinceKey = since.toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('habit_entries')
    .select('id, habit_id, day, created_at')
    .gte('day', sinceKey)
    .order('day', { ascending: false });
  if (error) throw error;
  return (data ?? []) as HabitEntry[];
}

export async function createHabit(name: string): Promise<Habit> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not_authenticated');
  const { data, error } = await supabase
    .from('habits')
    .insert({ user_id: user.id, name: name.trim().slice(0, 80) })
    .select()
    .single();
  if (error) throw error;
  return data as Habit;
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', id);
  if (error) throw error;
}

/** Coche un jour. `upsert` + `ignoreDuplicates` → idempotent grâce à UNIQUE(habit_id, day). */
export async function checkDay(habitId: string, day: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not_authenticated');
  const { error } = await supabase
    .from('habit_entries')
    .upsert(
      { user_id: user.id, habit_id: habitId, day },
      { onConflict: 'habit_id,day', ignoreDuplicates: true },
    );
  if (error) throw error;
}

/** Décoche un jour. */
export async function uncheckDay(habitId: string, day: string): Promise<void> {
  const { error } = await supabase
    .from('habit_entries')
    .delete()
    .eq('habit_id', habitId)
    .eq('day', day);
  if (error) throw error;
}
