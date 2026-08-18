/**
 * Fournisseur IA — interface volontairement minimale et remplaçable.
 *
 * La clé du vrai fournisseur (Gemini) ne vit JAMAIS ici ni dans aucun fichier client : une app
 * Expo distribuée peut être décompilée, et une clé API dans le bundle serait extraite en
 * quelques minutes. `BackendAiProvider` appelle plutôt un petit backend (Cloudflare Worker,
 * voir `server/coach-ai-proxy/`) qui détient la clé côté serveur. `EXPO_PUBLIC_*` ci-dessous ne
 * contient que l'URL de ce backend et un jeton faible anti-abus — jamais un secret fort.
 *
 * Sans `EXPO_PUBLIC_COACH_BACKEND_URL` configuré, `getAiProvider()` renvoie le stub (toujours
 * `null`) et le Coach fonctionne à 100 % sur ses textes de repli déterministes.
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

const REQUEST_TIMEOUT_MS = 8000;

/**
 * `request.systemPrompt` n'est volontairement PAS envoyé au backend : le Worker applique son
 * propre prompt système strict, codé en dur côté serveur, pour qu'un client modifié ne puisse
 * pas le contourner. Voir `server/coach-ai-proxy/src/index.ts`.
 */
class BackendAiProvider implements AiTextProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly clientToken?: string,
  ) {}

  async generate(request: AiTextRequest): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}/coach-copy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.clientToken ? { 'X-Lume-Client': this.clientToken } : {}),
        },
        body: JSON.stringify({ userPrompt: request.userPrompt }),
        signal: controller.signal,
      });

      if (!response.ok) return null;

      const data = (await response.json()) as { text?: unknown };
      return typeof data.text === 'string' && data.text.trim().length > 0 ? data.text.trim() : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}

let cachedProvider: AiTextProvider | null = null;

export function getAiProvider(): AiTextProvider {
  if (cachedProvider) return cachedProvider;

  const backendUrl = process.env.EXPO_PUBLIC_COACH_BACKEND_URL;
  const clientToken = process.env.EXPO_PUBLIC_COACH_CLIENT_TOKEN;

  cachedProvider = backendUrl ? new BackendAiProvider(backendUrl, clientToken) : new StubAiProvider();
  return cachedProvider;
}
