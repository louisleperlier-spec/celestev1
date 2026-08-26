// Archétype ai-feed — appel client vers l'Edge Function `generate`.
// La clé IA vit UNIQUEMENT côté serveur (secret de la fonction) : le client n'invoque que
// la fonction, jamais l'API IA directement. (Tu peux déplacer ce fichier dans
// `src/services/ai/` pour coller à l'archi en couches — garde juste l'import à jour.)
import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase/client';

import { type GenerateInput, type GenerateResult } from './types';

/** Erreurs métier relayées telles quelles depuis l'edge function :
 *  `rate_limited`, `quota_exhausted`, `bad_request`, `ai_error`, `parse_error`. */
export async function generate(input: GenerateInput): Promise<GenerateResult> {
  const { data, error } = await supabase.functions.invoke<GenerateResult>('generate', {
    body: input,
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      let code = 'ai_error';
      try {
        const body = (await error.context.json()) as { error?: string };
        if (typeof body?.error === 'string') code = body.error;
      } catch {
        // réponse sans corps JSON — on garde le code générique
      }
      throw new Error(code);
    }
    throw new Error('network_error');
  }
  if (!data) throw new Error('ai_error');
  return data;
}
