import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { usePremium } from './premium-context';

/**
 * `guard(action)` exécute `action` si l'utilisateur est premium, sinon ouvre le paywall.
 * Centralise le geste "fonctionnalité verrouillée → paywall" utilisé partout dans l'app.
 */
export function usePremiumGate() {
  const { isPremium } = usePremium();
  const router = useRouter();

  const guard = useCallback(
    (action: () => void) => {
      if (isPremium) {
        action();
        return;
      }
      router.push('/paywall');
    },
    [isPremium, router],
  );

  return { isPremium, guard };
}
