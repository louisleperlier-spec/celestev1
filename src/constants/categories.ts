import type { Ionicons } from '@expo/vector-icons';
import type { CategoryId } from '@/lib/types';

export type Preset = {
  id: string;
  label: string;
  points: 5 | 10 | 15 | 20;
  hint?: string;
};

export type CategoryMeta = {
  id: CategoryId;
  label: string;
  shortLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  colorLight: string;
  question: string;
  presets: Preset[];
};

export const CATEGORY_COLORS: Record<CategoryId, { color: string; light: string }> = {
  sleep: { color: '#6366F1', light: '#EEF0FE' },
  sport: { color: '#F97316', light: '#FEF0E4' },
  discipline: { color: '#0EA5E9', light: '#E6F6FE' },
  nutrition: { color: '#16A34A', light: '#E6F7EC' },
  mindset: { color: '#D946EF', light: '#FBEBFC' },
};

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'sleep',
    label: 'Sommeil',
    shortLabel: 'Sommeil',
    icon: 'moon',
    color: CATEGORY_COLORS.sleep.color,
    colorLight: CATEGORY_COLORS.sleep.light,
    question: 'Combien d’heures as-tu dormi ?',
    presets: [
      { id: 'sleep-6', label: '6 h', points: 5 },
      { id: 'sleep-7', label: '7 h', points: 10 },
      { id: 'sleep-8', label: '8 h', points: 15 },
      { id: 'sleep-9', label: '9 h ou +', points: 20 },
    ],
  },
  {
    id: 'sport',
    label: 'Sport',
    shortLabel: 'Sport',
    icon: 'barbell',
    color: CATEGORY_COLORS.sport.color,
    colorLight: CATEGORY_COLORS.sport.light,
    question: 'Combien de temps d’activité physique ?',
    presets: [
      { id: 'sport-15', label: '15 min', points: 5 },
      { id: 'sport-30', label: '30 min', points: 10 },
      { id: 'sport-45', label: '45 min', points: 15 },
      { id: 'sport-60', label: '1 h ou +', points: 20 },
    ],
  },
  {
    id: 'discipline',
    label: 'Discipline',
    shortLabel: 'Discipline',
    icon: 'flash',
    color: CATEGORY_COLORS.discipline.color,
    colorLight: CATEGORY_COLORS.discipline.light,
    question: 'Combien de temps de deep work / sans écran ?',
    presets: [
      { id: 'discipline-30', label: '30 min focus', points: 5 },
      { id: 'discipline-60', label: '1 h focus', points: 10 },
      { id: 'discipline-120', label: '2 h focus', points: 15 },
      { id: 'discipline-noscroll', label: 'Journée sans réseaux', points: 20 },
    ],
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    shortLabel: 'Nutrition',
    icon: 'nutrition',
    color: CATEGORY_COLORS.nutrition.color,
    colorLight: CATEGORY_COLORS.nutrition.light,
    question: 'Qu’as-tu fait pour ton alimentation ?',
    presets: [
      { id: 'nutrition-water', label: 'Bien hydraté', points: 5 },
      { id: 'nutrition-meal', label: 'Repas équilibré', points: 10 },
      { id: 'nutrition-nosugar', label: 'Zéro sucre ajouté', points: 15 },
      { id: 'nutrition-perfect', label: 'Journée nickel', points: 20 },
    ],
  },
  {
    id: 'mindset',
    label: 'Mindset',
    shortLabel: 'Mindset',
    icon: 'sparkles',
    color: CATEGORY_COLORS.mindset.color,
    colorLight: CATEGORY_COLORS.mindset.light,
    question: 'Qu’as-tu fait pour ta tête ?',
    presets: [
      { id: 'mindset-gratitude', label: 'Gratitude (2 min)', points: 5 },
      { id: 'mindset-read', label: 'Lecture 20 min', points: 10 },
      { id: 'mindset-meditate', label: 'Méditation 10 min', points: 15 },
      { id: 'mindset-journal', label: 'Journaling complet', points: 20 },
    ],
  },
];

export function getCategory(id: CategoryId): CategoryMeta {
  const found = CATEGORIES.find((c) => c.id === id);
  if (!found) throw new Error(`Catégorie inconnue : ${id}`);
  return found;
}
