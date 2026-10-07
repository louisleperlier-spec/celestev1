import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { Appui, BigNumber, Button, Icon, Text } from '@/components/ui';
import { DECO_IMAGES } from '@/data';
import { useProfil } from '@/store/profil';
import { SONS_NUIT, useSons } from '@/store/sons';
import { alpha, colors, ui } from '@/theme';

const ARRETS: (number | null)[] = [15, 30, 45, 60, null];

/** Curseur de volume : toucher ou glisser sur la piste. */
function Volume({ v, onChange }: { v: number; onChange: (v: number) => void }) {
  const [largeur, setLargeur] = useState(1);
  const toucher = (e: GestureResponderEvent) => onChange(e.nativeEvent.locationX / largeur);
  return (
    <View
      style={styles.piste}
      onLayout={(e) => setLargeur(Math.max(1, e.nativeEvent.layout.width))}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={toucher}
      onResponderMove={toucher}
      accessibilityRole="adjustable"
      accessibilityLabel="Volume"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}
    >
      <View style={styles.pisteFond} />
      <View style={[styles.pistePleine, { width: `${v * 100}%` }]} />
      <View style={[styles.bouton, { left: `${v * 100}%` }]} />
    </View>
  );
}

/** Mode nuit (maquette de l'utilisateur) : Axel qui dort, l'heure en grand, le réveil, le son apaisant choisi et son arrêt, terminer la nuit. */
export default function Nuit() {
  const p = useProfil(useShallow((s) => ({ reveil: s.reveil, nuitDebut: s.nuitDebut })));
  const sons = useSons();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(t);
  }, []);

  const [choix, setChoix] = useState(1);
  const resteArret = sons.arretA ? Math.max(0, Math.ceil((sons.arretA - +now) / 60000)) : null;
  const cycle = () => {
    const i = (choix + 1) % ARRETS.length;
    setChoix(i);
    sons.programmerArret(ARRETS[i]);
  };

  const terminer = () => {
    const debut = p.nuitDebut;
    sons.pause();
    useProfil.getState().terminerNuit();
    // Une vraie nuit (3 h ou plus) : on la note tout de suite (coucher prérempli par Apple Santé ou à la main).
    if (debut && Date.now() - debut >= 3 * 3600_000) router.replace({ pathname: '/nuits', params: { ajout: '1' } });
    else if (router.canGoBack()) router.back();
    else router.navigate('/sommeil');
  };

  return (
    <View style={styles.root}>
      <View style={styles.haut}>
        <Image source={DECO_IMAGES.nuit} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient colors={[alpha(colors.bg, 0), colors.bg]} locations={[0.55, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      </View>
      <SafeAreaView style={styles.contenu} edges={['bottom']}>
        <View style={styles.centre}>
          <BigNumber value={`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`} size={84} />
          <Text style={styles.reveil}>{p.reveil.actif ? `Réveil à ${p.reveil.h}` : 'Pas de réveil programmé'}</Text>
        </View>

        <View style={styles.son}>
          <View style={styles.sonIc}>
            <Icon name="moon" size={24} color={colors.text} />
          </View>
          <View style={styles.flex}>
            <Text weight="semibold" style={styles.sonNom}>
              {SONS_NUIT[sons.son].nom}
            </Text>
            <Volume v={sons.volume} onChange={sons.regler} />
          </View>
          <Appui accessibilityRole="button" accessibilityLabel={sons.joue ? 'Pause' : 'Lecture'} onPress={() => (sons.joue ? sons.pause() : sons.jouer())} style={styles.lecture}>
            <Icon name={sons.joue ? 'pause' : 'play'} size={20} color={colors.text} />
          </Appui>
        </View>
        <Appui accessibilityRole="button" accessibilityLabel="Arrêt programmé" onPress={cycle} style={styles.arret}>
          <Text style={styles.petit}>{resteArret != null ? `Arrêt dans ${resteArret} min` : 'Sans arrêt programmé'}</Text>
        </Appui>

        <View style={styles.boutons}>
          <Button label="Modifier le réveil" variant="dark" onPress={() => router.push('/reveil')} />
          <Appui accessibilityRole="button" onPress={terminer} style={styles.terminer}>
            <Text weight="semibold" style={styles.terminerTxt}>
              Terminer la nuit
            </Text>
          </Appui>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  haut: { height: '42%' },
  contenu: { flex: 1, paddingHorizontal: 20, marginTop: -40 },
  flex: { flex: 1, minWidth: 0 },
  centre: { alignItems: 'center', gap: 4 },
  reveil: { fontSize: 20, lineHeight: 26, color: colors.textSecondary },
  son: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 28,
    padding: 16,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sonIc: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.iconBg },
  sonNom: { fontSize: 16, lineHeight: 21, marginBottom: 10 },
  piste: { height: 24, justifyContent: 'center' },
  pisteFond: { position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2, backgroundColor: ui.iconBg },
  pistePleine: { position: 'absolute', left: 0, height: 4, borderRadius: 2, backgroundColor: colors.pink },
  bouton: { position: 'absolute', width: 18, height: 18, borderRadius: 9, marginLeft: -9, backgroundColor: colors.text },
  lecture: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.iconBg },
  arret: { alignSelf: 'center', padding: 10 },
  petit: { fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  boutons: { marginTop: 'auto', gap: 12, paddingBottom: 12 },
  terminer: { height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border2 },
  terminerTxt: { fontSize: 16, lineHeight: 20, color: colors.textSecondary },
});
