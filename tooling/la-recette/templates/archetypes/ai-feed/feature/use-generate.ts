// Archétype ai-feed — orchestration d'UNE génération : appelle l'IA, GARDE le résultat,
// rafraîchit le feed. Expose `loading` / `error` pour l'écran de composition.
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { useAuth } from '@/features/auth/auth-context';

import * as repo from './creations-repository';
import { generate } from './generate';
import { type GenerateInput } from './types';

export function useGenerate() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const uid = user?.id ?? 'anon';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const run = useCallback(
    async (input: GenerateInput): Promise<boolean> => {
      setLoading(true);
      setError(undefined);
      try {
        const r = await generate(input);
        if (r.refused || !r.text) {
          setError(r.refusalReason || 'refused');
          return false;
        }
        await repo.saveCreation({ prompt: input.prompt, result: r.text });
        await qc.invalidateQueries({ queryKey: ['creations', uid] });
        return true;
      } catch (e) {
        // Codes métier possibles : rate_limited, quota_exhausted, ai_error, network_error…
        setError(e instanceof Error ? e.message : 'unknown_error');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [qc, uid],
  );

  return { run, loading, error };
}
