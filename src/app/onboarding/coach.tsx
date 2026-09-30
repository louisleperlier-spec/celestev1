import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoachFace } from '@/components/app/CoachFace';
import { Sheet } from '@/components/app/Sheet';
import { ObBar, Retour } from '@/components/onboarding/ObScaffold';
import { Button, Glow, Icon, Text, toast, type IconName } from '@/components/ui';
import { COACHES, COACH_IMAGES } from '@/data';
import type { Coach as CoachT } from '@/data/types';
import { coachById, recoCoach } from '@/lib/plan';
import { useProfil } from '@/store/profil';
import { colors, fonts } from '@/theme';

const ORDRE = COACHES.map((c) => c.id);
/** « PERFORMANCE » → « Performance ». */
const casse = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
const approche = (c: CoachT) => `${c.traits[0]} et ${c.traits[1].toLowerCase()}`;

/** 8/8 — Choix du coach en carrousel ; le recommandé est présélectionné (vObCoach). */
export default function Coach() {
  const goals = useProfil((s) => s.goals);
  const level = useProfil((s) => s.level);
  const coachId = useProfil((s) => s.coach);
  const obCoachSet = useProfil((s) => s.obCoachSet);
  const set = useProfil((s) => s.set);
  const pickCoach = useProfil((s) => s.pickCoach);
  const { width } = useWindowDimensions();
  const [comparer, setComparer] = useState(false);
  const defil = useRef<ScrollView>(null);

  // Depuis le Profil (« Changer de coach ») : pas de présélection, retour au programme (vCoach du prototype).
  const depuisProfil = useLocalSearchParams<{ depuis?: string }>().depuis === 'profil';
  const rc = recoCoach(goals, level);
  // À la première arrivée (ou si objectifs/niveau ont changé), on présélectionne le coach recommandé.
  useEffect(() => {
    if (!obCoachSet && !depuisProfil) set({ coach: rc, obCoachSet: true });
  }, [obCoachSet, rc, set, depuisProfil]);
  const c = coachById(obCoachSet || depuisProfil ? coachId : rc);
  const reco = !depuisProfil && c.id === rc;
  const idx = ORDRE.indexOf(c.id);

  // Carrousel : le coach choisi au centre, les voisins dépassent sur les côtés.
  const L = Math.round(width * 0.62);
  const marge = (width - L) / 2;
  useEffect(() => {
    defil.current?.scrollTo({ x: idx * L, animated: true });
  }, [idx, L]);

  const infos: [IconName, string, string][] = [
    ['dumb', 'Sa spécialité', c.style],
    ['user', 'Son approche', approche(c)],
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      {depuisProfil ? <Retour /> : <ObBar step="coach" />}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.pad}>
          {!depuisProfil && <Text style={styles.eyebrow}>DERNIÈRE ÉTAPE</Text>}
          <Text style={styles.title}>Choisis ton coach.</Text>
          <Text style={styles.sub}>{depuisProfil ? 'Chaque coach a sa personnalité et son style de programme.' : 'La bonne énergie pour avancer.'}</Text>
        </View>

        <ScrollView
          ref={defil}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={L}
          decelerationRate="fast"
          contentOffset={{ x: idx * L, y: 0 }}
          contentContainerStyle={{ paddingHorizontal: marge }}
          onMomentumScrollEnd={(e) => {
            const i = Math.max(0, Math.min(ORDRE.length - 1, Math.round(e.nativeEvent.contentOffset.x / L)));
            if (ORDRE[i] !== c.id) pickCoach(ORDRE[i]);
          }}
          style={styles.carrousel}
        >
          {COACHES.map((x, i) => (
            <Pressable
              key={x.id}
              accessibilityRole="button"
              accessibilityLabel={`Coach ${x.nom}`}
              accessibilityState={{ selected: i === idx }}
              onPress={() => pickCoach(x.id)}
              style={[styles.item, { width: L }, i !== idx && styles.itemLoin]}
            >
              {i === idx && <Glow width={L} height={300} color={x.c} intensity={0.35} />}
              <Image source={COACH_IMAGES[x.id].corps} style={styles.bot} contentFit="contain" />
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.points}>
          {COACHES.map((x, i) => (
            <View key={x.id} style={[styles.point, i === idx && styles.pointOn]} />
          ))}
        </View>

        <View style={styles.pad}>
          {reco && (
            <View style={styles.reco}>
              <Icon name="star" size={13} color={colors.pink} />
              <Text weight="semibold" style={styles.recoTxt}>
                Recommandé pour toi
              </Text>
            </View>
          )}
          <Text style={styles.cname}>{c.nom}</Text>
          <Text weight="semibold" style={styles.spec}>
            {casse(c.spec)}
          </Text>
          <Text style={styles.quote}>{c.quote}</Text>

          <View style={styles.infos}>
            {infos.map(([ic, k, v], i) => (
              <View key={k} style={[styles.info, i > 0 && styles.infoSep]}>
                <Icon name={ic} size={24} color={colors.textSecondary} />
                <Text style={styles.infoK}>{k}</Text>
                <Text weight="semibold" style={styles.infoV}>
                  {v}
                </Text>
              </View>
            ))}
          </View>

          <Pressable accessibilityRole="button" onPress={() => setComparer(true)} style={styles.comparer}>
            <Icon name="sliders" size={20} color={colors.text} />
            <Text style={styles.comparerTxt}>Comparer les {COACHES.length} coachs</Text>
          </Pressable>
        </View>
      </ScrollView>
      <View style={styles.foot}>
        <Button
          label={depuisProfil ? `Choisir ${c.nom}` : `C'est parti avec ${c.nom}`}
          arrow
          onPress={() => {
            if (!depuisProfil) return router.push('/onboarding/preparation');
            toast('Programme de ' + c.nom + ' créé');
            router.dismissAll();
            router.navigate('/programme');
          }}
        />
        <Text style={styles.apres}>Tu pourras changer plus tard.</Text>
      </View>

      <Sheet visible={comparer} onClose={() => setComparer(false)} title={`Les ${COACHES.length} coachs`}>
        {COACHES.map((x) => (
          <Pressable
            key={x.id}
            accessibilityRole="button"
            onPress={() => {
              pickCoach(x.id);
              setComparer(false);
            }}
            style={[styles.cmp, x.id === c.id && styles.cmpOn]}
          >
            <CoachFace id={x.id} size={52} borderColor={x.id === c.id ? colors.pink : colors.border} />
            <View style={styles.flex}>
              <Text weight="semibold" style={styles.cmpNom}>
                {x.nom} <Text style={styles.cmpSpec}>• {casse(x.spec)}</Text>
              </Text>
              <Text style={styles.cmpTxt}>
                {x.style} • {x.reps[0]}-{x.reps[1]} reps • repos {x.rest} s
              </Text>
              <Text style={styles.cmpTxt}>{approche(x)}</Text>
            </View>
          </Pressable>
        ))}
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { paddingBottom: 12 },
  pad: { paddingHorizontal: 20 },
  eyebrow: { ...fonts.semibold, fontSize: 13, lineHeight: 17, letterSpacing: 1.6, color: colors.textSecondary, marginTop: 18 },
  title: { ...fonts.black, fontSize: 34, lineHeight: 40, letterSpacing: -0.6, marginTop: 8 },
  sub: { color: colors.textSecondary, fontSize: 17, lineHeight: 23, marginTop: 4 },
  carrousel: { marginTop: 8 },
  item: { height: 300, alignItems: 'center', justifyContent: 'center' },
  itemLoin: { opacity: 0.45, transform: [{ scale: 0.82 }] },
  bot: { width: '100%', height: 290 },
  points: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 6 },
  point: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.border2 },
  pointOn: { backgroundColor: colors.pink },
  reco: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', marginTop: 14, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.pink },
  recoTxt: { fontSize: 12.5, lineHeight: 16, color: colors.pinkLight },
  cname: { textAlign: 'center', ...fonts.black, fontSize: 40, lineHeight: 48, letterSpacing: -0.6, marginTop: 8 },
  spec: { textAlign: 'center', fontSize: 19, lineHeight: 24, color: colors.pink },
  quote: { textAlign: 'center', fontSize: 17, lineHeight: 24, color: colors.textSecondary, marginTop: 10, paddingHorizontal: 10 },
  infos: { marginTop: 20 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, paddingHorizontal: 4 },
  infoSep: { borderTopWidth: 1, borderTopColor: colors.border },
  infoK: { flex: 1, fontSize: 16, lineHeight: 21, color: colors.textSecondary },
  infoV: { fontSize: 16, lineHeight: 21, textAlign: 'right', flexShrink: 1 },
  comparer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14, paddingVertical: 8 },
  comparerTxt: { fontSize: 16, lineHeight: 21, textDecorationLine: 'underline' },
  foot: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 12 },
  apres: { fontSize: 14, lineHeight: 19, color: colors.textSecondary, textAlign: 'center', marginTop: 12 },
  cmp: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: 16, marginBottom: 8, backgroundColor: colors.surface2, borderWidth: 1.5, borderColor: 'transparent' },
  cmpOn: { borderColor: colors.pink },
  cmpNom: { fontSize: 17, lineHeight: 22 },
  cmpSpec: { fontSize: 14, color: colors.pinkLight },
  cmpTxt: { fontSize: 13.5, lineHeight: 18, color: colors.textSecondary, marginTop: 2 },
});
