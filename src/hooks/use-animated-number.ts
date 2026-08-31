import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

/**
 * Anime un nombre vers `target` (count-up de la jauge, remplissage des barres…).
 * Renvoie directement la valeur courante à consommer dans le rendu. Respecte
 * "Réduire les animations" : dans ce cas la valeur saute directement à sa cible.
 */
export function useAnimatedNumber(target: number, duration = 700): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(target);
  const [animated] = useState(() => new Animated.Value(target));
  const previousRef = useRef(target);

  useEffect(() => {
    if (reduced) return;
    animated.setValue(previousRef.current);
    const id = animated.addListener(({ value: v }) => setValue(v));
    Animated.timing(animated, {
      toValue: target,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    previousRef.current = target;
    return () => animated.removeListener(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, reduced]);

  return reduced ? target : value;
}
