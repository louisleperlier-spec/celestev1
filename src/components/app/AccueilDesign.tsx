import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeOutLeft, LinearTransition } from 'react-native-reanimated';

import { Icon, Text } from '@/components/ui';
import { COACH_IMAGES } from '@/data/images';
import type { CoachId } from '@/data/types';
import { alpha, colors, fonts } from '@/theme';

/**
 * Pièces du design 10K « Accueil quotidien » (process-home-page, SwiftUI) portées en React Native :
 * en-tête de section (PlanHomeSectionHeader), pile de cartes sombres à balayer (PlanHomeUpgradeProCard), flamme de la série.
 * Mesures d'origine : marges de 16 pt, 36 pt entre les sections, 12 pt entre un titre et son contenu, titres de 17 pt.
 */
export const ACCUEIL = { marge: 16, entreSections: 36, sousTitre: 12 } as const;

/** Titre de section en 17 pt semi-gras, action ou légende en 13 pt grise à droite. */
export function TitreSection({ titre, action, onAction, legende }: { titre: string; action?: string; onAction?: () => void; legende?: string }) {
  return (
    <View style={styles.titre}>
      <Text weight="semibold" style={styles.titreTxt} accessibilityRole="header">
        {titre}
      </Text>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text weight="semibold" style={styles.titreAction}>
            {action}
          </Text>
        </Pressable>
      ) : legende ? (
        <Text weight="medium" style={styles.titreAction}>
          {legende}
        </Text>
      ) : null}
    </View>
  );
}

/** Série en cours : petite flamme orange et nombre de jours, dans une pastille (ProfileMiniFlameIcon + compteur). */
export function FlammeSerie({ jours, onPress }: { jours: number; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Série de ${jours} jour${jours > 1 ? 's' : ''}`} onPress={onPress} style={styles.flamme}>
      <Icon name="flame" size={22} color={jours > 0 ? colors.pink : colors.textTertiary} strokeWidth={2.2} />
      <Text weight="bold" style={styles.flammeTxt}>
        {jours}
      </Text>
    </Pressable>
  );
}

type Carte = { id: string; titre: string; sous: string; coach: CoachId; onPress?: () => void };

/** Carte sombre de la pile (148 pt, coins de 24) : titre blanc, sous-titre gris, mascotte fondue à droite, croix ronde. */
function CarteSombre({ c, grand, onFermer }: { c: Carte; grand: boolean; onFermer: () => void }) {
  return (
    <View style={styles.carte}>
      {/* Fond : nuit presque noire, halo clair en bas à gauche, reflet en diagonale (PlanHomeUpgradeProCardBackdrop). */}
      <LinearGradient colors={[colors.bgAlt, colors.surface]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={[alpha(colors.pink, 0.16), 'transparent']} start={{ x: 0.1, y: 1 }} end={{ x: 0.6, y: 0.2 }} style={StyleSheet.absoluteFill} />
      <View style={styles.marque} pointerEvents="none">
        <Image source={COACH_IMAGES[c.coach].corps} style={styles.marqueImg} contentFit="contain" />
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={c.titre} onPress={c.onPress ?? onFermer} style={styles.carteCorps}>
        <Text weight="bold" style={[styles.carteTitre, grand && styles.carteTitreGrand]} numberOfLines={2}>
          {c.titre}
        </Text>
        <Text style={styles.carteSous} numberOfLines={2}>
          {c.sous}
        </Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Masquer" onPress={onFermer} style={styles.croix} hitSlop={6}>
        <Icon name="x" size={13} color={alpha(colors.text, 0.94)} strokeWidth={2.6} />
      </Pressable>
    </View>
  );
}

const CLE = 'nea-accueil-cartes-masquees';

/**
 * Pile de 2 cartes (PlanHomeUpgradeProCard) : celle de devant se balaie vers la gauche (croix ou toucher), celle de derrière
 * dépasse de 11 pt, réduite à 94,5 % et à 72 % d'opacité, puis prend sa place. Les cartes masquées le restent (stockage local).
 */
export function PileCartes({ cartes }: { cartes: Carte[] }) {
  const [masquees, setMasquees] = useState<string[] | null>(null);
  useEffect(() => {
    void AsyncStorage.getItem(CLE)
      .then((v) => setMasquees(v ? (JSON.parse(v) as string[]) : []))
      .catch(() => setMasquees([]));
  }, []);
  if (!masquees) return null;
  const visibles = cartes.filter((c) => !masquees.includes(c.id)).slice(0, 2);
  if (!visibles.length) return null;
  const masquer = (id: string) => {
    const m = [...masquees, id];
    setMasquees(m);
    void AsyncStorage.setItem(CLE, JSON.stringify(m)).catch(() => undefined);
  };
  const [devant, derriere] = visibles;
  return (
    <Animated.View layout={LinearTransition.springify().damping(22)} style={[styles.pile, derriere && styles.pileAvecDos]}>
      {derriere && (
        <Animated.View key={derriere.id + '-dos'} layout={LinearTransition.springify().damping(22)} style={styles.dos} pointerEvents="none">
          <CarteSombre c={derriere} grand={false} onFermer={() => undefined} />
        </Animated.View>
      )}
      <Animated.View key={devant.id} exiting={FadeOutLeft.duration(260)} layout={LinearTransition.springify().damping(22)}>
        <CarteSombre c={devant} grand={!derriere} onFermer={() => masquer(devant.id)} />
      </Animated.View>
    </Animated.View>
  );
}

/** Section de l'Accueil : 36 pt au-dessus (sauf la 1re), titre facultatif, puis le contenu. */
export function SectionAccueil({
  titre,
  action,
  onAction,
  premiere,
  children,
}: {
  titre?: string;
  action?: string;
  onAction?: () => void;
  premiere?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={[styles.section, premiere && styles.sectionPremiere]}>
      {titre ? <TitreSection titre={titre} action={action} onAction={onAction} /> : null}
      {children}
    </View>
  );
}

const HAUT_CARTE = 148;
const DEPASSE = 11;

const styles = StyleSheet.create({
  titre: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: ACCUEIL.sousTitre },
  titreTxt: { fontSize: 17, lineHeight: 22, flexShrink: 1 },
  titreAction: { fontSize: 13, lineHeight: 17, color: colors.textSecondary },
  flamme: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 42, paddingHorizontal: 10, borderRadius: 21 },
  flammeTxt: { ...fonts.bold, fontSize: 17, lineHeight: 22 },
  pile: { marginTop: 18 },
  pileAvecDos: { paddingBottom: DEPASSE },
  dos: { position: 'absolute', left: 0, right: 0, top: DEPASSE, opacity: 0.72, transform: [{ scaleX: 0.945 }] },
  carte: {
    height: HAUT_CARTE,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 0.6,
    borderColor: alpha(colors.text, 0.1),
    boxShadow: `0 3px 8px ${alpha(colors.bgAlt, 0.5)}`,
  },
  marque: { position: 'absolute', right: 26, top: 20, width: HAUT_CARTE * 0.85, height: HAUT_CARTE * 0.85 },
  marqueImg: { width: HAUT_CARTE * 0.85, height: HAUT_CARTE * 0.85, opacity: 0.78 },
  carteCorps: { flex: 1, paddingLeft: 16, paddingRight: 92, paddingTop: 16, paddingBottom: 14, gap: 6 },
  carteTitre: { fontSize: 17, lineHeight: 22, letterSpacing: -0.28, color: colors.text },
  carteTitreGrand: { fontSize: 21, lineHeight: 26, letterSpacing: -0.36 },
  carteSous: { fontSize: 13, lineHeight: 17.5, color: alpha(colors.text, 0.8) },
  croix: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.bgAlt, 0.42),
    borderWidth: 0.7,
    borderColor: alpha(colors.text, 0.28),
  },
  section: { marginTop: ACCUEIL.entreSections },
  sectionPremiere: { marginTop: 8 },
});
