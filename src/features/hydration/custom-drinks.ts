import AsyncStorage from '@react-native-async-storage/async-storage';

import { generateId } from '@/lib/id';

import { CustomDrink } from './types';

/** Boissons personnalisées (premium) — définition réutilisable, indépendante des entrées loggées. */

const CUSTOM_DRINKS_KEY = 'lume.customDrinks.v1';

export async function listCustomDrinks(): Promise<CustomDrink[]> {
  const raw = await AsyncStorage.getItem(CUSTOM_DRINKS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveIndex(drinks: readonly CustomDrink[]): Promise<void> {
  await AsyncStorage.setItem(CUSTOM_DRINKS_KEY, JSON.stringify(drinks));
}

export async function addCustomDrink(input: {
  name: string;
  hydrationFactor: number;
  lowersQuality: boolean;
}): Promise<CustomDrink> {
  const drinks = await listCustomDrinks();
  const drink: CustomDrink = { id: generateId('drink'), ...input };
  await saveIndex([...drinks, drink]);
  return drink;
}

export async function deleteCustomDrink(id: string): Promise<void> {
  const drinks = await listCustomDrinks();
  await saveIndex(drinks.filter((d) => d.id !== id));
}
