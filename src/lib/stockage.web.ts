/**
 * Sur le web (tests dans le navigateur), le localStorage du navigateur suffit.
 * Pendant le rendu côté serveur (pas de window), Supabase garde la session en mémoire.
 */
export const stockageSession = typeof window !== 'undefined' ? window.localStorage : undefined;
