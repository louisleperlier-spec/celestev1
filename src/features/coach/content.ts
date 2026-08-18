import type { SFSymbol } from 'sf-symbols-typescript';

/**
 * Contenu "Recommandé pour toi" — un aperçu volontairement court (2-3 cartes par catégorie),
 * pas un catalogue. Les textes réels (titre/sous-titre/corps) vivent en i18n sous
 * `coach.content.<id>.*` ; ce module ne porte que la structure et le verrouillage premium.
 * À enrichir plus tard avec du vrai contenu — voir le point flagué en fin de build Coach.
 */

export type ContentCategory = 'recipe' | 'activity' | 'recovery';

export interface ContentItem {
  id: string;
  category: ContentCategory;
  icon: SFSymbol;
  durationMinutes: number;
  premium: boolean;
}

export const RECOMMENDED_CONTENT: ContentItem[] = [
  { id: 'recipe1', category: 'recipe', icon: 'leaf.fill', durationMinutes: 5, premium: false },
  { id: 'recipe2', category: 'recipe', icon: 'sparkles', durationMinutes: 3, premium: false },
  { id: 'recipe3', category: 'recipe', icon: 'cup.and.saucer.fill', durationMinutes: 5, premium: true },
  { id: 'activity1', category: 'activity', icon: 'figure.walk', durationMinutes: 15, premium: false },
  { id: 'activity2', category: 'activity', icon: 'figure.flexibility', durationMinutes: 8, premium: false },
  { id: 'activity3', category: 'activity', icon: 'figure.mind.and.body', durationMinutes: 10, premium: true },
  { id: 'recovery1', category: 'recovery', icon: 'wind', durationMinutes: 4, premium: false },
  { id: 'recovery2', category: 'recovery', icon: 'moon.zzz.fill', durationMinutes: 6, premium: false },
  { id: 'recovery3', category: 'recovery', icon: 'bed.double.fill', durationMinutes: 10, premium: true },
];

export function contentForCategory(category: ContentCategory): ContentItem[] {
  return RECOMMENDED_CONTENT.filter((item) => item.category === category);
}

export function findContentItem(id: string): ContentItem | undefined {
  return RECOMMENDED_CONTENT.find((item) => item.id === id);
}
