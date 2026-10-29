import { router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { makeMutable, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appui, Icon, Text, type IconName } from '@/components/ui';
import { sportParId } from '@/lib/sports';
import { useSportLive } from '@/store/sportLive';

import { IconeSport } from './IconeSport';
import { alpha, colors, ui } from '@/theme';

type Chemin = '/accueil' | '/ligue' | '/programme' | '/velo' | '/rando' | '/yoga' | '/progres' | '/profil' | '/coach';
type Onglet = { label: string; icon: IconName; href: Chemin; ecrans: Chemin[] };

/**
 * 4 onglets : Accueil (+ Profil), Programme (Programme, Calendrier, Sorties, Randonnée), Progrès (+ Ligue) et Coach.
 * Les écrans gardent leurs adresses.
 */
const ONGLETS: Onglet[] = [
  { label: 'Accueil', icon: 'home', href: '/accueil', ecrans: ['/accueil', '/profil'] },
  { label: 'Programme', icon: 'cal', href: '/programme', ecrans: ['/programme', '/velo', '/rando', '/yoga'] },
  { label: 'Progrès', icon: 'chart', href: '/progres', ecrans: ['/progres', '/ligue'] },
  { label: 'Coach', icon: 'bulle', href: '/coach', ecrans: ['/coach'] },
];

/**
 * Mesures du design 10K « Navigation principale » (ProcessIGTabMetrics) : barre de 50 pt dans une capsule à 4 pt de marge,
 * 20 pt sur les côtés, 10 pt entre la capsule et le bouton rond, icônes de 24 pt ; réduite jusqu'à 85 % sur 100 pt de défilement.
 */
const HAUT = 50;
const MARGE = 4;
const EXT = HAUT + MARGE * 2;
const DISTANCE = 100;
const ECHELLE_MIN = 0.85;
const RESSORT = { damping: 26, stiffness: 300, mass: 0.7 };

/** Réduction de la barre (0 ouverte, 1 réduite), partagée entre les écrans qui défilent et la barre. */
const reduction = makeMutable(0);

/**
 * À brancher sur le ScrollView principal d'un onglet (`Animated.ScrollView onScroll={…} scrollEventThrottle={16}`) :
 * descendre réduit la barre au fil du doigt, remonter la rouvre (comme Instagram) ; en haut de page elle est toujours ouverte.
 */
export function useDefilementOnglets() {
  const avant = useSharedValue(0);
  return useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      const dy = y - avant.value;
      avant.value = y;
      const peutDefiler = e.contentSize.height > e.layoutMeasurement.height + DISTANCE;
      if (y <= 0 || !peutDefiler) reduction.value = 0;
      else reduction.value = Math.min(1, Math.max(0, reduction.value + dy / DISTANCE));
    },
    onEndDrag: () => {
      // Au lâcher, la barre se range franchement d'un côté ou de l'autre.
      reduction.value = withSpring(reduction.value > 0.5 ? 1 : 0, RESSORT);
    },
  });
}

/** Sport en direct : bandeau au-dessus des onglets (sport, chrono, BPM), toucher → écran en direct. */
function SportEnCours() {
  const { run, sport, el, bpm, paused } = useSportLive();
  const sp = sportParId(sport ?? undefined);
  if (!run || !sp) return null;
  return (
    <Appui accessibilityRole="button" accessibilityLabel={`${sp.nom} en cours`} onPress={() => router.push('/sport-en-cours')} style={styles.direct}>
      <IconeSport glyphe={sp.icone} size={20} />
      <Text weight="semibold" style={styles.directTxt} numberOfLines={1}>
        {sp.nom} {paused ? 'en pause' : 'en cours'} · {Math.floor(el / 60)}:{String(el % 60).padStart(2, '0')}
      </Text>
      <Icon name="heart" size={16} color={colors.pink} strokeWidth={2.2} />
      <Text weight="semibold" style={styles.directTxt}>
        {Math.round(bpm)}
      </Text>
    </Appui>
  );
}

/**
 * Barre d'onglets du design 10K « Navigation principale » : capsule flottante d'icônes seules, pastille de sélection qui glisse
 * d'un onglet à l'autre, et à côté un bouton rond « Ajouter une activité » (à la place du scan de repas de Process).
 * Toucher la barre la rouvre si elle était réduite.
 */
export function TabBar() {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const actif = Math.max(
    0,
    ONGLETS.findIndex((o) => o.ecrans.some((e) => path.startsWith(e))),
  );
  const [largeur, setLargeur] = useState(0);
  const case_ = largeur / ONGLETS.length;
  const x = useSharedValue(actif);

  useEffect(() => {
    x.set(withSpring(actif, RESSORT));
    // Changer d'onglet rouvre la barre.
    reduction.set(withTiming(0, { duration: 250 }));
  }, [actif, x]);

  const pastille = useAnimatedStyle(() => ({ width: case_, transform: [{ translateX: x.value * case_ }] }));
  const echelle = useAnimatedStyle(() => ({ transform: [{ scale: 1 - reduction.value * (1 - ECHELLE_MIN) }] }));
  const rouvrir = () => reduction.set(withTiming(0, { duration: 250 }));

  return (
    <View style={[styles.zone, { paddingBottom: Math.max(10, insets.bottom - 8) }]}>
      <SportEnCours />
      <Animated.View style={[styles.rangee, echelle, { transformOrigin: 'bottom' }]}>
        <View
          style={styles.capsule}
          accessibilityRole="tablist"
          onTouchStart={rouvrir}
          onLayout={(e: LayoutChangeEvent) => setLargeur(e.nativeEvent.layout.width - MARGE * 2)}
        >
          {largeur > 0 && <Animated.View pointerEvents="none" style={[styles.pastille, pastille]} />}
          {ONGLETS.map((o, i) => {
            const on = i === actif;
            return (
              <Pressable
                key={o.label}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={o.label}
                style={styles.tab}
                onPress={() => router.navigate(o.href)}
              >
                <Icon name={o.icon} size={24} color={on ? colors.pink : colors.textSecondary} strokeWidth={on ? 2.3 : 1.9} />
              </Pressable>
            );
          })}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajouter une activité"
          accessibilityHint="Ouvre l'ajout d'une séance libre ou d'un autre sport"
          onPress={() => {
            rouvrir();
            router.push('/ajouter');
          }}
          style={({ pressed }) => [styles.rond, pressed && styles.presse]}
        >
          <Icon name="plus" size={24} color={colors.text} strokeWidth={2.2} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: { paddingHorizontal: 20, paddingTop: 6, backgroundColor: colors.bg },
  rangee: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  capsule: {
    flex: 1,
    flexDirection: 'row',
    height: EXT,
    padding: MARGE,
    borderRadius: EXT / 2,
    backgroundColor: ui.barre,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border2,
    boxShadow: `0 8px 30px ${alpha(colors.bgAlt, 0.6)}`,
  },
  pastille: { position: 'absolute', top: MARGE, left: MARGE, height: HAUT, borderRadius: HAUT / 2, backgroundColor: alpha(colors.text, 0.12) },
  tab: { flex: 1, height: HAUT, alignItems: 'center', justifyContent: 'center' },
  rond: {
    width: EXT + 4,
    height: EXT + 4,
    borderRadius: (EXT + 4) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.barre,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border2,
    boxShadow: `0 8px 30px ${alpha(colors.bgAlt, 0.6)}`,
  },
  presse: { transform: [{ scale: 0.94 }] },
  direct: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
    backgroundColor: alpha(colors.pink, 0.14),
    borderWidth: 1,
    borderColor: alpha(colors.pink, 0.4),
  },
  directTxt: { fontSize: 14, lineHeight: 18, color: colors.text, flexShrink: 1 },
});
