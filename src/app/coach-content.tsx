import { Redirect, useLocalSearchParams } from 'expo-router';

import { CoachContentView } from '@/features/coach/coach-content-view';
import { findContentItem } from '@/features/coach/content';

export default function CoachContentRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = id ? findContentItem(id) : undefined;

  if (!item) return <Redirect href="/coach" />;

  return <CoachContentView item={item} />;
}
