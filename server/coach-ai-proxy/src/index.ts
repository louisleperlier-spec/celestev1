import { COACH_AI_SYSTEM_PROMPT } from './system-prompt';

/**
 * Proxy Cloudflare Worker entre l'app Lume et l'API Gemini.
 *
 * Raison d'être : la clé Gemini ne doit JAMAIS vivre dans le bundle Expo (une app distribuée
 * peut être décompilée). Ce Worker la détient côté serveur (secret Cloudflare) et c'est le seul
 * endroit qui parle à Gemini. Le client n'envoie que des données non identifiantes déjà mises en
 * forme par `src/features/coach/ai-copy.ts` (chiffres d'hydratation, score, heure — jamais de nom,
 * email ou identifiant).
 *
 * `X-Lume-Client` est un déterrent léger (secret partagé, visible si l'app est décompilée) contre
 * l'abus anonyme du endpoint — PAS une authentification forte. Une vraie protection nécessiterait
 * de l'attestation d'app (App Check / App Attest), hors scope ici.
 */

export interface Env {
  GEMINI_API_KEY: string;
  CLIENT_TOKEN?: string;
}

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_USER_PROMPT_LENGTH = 2000;
const GEMINI_TIMEOUT_MS = 10000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Lume-Client',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/coach-copy') {
      return json({ error: 'not_found' }, 404);
    }

    if (env.CLIENT_TOKEN && request.headers.get('X-Lume-Client') !== env.CLIENT_TOKEN) {
      return json({ error: 'unauthorized' }, 401);
    }

    let body: { userPrompt?: unknown };
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid_json' }, 400);
    }

    const userPrompt = body.userPrompt;
    if (typeof userPrompt !== 'string' || userPrompt.length === 0 || userPrompt.length > MAX_USER_PROMPT_LENGTH) {
      return json({ error: 'invalid_user_prompt' }, 400);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    try {
      const geminiResponse = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: COACH_AI_SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 120 },
        }),
        signal: controller.signal,
      });

      if (geminiResponse.status === 429) {
        return json({ error: 'rate_limited' }, 429);
      }
      if (!geminiResponse.ok) {
        return json({ error: 'gemini_error' }, 502);
      }

      const data = (await geminiResponse.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!text) {
        return json({ error: 'empty_response' }, 502);
      }

      return json({ text });
    } catch {
      return json({ error: 'upstream_failure' }, 502);
    } finally {
      clearTimeout(timeout);
    }
  },
};
