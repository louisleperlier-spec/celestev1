import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ObBar, Retour } from '@/components/onboarding/ObScaffold';
import { Button, Card, Glow, Icon, Text, toast } from '@/components/ui';
import { COACHES, COACH_IMAGES } from '@/data';
import { coachById, recoCoach } from '@/lib/plan';
import { useProfil } from '@/store/profil';
import { alpha, colors, fonts, glow, gradients, mix, ui } from '@/theme';

const ORDRE = COACHES.map((c) => c.id);

/** 8/8 — Choix du coach, le recommandé est présélectionné (vObCoach). */
export default function Coach() {
  const goals = useProfil((s) => s.goals);
  const level = useProfil((s) => s.level);
  const coachId = useProfil((s) => s.coach);
  const obCoachSet = useProfil((s) => s.obCoachSet);
  const set = useProfil((s) => s.set);
  const pickCoach = useProfil((s) => s.pickCoach);
  const stepCoach = useProfil((s) => s.stepCoach);

  // Depuis le Profil (« Changer de coach ») : pas de présélection, retour au programme (vCoach du prototype).
  const depuisProfil = useLocalSearchParams<{ depuis?: string }>().depuis === 'profil';
  const rc = recoCoach(goals, level);
  // À la première arrivée (ou si objectifs/niveau ont changé), on présélectionne le coach recommandé.
  useEffect(() => {
    if (!obCoachSet && !depuisProfil) set({ coach: rc, obCoachSet: true });
  }, [obCoachSet, rc, set, depuisProfil]);
  const c = coachById(obCoachSet || depuisProfil ? coachId : rc);
  const reco = !depuisProfil && c.id === rc;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      {depuisProfil ? <Retour /> : <ObBar step="coach" />}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Choisis ton coach</Text>
        <Text style={styles.sub}>
          {depuisProfil
            ? 'Chaque coach a une personnalité unique.\nLequel te correspond le plus ?'
            : reco
              ? 'Recommandé selon tes objectifs, mais tu peux changer.'
              : 'Chaque coach a son propre style de programme.'}
        </Text>

        {/* .coachstage */}
        <View style={styles.stage}>
          <Glow width={300} height={270} color={c.c} intensity={0.45} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Coach précédent"
            style={[styles.arrow, styles.arrowL]}
            onPress={() => stepCoach(-1, ORDRE)}
          >
            <Icon name="left" />
          </Pressable>
          <Image
            source={COACH_IMAGES[c.id].corps}
            style={styles.bot}
            contentFit="contain"
            transition={250}
            accessibilityLabel={`Coach ${c.nom}`}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Coach suivant"
            style={[styles.arrow, styles.arrowR]}
            onPress={() => stepCoach(1, ORDRE)}
          >
            <Icon name="right" />
          </Pressable>
          {reco && (
            <LinearGradient
              colors={gradients.gold}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.reco, glow('rgba(255,200,60,0.5)', 14)]}
            >
              <Text weight="bold" style={styles.recoText}>
                ★ Recommandé
              </Text>
            </LinearGradient>
          )}
        </View>

        <Text style={styles.cname}>{c.nom.toUpperCase()}</Text>
        <View style={[styles.badge, { backgroundColor: mix(c.c, 30, '#1a1a1e'), borderColor: alpha(c.c, 0.6) }]}>
          <Text weight="extrabold" style={styles.badgeText}>
            {c.spec}
          </Text>
        </View>
        <View style={styles.coachstyle}>
          {[c.style, c.time ? `${c.time} s / ${c.rest} s` : `${c.reps.join('-')} reps`, `Repos ${c.rest} s`].map((t) => (
            <Text key={t} style={styles.styleChip}>
              {t}
            </Text>
          ))}
        </View>
        <Card style={styles.quote}>
          <Text style={styles.quoteText}>« {c.quote} »</Text>
        </Card>

        {/* .avatars */}
        <View style={styles.avatars}>
          {COACHES.map((x) => (
            <Pressable
              key={x.id}
              accessibilityRole="button"
              accessibilityLabel={x.nom}
              accessibilityState={{ selected: x.id === c.id }}
              onPress={() => pickCoach(x.id)}
              style={[styles.av, x.id === c.id && styles.avOn]}
            >
              <Image source={COACH_IMAGES[x.id].tete} style={styles.avImg} contentFit="cover" contentPosition={{ top: '75%', left: '50%' }} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View style={styles.foot}>
        <Button
          label={`Choisir ${c.nom}`}
          arrow
          onPress={() => {
            if (!depuisProfil) return router.push('/onboarding/preparation');
            toast('Programme de ' + c.nom + ' créé');
            router.dismissAll();
            router.navigate('/programme');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontFamily: fonts.black, fontSize: 28, lineHeight: 31, letterSpacing: -0.28, marginTop: 10 },
  sub: { color: colors.textSecondary, fontSize: 14, lineHeight: 19.6, marginTop: 6 },
  stage: { height: 270, alignItems: 'center', justifyContent: 'flex-end', marginTop: 6 },
  bot: { height: 258, width: 258, zIndex: 2 },
  arrow: {
    position: 'absolute',
    top: '44%',
    zIndex: 3,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ui.arrowBg,
    borderWidth: 1,
    borderColor: colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowL: { left: 2 },
  arrowR: { right: 2 },
  reco: { position: 'absolute', top: 8, alignSelf: 'center', zIndex: 4, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999 },
  recoText: { fontSize: 12, lineHeight: 15, color: ui.onGold },
  cname: { textAlign: 'center', fontFamily: fonts.black, fontSize: 30, lineHeight: 36, letterSpacing: 0.6, marginTop: -4, zIndex: 3 },
  badge: { alignSelf: 'center', marginTop: 4, paddingVertical: 3, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1 },
  badgeText: { fontSize: 12, lineHeight: 16, letterSpacing: 0.72 },
  coachstyle: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  styleChip: {
    fontSize: 11.5,
    lineHeight: 15,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: ui.chipBg,
    borderWidth: 1,
    borderColor: colors.border2,
    color: ui.text3,
  },
  quote: { paddingVertical: 14, paddingHorizontal: 18, marginTop: 14, borderRadius: 18 },
  quoteText: { fontSize: 14, lineHeight: 20.3, color: ui.text2, textAlign: 'center' },
  avatars: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 4 },
  av: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: ui.avatarBg,
    borderWidth: 2,
    borderColor: colors.border2,
    overflow: 'hidden',
  },
  avOn: { borderColor: colors.pink, ...glow('rgba(255,79,163,0.6)', 14) },
  avImg: { width: '100%', height: '100%', transform: [{ scale: 1.35 }, { translateY: 4 }] },
  foot: { paddingTop: 12, paddingHorizontal: 20, paddingBottom: 18 },
});
