/** Stockage de la session Supabase sur iPhone et Android : localStorage fourni par expo-sqlite. */
import 'expo-sqlite/localStorage/install';

export const stockageSession = localStorage;
