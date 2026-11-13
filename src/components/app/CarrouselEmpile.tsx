import type { ReactNode } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * Carrousel en pile du design Process « Transitions au scroll » (ScrollInteraction, SwiftUI, variante « Type 3 »), porté en
 * React Native sans module natif. Mécanique gardée : cartes de 220 × 330, 12 pt d'écart, carte centrée (`safeAreaPadding`
 * de (largeur − 220) / 2), aimantation carte par carte, cartes suivantes empilées derrière la carte du centre (`offset -minX`),
 * cartes passées qui sortent à vitesse et demie (`minX / 2`), et pour chaque carte hors du centre : échelle 0,9 depuis le bas,
 * montée de 10 pt, rotation de 5° × la phase autour du coin bas droit ; les premières cartes passent devant (`zIndex(-index)`).
 * Écart assumé : le flou de 2 pt de SwiftUI n'a pas d'équivalent animé en React Native ; il est omis.
 * Mouvement réduit (réglage d'accessibilité) : carrousel simple, sans pile ni rotation.
 */
export const CARTE_L = 220;
export const CARTE_H = 330;
const ECART = 12;
const PAS = CARTE_L + ECART;

type Props<T> = {
  donnees: readonly T[];
  cle: (x: T) => string;
  rendu: (x: T, i: number) => ReactNode;
  hauteur?: number;
  /** Marge latérale de l'écran parent : le carrousel la reprend pour couvrir toute la largeur. */
  bord?: number;
};

export function CarrouselEmpile<T>({ donnees, cle, rendu, hauteur = CARTE_H, bord = 16 }: Props<T>) {
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);
  const reduit = useReducedMotion();
  const defile = useAnimatedScrollHandler((e) => {
    x.value = e.contentOffset.x;
  });
  const marge = Math.max(16, (width - CARTE_L) / 2);
  return (
    <Animated.ScrollView
      horizontal
      onScroll={defile}
      scrollEventThrottle={16}
      showsHorizontalScrollIndicator={false}
      snapToInterval={PAS}
      decelerationRate="fast"
      disableIntervalMomentum
      // Équivalent de `scrollClipDisabled` : les cartes inclinées débordent sans être coupées.
      style={[styles.zone, { height: hauteur + 24, marginHorizontal: -bord }]}
      contentContainerStyle={[styles.rangee, { paddingHorizontal: marge }]}
    >
      {donnees.map((d, i) => (
        <Carte key={cle(d)} i={i} n={donnees.length} x={x} reduit={reduit} hauteur={hauteur}>
          {rendu(d, i)}
        </Carte>
      ))}
    </Animated.ScrollView>
  );
}

function Carte({ i, n, x, reduit, hauteur, children }: { i: number; n: number; x: SharedValue<number>; reduit: boolean; hauteur: number; children: ReactNode }) {
  // Déplacement horizontal (minX) : 0 pour la carte au centre, > 0 à droite, < 0 à gauche.
  const pile = useAnimatedStyle(() => {
    if (reduit) return {};
    const minX = i * PAS - x.value;
    return { transform: [{ translateX: minX < 0 ? minX / 2 : -minX }] };
  });
  // Phase de -1 (sortie à gauche) à 1 (entrée à droite), 0 au centre.
  const rotation = useAnimatedStyle(() => {
    if (reduit) return {};
    const phase = interpolate(i * PAS - x.value, [-PAS, 0, PAS], [-1, 0, 1], 'clamp');
    return { transform: [{ rotate: `${phase * 5}deg` }] };
  });
  const echelle = useAnimatedStyle(() => {
    if (reduit) return {};
    const p = Math.abs(interpolate(i * PAS - x.value, [-PAS, 0, PAS], [-1, 0, 1], 'clamp'));
    return { transform: [{ translateY: -10 * p }, { scale: 1 - 0.1 * p }] };
  });
  return (
    <Animated.View style={[styles.carte, { height: hauteur, zIndex: n - i }, pile]}>
      <Animated.View style={[styles.plein, styles.origineCoin, rotation]}>
        <Animated.View style={[styles.plein, styles.origineBas, echelle]}>{children}</Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Dans le navigateur, un défilement non coupé fait défiler toute la page : coupé là seulement.
  zone: { overflow: Platform.OS === 'web' ? 'hidden' : 'visible' },
  rangee: { gap: ECART, alignItems: 'flex-end', paddingBottom: 8 },
  carte: { width: CARTE_L },
  plein: { flex: 1 },
  // Ancres de SwiftUI : rotation autour du coin bas droit, échelle depuis le bas.
  origineCoin: { transformOrigin: 'right bottom' },
  origineBas: { transformOrigin: 'center bottom' },
});

/** Habillage d'une carte : coins de 25 comme le design, contenu coupé. */
export function CarteEmpilee({ children }: { children: ReactNode }) {
  return <View style={carte.fond}>{children}</View>;
}

const carte = StyleSheet.create({
  fond: { flex: 1, borderRadius: 25, overflow: 'hidden' },
});
