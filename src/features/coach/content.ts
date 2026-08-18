/**
 * Contenu "Recommandé pour toi" — un aperçu volontairement court (2-3 cartes par catégorie),
 * pas un catalogue. Les textes réels (titre/sous-titre/corps) vivent en i18n sous
 * `coach.content.<id>.*` ; ce module ne porte que la structure et le verrouillage premium.
 * Les 3 recettes sont inspirées de vraies recettes trouvées en ligne (concombre/avocat/saumon —
 * réécrites dans nos mots, pas copiées) ; activité/récupération restent des idées génériques.
 */

export type ContentCategory = 'recipe' | 'activity' | 'recovery';

export type ContentTag = 'antiBloating' | 'energy' | 'light' | 'short' | 'outdoor' | 'breathing' | 'sleep';

export interface ContentItem {
  id: string;
  category: ContentCategory;
  durationMinutes: number;
  premium: boolean;
  tags: ContentTag[];
}

export const RECOMMENDED_CONTENT: ContentItem[] = [
  { id: 'recipe1', category: 'recipe', durationMinutes: 20, premium: false, tags: ['energy'] },
  { id: 'recipe2', category: 'recipe', durationMinutes: 10, premium: false, tags: ['antiBloating', 'light'] },
  { id: 'recipe3', category: 'recipe', durationMinutes: 10, premium: true, tags: ['antiBloating', 'energy'] },
  { id: 'activity1', category: 'activity', durationMinutes: 15, premium: false, tags: ['short', 'outdoor'] },
  { id: 'activity2', category: 'activity', durationMinutes: 8, premium: false, tags: ['short'] },
  { id: 'activity3', category: 'activity', durationMinutes: 10, premium: true, tags: ['short'] },
  { id: 'recovery1', category: 'recovery', durationMinutes: 4, premium: false, tags: ['breathing', 'short'] },
  { id: 'recovery2', category: 'recovery', durationMinutes: 6, premium: false, tags: ['sleep'] },
  { id: 'recovery3', category: 'recovery', durationMinutes: 10, premium: true, tags: ['sleep', 'breathing'] },
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
