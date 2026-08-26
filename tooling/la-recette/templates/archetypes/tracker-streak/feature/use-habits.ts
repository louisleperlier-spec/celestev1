// Archétype tracker-streak — hooks. Fusionne habitudes + coches en `HabitWithStats`
// (streak + doneToday calculés côté client). La coche du jour est OPTIMISTE : le streak
// bouge instantanément à l'appui, rollback si le serveur refuse.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAuth } from '@/features/auth/auth-context';

import * as repo from './habits-repository';
import { computeStreak, dayKey } from './streak';
import { type HabitEntry, type HabitWithStats } from './types';

function useUid() {
  const { user } = useAuth();
  return user?.id ?? 'anon';
}

/** Habitudes + coches, prêtes à afficher (streak, doneToday). */
export function useHabits() {
  const uid = useUid();
  const habitsQ = useQuery({
    queryKey: ['habits', uid],
    queryFn: repo.listHabits,
    refetchOnMount: 'always',
  });
  const entriesQ = useQuery({
    queryKey: ['habit_entries', uid],
    queryFn: () => repo.listEntries(),
    refetchOnMount: 'always',
  });

  const today = dayKey();
  const data = useMemo<HabitWithStats[]>(() => {
    const habits = habitsQ.data ?? [];
    const entries = entriesQ.data ?? [];
    const byHabit = new Map<string, string[]>();
    for (const e of entries) {
      const arr = byHabit.get(e.habit_id) ?? [];
      arr.push(e.day);
      byHabit.set(e.habit_id, arr);
    }
    return habits.map((h) => {
      const days = byHabit.get(h.id) ?? [];
      return { ...h, days, streak: computeStreak(days), doneToday: days.includes(today) };
    });
  }, [habitsQ.data, entriesQ.data, today]);

  return {
    data,
    isLoading: habitsQ.isLoading || entriesQ.isLoading,
    isError: habitsQ.isError || entriesQ.isError,
    refetch: () => {
      habitsQ.refetch();
      entriesQ.refetch();
    },
  };
}

/** Coche / décoche AUJOURD'HUI — optimiste sur le cache des coches. */
export function useToggleToday() {
  const qc = useQueryClient();
  const uid = useUid();
  return useMutation({
    mutationFn: ({ habitId, done }: { habitId: string; done: boolean }) =>
      done ? repo.checkDay(habitId, dayKey()) : repo.uncheckDay(habitId, dayKey()),
    onMutate: async ({ habitId, done }) => {
      const key = ['habit_entries', uid];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<HabitEntry[]>(key) ?? [];
      const today = dayKey();
      const next: HabitEntry[] = done
        ? [
            {
              id: `optimistic-${habitId}-${today}`,
              habit_id: habitId,
              day: today,
              created_at: new Date().toISOString(),
            },
            ...prev,
          ]
        : prev.filter((e) => !(e.habit_id === habitId && e.day === today));
      qc.setQueryData<HabitEntry[]>(key, next);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(['habit_entries', uid], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['habit_entries', uid] }),
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  const uid = useUid();
  return useMutation({
    mutationFn: (name: string) => repo.createHabit(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits', uid] }),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  const uid = useUid();
  return useMutation({
    mutationFn: (id: string) => repo.deleteHabit(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits', uid] });
      qc.invalidateQueries({ queryKey: ['habit_entries', uid] });
    },
  });
}
