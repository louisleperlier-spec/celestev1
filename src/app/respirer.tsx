import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Appui, BigNumber, Button, Icon, Text, toast } from '@/components/ui';
import { DECO_IMAGES } from '@/data';
import { journeeDu } from '@/lib/journee';
import { momentPause, retirer } from '@/store/moments';
import { useProfil } from '@/store/profil';
import { alpha, colors, ui } from '@/theme';

const INSPIRE = 4;
const EXPIRE = 6;

/**
 * « Une pause pour toi » (maquette de l'utilisateur) : respiration guidée d'1 min avec Axel, inspire 4 s / expire 6 s,
 * compte à rebours aussi sur l'écran verrouillé (Activité en direct, build 26+) ; coche « Prends 2 min pour souffler ».
 */
export default function Respirer() {
  // ?min=3 depuis la routine du soir ; 1 min par défaut.
  const { min } = useLocalSearchParams<{ min?: string }>();
  const DUREE = Math.min(5, Math.max(1, Number(min) || 1)) * 60;
  const [debut, setDebut] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const s = useSharedValue(0.6);
  const reste = debut ? Math.max(0, DUREE - Math.floor((now - debut) / 1000)) : DUREE;
  const ecoule = debut ? (now - debut) / 1000 : 0;
  const inspire = ecoule % (INSPIRE + EXPIRE) < INSPIRE;

  useEffect(() => {
    if (!debut) return;
    // Fin : la pause du jour est cochée, le compte à rebours de l'écran verrouillé disparaît peu après.
    const finir = () => {
      cancelAnimation(s);
      s.set(withTiming(0.6));
      setDebut(null);
      const st = useProfil.getState();
      if (!journeeDu(st.journee).calme) st.basculerCalme();
      st.addXp(5, 'Respiration');
      toast(`Bien joué : ${DUREE / 60} min rien que pour toi 🌿`);
      setTimeout(() => retirer('pause'), 4000);
    };
    const t = setInterval(() => {
      const n = Date.now();
      if (n - debut >= DUREE * 1000) finir();
      else setNow(n);
    }, 250);
    return () => clearInterval(t);
  }, [debut, s, DUREE]);

  const commencer = () => {
    setDebut(Date.now());
    setNow(Date.now());
    momentPause(DUREE);
    s.set(0.6);
    s.set(withRepeat(withSequence(withTiming(1, { duration: INSPIRE * 1000, easing: Easing.inOut(Easing.quad) }), withTiming(0.6, { duration: EXPIRE * 1000, easing: Easing.inOut(Easing.quad) })), -1));
  };
  const arreter = () => {
    cancelAnimation(s);
    s.set(withTiming(0.6));
    setDebut(null);
    retirer('pause');
  };
  const cercle = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: 0.35 + (s.value - 0.6) }));

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.head}>
        <Appui
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={() => {
            arreter();
            if (router.canGoBack()) router.back();
            else router.navigate('/accueil');
          }}
          style={styles.rond}
        >
          <Icon name="x" />
        </Appui>
      </View>
      <View style={styles.centre}>
        <Text weight="bold" style={styles.titre}>
          Une pause pour toi
        </Text>
        <View style={styles.zone}>
          <Animated.View style={[styles.cercle, cercle]} />
          <View style={styles.interieur}>
            <BigNumber value={`${String(Math.floor(reste / 60)).padStart(2, '0')}:${String(reste % 60).padStart(2, '0')}`} size={52} />
            <Text style={styles.consigne}>{debut ? (inspire ? 'Inspire…' : 'Expire…') : 'Respire avec Axel.'}</Text>
          </View>
        </View>
        <Image source={DECO_IMAGES.pause} style={styles.axel} contentFit="cover" />
        <Text style={styles.petit}>Inspire 4 s par le nez, expire 6 s par la bouche. Ton cœur ralentit, ta tête aussi.</Text>
      </View>
      <View style={styles.bas}>
        {debut ? <Button label="Arrêter" variant="dark" icon="pause" onPress={arreter} /> : <Button label={`Commencer ${DUREE / 60} minute${DUREE > 60 ? 's' : ''}`} icon="play" onPress={commencer} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  axel: { width: '100%', height: 170, borderRadius: 20 },
  head: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8 },
  rond: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.iconBg },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  titre: { fontSize: 28, lineHeight: 34 },
  zone: { width: 230, height: 230, alignItems: 'center', justifyContent: 'center' },
  cercle: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: alpha(colors.pink, 0.18),
    borderWidth: 2,
    borderColor: colors.pink,
    boxShadow: `0 0 40px ${alpha(colors.pink, 0.45)}`,
  },
  interieur: { alignItems: 'center', gap: 6 },
  consigne: { fontSize: 17, lineHeight: 22, color: colors.text },
  petit: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
  bas: { paddingBottom: 16 },
});
