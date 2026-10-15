import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** Taille au moment de l'appui (0,97 = la carte s'enfonce légèrement). */
  echelle?: number;
};

/** Propriétés de placement gardées sur la zone touchable (le reste du style va à la vue animée, qui la remplit). */
const PLACEMENT = new Set([
  'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'width', 'minWidth', 'maxWidth', 'height', 'minHeight', 'maxHeight', 'alignSelf',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical',
  'position', 'top', 'bottom', 'left', 'right', 'zIndex',
]);

function separer(style: StyleProp<ViewStyle>): [ViewStyle, ViewStyle] {
  const plat = (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>;
  const dehors: Record<string, unknown> = {};
  const dedans: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(plat)) (PLACEMENT.has(k) ? dehors : dedans)[k] = v;
  // Taille donnée dehors : la vue animée remplit la zone.
  if ('flex' in dehors || 'height' in dehors || 'flexGrow' in dehors) dedans.flexGrow = 1;
  return [dehors as ViewStyle, dedans as ViewStyle];
}

/**
 * Zone touchable qui s'enfonce au doigt et rebondit en la relâchant (ressort Reanimated, sur le fil d'interface).
 * Remplace `Pressable` sur les cartes et les lignes d'activité ; le style s'applique à la vue animée.
 */
export function Appui({ style, children, echelle = 0.97, onPressIn, onPressOut, ...reste }: Props) {
  const [dehors, dedans] = separer(style);
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: 0.85 + 0.15 * ((s.value - echelle) / (1 - echelle)) }));
  return (
    <Pressable
      {...reste}
      style={dehors}
      onPressIn={(e: GestureResponderEvent) => {
        s.set(withTiming(echelle, { duration: 90 }));
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        s.set(withSpring(1, { damping: 13, stiffness: 280, mass: 0.6 }));
        onPressOut?.(e);
      }}
    >
      <Animated.View style={[dedans, anim]}>{children}</Animated.View>
    </Pressable>
  );
}
