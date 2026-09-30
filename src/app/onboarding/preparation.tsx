import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckBox } from '@/components/onboarding/Choices';
import { Glow, Icon, Text, type IconName } from '@/components/ui';
import { COACH_IMAGES } from '@/data';
import { coachById, LVLN, lvlN } from '@/lib/plan';
import { useProfil } from '@/store/profil';
import { colors, fonts } from '@/theme';

const ETAPES = ['Objectif pris en compte', 'Matériel sélectionné', 'Organisation des séances', 'Finalisation du programme'];
const PAS_MS = 800;
const LIEU_COURT = { maison: 'Maison', salle: 'Salle', deux: 'Maison + salle' } as const;

/** Après le choix du coach : « {coach} prépare ton programme », 4 étapes cochées une à une, puis « Ton programme est prêt ». */
export default function Preparation() {
  const profil = useProfil();
  const [fait, setFait] = useState(0);
  const pese = useRef(false);

  // Comme le prototype : on note le poids du jour.
  useEffect(() => {
    if (!pese.current) {
      pese.current = true;
      profil.logWeight(profil.weight);
    }
    const t = setInterval(() => setFait((n) => n + 1), PAS_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (fait === ETAPES.length + 1) router.replace('/onboarding/pret');
  }, [fait]);

  const c = coachById(profil.coach);

  // Robot qui flotte.
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [y]);
  const flotte = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  const resume: [IconName | 'niveau', string][] = [
    ['niveau', LVLN[lvlN(profil.level) - 1]],
    ['home', LIEU_COURT[profil.gear]],
    ['clock', `${profil.days} × ${profil.dur} min`],
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.head}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} style={styles.back}>
          <Icon name="left" />
        </Pressable>
        <Text style={styles.logo}>NÉA</Text>
        <View style={styles.back} />
      </View>
      <View style={styles.segs}>
        {Array.from({ length: 7 }, (_, k) => (
          <View key={k} style={[styles.seg, k < 5 + Math.min(2, fait) ? styles.segOn : styles.segOff]} />
        ))}
      </View>

      <View style={styles.corps}>
        <View style={styles.botWrap}>
          <Glow width={220} height={200} color={c.c} intensity={0.35} />
          <Animated.View style={flotte}>
            <Image source={COACH_IMAGES[c.id].corps} style={styles.bot} contentFit="contain" />
          </Animated.View>
        </View>
        <Text style={styles.title}>{c.nom} prépare ton programme</Text>
        <Text style={styles.sub}>Un plan construit autour de tes réponses.</Text>

        <View style={styles.liste}>
          {ETAPES.map((t, i) => (
            <View key={t} style={[styles.ligne, i > 0 && styles.ligneSep]}>
              {i < fait ? <CheckBox on /> : i === fait ? <ActivityIndicator color={colors.pink} style={styles.spin} /> : <CheckBox on={false} />}
              <Text style={[styles.ligneTxt, i > fait && styles.attente]}>{t}</Text>
            </View>
          ))}
        </View>

        <View style={styles.resume}>
          {resume.map(([ic, t], i) => (
            <View key={t} style={[styles.resumeCase, i > 0 && styles.resumeSep]}>
              {ic === 'niveau' ? (
                <View style={styles.barres}>
                  {[7, 11, 15].map((h, k) => (
                    <View key={h} style={[styles.barre, { height: h, opacity: k < lvlN(profil.level) ? 1 : 0.35 }]} />
                  ))}
                </View>
              ) : (
                <Icon name={ic} size={18} color={colors.textSecondary} />
              )}
              <Text style={styles.resumeTxt} numberOfLines={1}>
                {t}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={styles.instant}>Encore un instant…</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, paddingHorizontal: 12 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  logo: { ...fonts.black, fontSize: 24, lineHeight: 30, letterSpacing: 1 },
  segs: { flexDirection: 'row', gap: 6, paddingHorizontal: 40, marginTop: 4 },
  seg: { flex: 1, height: 4, borderRadius: 2 },
  segOn: { backgroundColor: colors.pink },
  segOff: { backgroundColor: colors.border },
  corps: { flex: 1, paddingHorizontal: 20, alignItems: 'center' },
  botWrap: { width: 200, height: 190, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  bot: { width: 170, height: 170 },
  title: { ...fonts.black, fontSize: 27, lineHeight: 33, letterSpacing: -0.4, textAlign: 'center', marginTop: 8 },
  sub: { fontSize: 17, lineHeight: 23, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
  liste: { alignSelf: 'stretch', marginTop: 22, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, overflow: 'hidden' },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 18 },
  ligneSep: { borderTopWidth: 1, borderTopColor: colors.border },
  ligneTxt: { flex: 1, fontSize: 17, lineHeight: 22 },
  attente: { color: colors.textSecondary },
  spin: { width: 26, height: 26 },
  resume: { alignSelf: 'stretch', flexDirection: 'row', marginTop: 14, paddingVertical: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  resumeCase: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 6 },
  resumeSep: { borderLeftWidth: 1, borderLeftColor: colors.border },
  resumeTxt: { fontSize: 14.5, lineHeight: 19, flexShrink: 1 },
  barres: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  barre: { width: 4, borderRadius: 1, backgroundColor: colors.textSecondary },
  instant: { fontSize: 16, lineHeight: 21, color: colors.textSecondary, textAlign: 'center', paddingBottom: 24 },
});
