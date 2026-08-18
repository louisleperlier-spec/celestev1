/**
 * Fournisseur IA — interface volontairement minimale et remplaçable. Aucun SDK/fournisseur
 * n'est codé en dur : tant que `EXPO_PUBLIC_AI_PROVIDER`/`EXPO_PUBLIC_AI_API_KEY` ne sont pas
 * définis, `getAiProvider()` renvoie le stub (toujours `null`) et le Coach fonctionne à 100 %
 * sur ses textes de repli déterministes. Brancher un vrai fournisseur plus tard = écrire une
 * implémentation de `AiTextProvider` et l'ajouter au switch ci-dessous — rien d'autre ne change.
 */

export interface AiTextRequest {
  systemPrompt: string;
  userPrompt: string;
}

export interface AiTextProvider {
  /** Retourne le texte généré, ou `null` si indisponible/échec (jamais d'exception qui remonte). */
  generate(request: AiTextRequest): Promise<string | null>;
}

class StubAiProvider implements AiTextProvider {
  async generate(): Promise<string | null> {
    return null;
  }
}

let cachedProvider: AiTextProvider | null = null;

export function getAiProvider(): AiTextProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.EXPO_PUBLIC_AI_PROVIDER;
  const apiKey = process.env.EXPO_PUBLIC_AI_API_KEY;

  if (!providerName || !apiKey) {
    cachedProvider = new StubAiProvider();
    return cachedProvider;
  }

  // Aucun fournisseur réel branché pour l'instant — voir AGENTS.md "Coach IA" pour la marche à
  // suivre le jour où une clé est fournie (coût récurrent à valider avant d'activer).
  cachedProvider = new StubAiProvider();
  return cachedProvider;
}
