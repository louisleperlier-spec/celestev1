import type { SFSymbol } from 'sf-symbols-typescript';

/**
 * Contenu "Recommandé pour toi" — un aperçu volontairement court (2-3 cartes par catégorie),
 * pas un catalogue. Les textes réels (titre/sous-titre/corps) vivent en i18n sous
 * `coach.content.<id>.*` ; ce module ne porte que la structure et le verrouillage premium.
 * À enrichir plus tard avec du vrai contenu — voir le point flagué en fin de build Coach.
 */

export type ContentCategory = 'recipe' | 'activity' | 'recovery';

export type ContentTag = 'antiBloating' | 'energy' | 'light' | 'short' | 'outdoor' | 'breathing' | 'sleep';

export interface ContentItem {
  id: string;
  category: ContentCategory;
  icon: SFSymbol;
  durationMinutes: number;
  premium: boolean;
  tags: ContentTag[];
}

export const RECOMMENDED_CONTENT: ContentItem[] = [
  { id: 'recipe1', category: 'recipe', icon: 'leaf.fill', durationMinutes: 5, premium: false, tags: ['antiBloating', 'light'] },
  { id: 'recipe2', category: 'recipe', icon: 'sparkles', durationMinutes: 3, premium: false, tags: ['energy', 'light'] },
  { id: 'recipe3', category: 'recipe', icon: 'cup.and.saucer.fill', durationMinutes: 5, premium: true, tags: ['antiBloating', 'energy'] },
  { id: 'activity1', category: 'activity', icon: 'figure.walk', durationMinutes: 15, premium: false, tags: ['short', 'outdoor'] },
  { id: 'activity2', category: 'activity', icon: 'figure.flexibility', durationMinutes: 8, premium: false, tags: ['short'] },
  { id: 'activity3', category: 'activity', icon: 'figure.mind.and.body', durationMinutes: 10, premium: true, tags: ['short'] },
  { id: 'recovery1', category: 'recovery', icon: 'wind', durationMinutes: 4, premium: false, tags: ['breathing', 'short'] },
  { id: 'recovery2', category: 'recovery', icon: 'moon.zzz.fill', durationMinutes: 6, premium: false, tags: ['sleep'] },
  { id: 'recovery3', category: 'recovery', icon: 'bed.double.fill', durationMinutes: 10, premium: true, tags: ['sleep', 'breathing'] },
];

export function contentForCategory(category: ContentCategory): ContentItem[] {
  return RECOMMENDED_CONTENT.filter((item) => item.category === category);
}

export function findContentItem(id: string): ContentItem | undefined {
  return RECOMMENDED_CONTENT.find((item) => item.id === id);
}

export const CATEGORY_LABEL_KEY: Record<ContentCategory, string> = {
  recipe: 'coach.recipeCategory',
  activity: 'coach.activityCategory',
  recovery: 'coach.recoveryCategory',
};

export const CATEGORY_TAGS: Record<ContentCategory, ContentTag[]> = {
  recipe: ['antiBloating', 'energy', 'light'],
  activity: ['short', 'outdoor'],
  recovery: ['breathing', 'sleep'],
};
