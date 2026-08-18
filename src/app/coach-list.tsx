import { Redirect, useLocalSearchParams } from 'expo-router';

import { CoachListView } from '@/features/coach/coach-list-view';
import { ContentCategory } from '@/features/coach/content';

const VALID_CATEGORIES: ContentCategory[] = ['recipe', 'activity', 'recovery'];

export default function CoachListRoute() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const isValid = (VALID_CATEGORIES as string[]).includes(category ?? '');

  if (!isValid) return <Redirect href="/coach" />;

  return <CoachListView category={category as ContentCategory} />;
}
