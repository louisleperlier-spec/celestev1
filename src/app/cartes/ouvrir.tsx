import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CarteJeu } from '@/components/app/CarteJeu';
import { EnTetePage } from '@/components/app/Catalogue';
import { Button, Glow, Text } from '@/components/ui';
import { carte, CHANCES, RARETES, type Tirage } from '@/lib/jeu';
import { ouvrirPaquet, vibrerFete } from '@/store/jeu';
import { useProfil } from '@/store/profil';
import { colors, fonts, ui } from '@/theme';

type Ouverture = NonNullable<ReturnType<typeof ouvrirPaquet>>;
/** Un paquet n'est ouvert qu'une fois, même si l'écran est redessiné. */
const ouverts = new Map<string, Ouverture>();
function ouvrirUneFois(id: string): Ouverture | null {
  const deja = ouverts.get(id);
  if (deja) return deja;
  const r = ouvrirPaquet(id);
  if (r) ouverts.set(id, r);
  return r;
}

/** Carte face cachée qui se retourne au toucher. */
function CarteRetournable({ t, largeur, visible, onRetourne }: { t: Tirage; largeur: number; visible: boolean; onRetourne: () => void }) {
  const a = useSharedValue(0);
  useEffect(() => {
    if (visible) a.value = withSpring(1, { damping: 14, stiffness: 90 });
  }, [visible, a]);
  const c = carte(t.id);
  const dos = useAnimatedStyle(() => ({ transform: [{ perspective: 800 }, { rotateY: `${interpolate(a.value, [0, 0.5, 1], [0, 90, 90])}deg` }] }));
  const face = useAnimatedStyle(() => ({ transform: [{ perspective: 800 }, { rotateY: `${interpolate(a.value, [0, 0.5, 1], [-90, -90, 0])}deg` }] }));
  return (
    <Pressable onPress={onRetourne} disabled={visible} accessibilityLabel={visible ? c.nom : 'Retourner la carte'} style={{ width: largeur }}>
      <View style={{ width: largeur, height: (largeur * 7) / 5 }}>
        {visible && c.rarete >= 2 && (
          <View style={styles.lueur} pointerEvents="none">
            <Glow width={largeur * 2} height={largeur * 2.4} intensity={c.rarete === 3 ? 0.8 : 0.5} color={ui.rarete[c.rarete]} />
          </View>
        )}
        <Animated.View style={[styles.face, dos]}>
          <CarteJeu id={t.id} largeur={largeur} dos />
        </Animated.View>
        <Animated.View style={[styles.face, face]}>
          <CarteJeu id={t.id} largeur={largeur} />
        </Animated.View>
      </View>
      <View style={[styles.etiquette, { opacity: visible ? 1 : 0 }]}>
        <Text weight="bold" numberOfLines={2} style={[styles.etiq, { color: t.nouvelle ? ui.rarete[c.rarete] : colors.textSecondary }]}>
          {t.nouvelle ? (c.rarete === 3 ? 'Légendaire ! +1 Turbo' : 'Nouvelle !') : `Double · +${t.xp} XP`}
        </Text>
      </View>
    </Pressable>
  );
}

/** Ouverture d'un paquet de cartes (1 ou 3), une carte à la fois. */
export default function OuvrirCartes() {
  const { width } = useWindowDimensions();
  const restants = useProfil((s) => s.jeu.paquets.length);
  // Le premier paquet est ouvert une seule fois, à l'arrivée sur l'écran.
  const [o] = useState(() => {
    const id = useProfil.getState().jeu.paquets[0]?.id;
    return id ? ouvrirUneFois(id) : null;
  });
  const [vus, setVus] = useState<boolean[]>([]);

  if (!o) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        <EnTetePage titre="Cartes" />
        <View style={styles.vide}>
          <Text style={styles.sous}>Aucune carte à ouvrir. Termine une séance pour en gagner une !</Text>
          <Button label="Voir ma collection" onPress={() => router.replace('/cartes')} style={styles.btn} />
        </View>
      </SafeAreaView>
    );
  }

  const n = o.tirages.length;
  const largeur = n === 1 ? Math.min(220, width * 0.55) : Math.min(120, (width - 40 - 20) / 3);
  const tout = o.tirages.every((_, k) => vus[k]);
  const retourner = (k: number) => {
    if (vus[k]) return;
    const r = carte(o.tirages[k].id).rarete;
    if (r >= 2) vibrerFete();
    setVus((v) => {
      const x = [...v];
      x[k] = true;
      return x;
    });
  };
  const meilleure = Math.max(...o.tirages.map((t) => carte(t.id).rarete));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <EnTetePage titre={n === 1 ? 'Nouvelle carte' : 'Booster'} sous={o.paquet.source} />
      <View style={styles.centre}>
        <Text style={styles.sous}>{tout ? (n === 1 ? 'Ajoutée à ta collection' : 'Ajoutées à ta collection') : n === 1 ? 'Touche la carte pour la retourner' : 'Touche les cartes pour les retourner'}</Text>
        <View style={styles.rangee}>
          {o.tirages.map((t, k) => (
            <CarteRetournable key={k} t={t} largeur={largeur} visible={!!vus[k]} onRetourne={() => retourner(k)} />
          ))}
        </View>
        {tout && (
          <View style={styles.bilan}>
            <Text weight="bold" style={styles.bilanTitre}>
              {meilleure === 3 ? 'Incroyable, une Légendaire ! 🤯' : meilleure === 2 ? 'Une Épique, bien joué ! 🔥' : o.tirages.some((t) => t.nouvelle) ? 'Ta collection grandit 💪' : 'Des doubles recyclés en XP ⚡'}
            </Text>
            {(o.xp > 0 || o.turbos > 0) && (
              <Text style={styles.sous}>
                {[o.xp > 0 ? `+${o.xp} XP` : '', o.turbos > 0 ? `+${o.turbos} Turbo x2` : ''].filter(Boolean).join(' · ')}
              </Text>
            )}
          </View>
        )}
      </View>
      <View style={styles.pied}>
        {!tout ? (
          <Button label={n === 1 ? 'Retourner' : 'Tout retourner'} onPress={() => o.tirages.forEach((_, k) => retourner(k))} />
        ) : restants > 0 ? (
          <Button label={`Ouvrir la suivante (${restants})`} iconAfter="arrow" onPress={() => router.replace({ pathname: '/cartes/ouvrir', params: { n: String(Date.now()) } })} />
        ) : (
          <Button label="Voir ma collection" iconAfter="arrow" onPress={() => router.replace('/cartes')} />
        )}
        <Text style={styles.chances}>
          Chances : {RARETES.map((r, k) => `${r} ${CHANCES[k]} %`).join(' · ')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  vide: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  sous: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, textAlign: 'center' },
  rangee: { flexDirection: 'row', gap: 10, marginTop: 24, justifyContent: 'center' },
  face: { position: 'absolute', top: 0, left: 0, backfaceVisibility: 'hidden' },
  lueur: { position: 'absolute', top: '-20%', left: '-50%', right: '-50%', bottom: '-20%', alignItems: 'center', justifyContent: 'center' },
  etiquette: { marginTop: 10, alignItems: 'center' },
  etiq: { fontSize: 12, lineHeight: 16, textAlign: 'center' },
  bilan: { marginTop: 26, alignItems: 'center', gap: 4 },
  bilanTitre: { fontSize: 20, lineHeight: 26, textAlign: 'center' },
  pied: { paddingHorizontal: 20, paddingBottom: 14, gap: 10 },
  btn: { marginTop: 18, alignSelf: 'stretch' },
  chances: { fontSize: 11, lineHeight: 15, color: colors.textSecondary, textAlign: 'center', ...fonts.regular },
});
