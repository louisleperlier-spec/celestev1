import { useMemo } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { NightSky } from '@/constants/theme';

type Star = { top: `${number}%`; left: `${number}%`; size: number; opacity: number };

function useStars(count: number): Star[] {
  return useMemo(() => {
    // Positions pseudo-aléatoires mais stables (pas de re-render qui fait "sauter" le ciel).
    let seed = 42;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    return Array.from({ length: count }, () => ({
      top: `${Math.round(rand() * 92)}%`,
      left: `${Math.round(rand() * 96)}%`,
      size: 1 + Math.round(rand() * 2),
      opacity: 0.25 + rand() * 0.55,
    }));
  }, [count]);
}

/**
 * Fond "ciel nocturne" plein écran — utilisé uniquement sur les écrans signature
 * (Accueil, Onboarding, Paywall). Ailleurs on garde une surface solide (lisibilité).
 */
export function NightSkyBackdrop({ starCount = 46 }: { starCount?: number }) {
  const scheme = useColorScheme();
  const mode = scheme === 'dark' ? 'dark' : 'light';
  const stars = useStars(starCount);

  return (
    <View style={[StyleSheet.absoluteFill, styles.noPointerEvents]}>
      <LinearGradient
        colors={NightSky[mode]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {mode === 'dark' &&
        stars.map((star, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              borderRadius: star.size,
              backgroundColor: '#FFFFFF',
              opacity: star.opacity,
            }}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  noPointerEvents: { pointerEvents: 'none' },
});
