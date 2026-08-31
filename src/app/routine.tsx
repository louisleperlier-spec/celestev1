import { Redirect, useLocalSearchParams } from 'expo-router';

import { RoutineView } from '@/features/coach/routine-view';
import { findRoutine } from '@/features/coach/routines';

export default function RoutineRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const routine = id ? findRoutine(id) : undefined;

  if (!routine) return <Redirect href="/coach" />;

  return <RoutineView routine={routine} />;
}
