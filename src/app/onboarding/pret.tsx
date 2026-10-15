import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Glow, Icon, Text } from '@/components/ui';
import { MASCOTTE_IMAGES } from '@/data/images';
import { coachById, LVLN, lvlN, nextSession, prog } from '@/lib/plan';
import { usePlan, useProfil } from '@/store/profil';
import { colors, fonts, ui } from '@/theme';

const LIEU = { maison: 'À la maison', salle: 'En salle', deux: 'Maison et salle' } as const;
const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Fin de l'onboarding : « Ton programme est prêt », résumé, première séance, puis NÉA Plus et le compte. */
export default function Pret() {
  const profil = useProfil();
  const plan = usePlan();
  const c = coachById(profil.coach);
  const pr = prog(profil);
  const s = nextSession(plan).s;
  const jours = new Set(plan.sessions.map((x) => x.day));
  const niveau = lvlN(profil.level);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.head}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} style={styles.back}>
          <Icon name="left" />
        </Pressable>
        <View style={styles.segs}>
          {Array.from({ length: 8 }, (_, k) => (
            <View key={k} style={[styles.seg, styles.segOn]} />
          ))}
        </View>
        <View style={styles.back} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.mascotte}>
          <Glow width={220} height={170} intensity={0.5} />
          <Image source={MASCOTTE_IMAGES.fier} style={styles.mascotteImg} contentFit="contain" accessibilityLabel="La mascotte NÉA, fière" />
        </View>
        <Text style={styles.eyebrow}>TON PROGRAMME EST PRÊT</Text>
        <Text style={styles.title}>À toi de jouer{profil.name ? ', ' + profil.name : ''}.</Text>
        <Text style={styles.sub}>{c.nom} t&apos;accompagne, séance après séance.</Text>

        <View style={styles.carte}>
          <Text style={styles.prog}>{pr.nom}</Text>
          {!pr.nom.includes('semaines') && (
            <Text weight="semibold" style={styles.sem}>
              {pr.sem} semaines
            </Text>
          )}
          <View style={styles.tags}>
            <View style={styles.barres}>
              {[8, 12, 16].map((h, k) => (
                <View key={h} style={[styles.barre, { height: h, opacity: k < niveau ? 1 : 0.35 }]} />
              ))}
            </View>
            <Text style={styles.tag}>{LVLN[niveau - 1]}</Text>
            <Text style={styles.tag}>•</Text>
            <Icon name="home" size={18} color={colors.textSecondary} />
            <Text style={styles.tag}>{LIEU[profil.gear]}</Text>
          </View>
          <View style={styles.sep} />
          <View style={styles.stats}>
            <Stat icon="cal" fort={`${profil.days} séances`} sous="/ semaine" />
            <View style={styles.statSep} />
            <Stat icon="clock" fort={`${profil.dur} min`} sous="/ séance" />
          </View>
          <View style={styles.jours}>
            {JOURS.map((j, i) => (
              <View key={i} style={styles.jour}>
                <Text weight="semibold" style={styles.jourTxt}>
                  {j}
                </Text>
                <View style={[styles.rond, jours.has(i) && styles.rondOn]} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.carte}>
          <Text weight="semibold" style={styles.h3}>
            Ta première séance
          </Text>
          <View style={styles.premiere}>
            <View style={styles.tuile}>
              <Icon name="dumb" size={24} />
            </View>
            <View style={styles.flex}>
              <Text weight="semibold" style={styles.premiereTitre} numberOfLines={1}>
                {s.titre}
              </Text>
              <Text style={styles.premiereSous}>
                {s.min} min • {s.items.length} exercices
              </Text>
            </View>
          </View>
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.navigate('/onboarding/objectifs')} style={styles.modifier}>
          <Icon name="edit" size={20} />
          <Text style={styles.modifierTxt}>Modifier mes réponses</Text>
          <Icon name="right" size={18} color={colors.textSecondary} />
        </Pressable>
      </ScrollView>
      <View style={styles.foot}>
        {/* Paywall, puis création de compte (data-obpay du prototype). */}
        <Button label="Découvrir mon programme" arrow onPress={() => router.push({ pathname: '/plus', params: { suite: 'compte' } })} />
      </View>
    </SafeAreaView>
  );
}

function Stat({ icon, fort, sous }: { icon: 'cal' | 'clock'; fort: string; sous: string }) {
  return (
    <View style={styles.stat}>
      <Icon name={icon} size={26} color={colors.textSecondary} />
      <View>
        <Text weight="semibold" style={styles.statFort}>
          {fort}
        </Text>
        <Text style={styles.statSous}>{sous}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mascotte: { alignSelf: 'center', alignItems: 'center', justifyContent: 'flex-end', width: 220, height: 150 },
  mascotteImg: { width: 110, height: 140 },
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 12 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  segs: { flex: 1, flexDirection: 'row', gap: 6 },
  seg: { flex: 1, height: 4, borderRadius: 2 },
  segOn: { backgroundColor: colors.pink },
  scroll: { paddingHorizontal: 20, paddingBottom: 16, alignItems: 'center' },
  ok: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  eyebrow: { ...fonts.semibold, fontSize: 13, lineHeight: 17, letterSpacing: 1.6, color: colors.textSecondary, marginTop: 14 },
  title: { ...fonts.black, fontSize: 32, lineHeight: 38, letterSpacing: -0.5, textAlign: 'center', marginTop: 6 },
  sub: { fontSize: 17, lineHeight: 23, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
  carte: { alignSelf: 'stretch', marginTop: 18, padding: 18, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  prog: { ...fonts.black, fontSize: 26, lineHeight: 32 },
  sem: { fontSize: 20, lineHeight: 25, color: colors.pinkLight, marginTop: 2 },
  tags: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  tag: { fontSize: 15, lineHeight: 20, color: colors.textSecondary },
  barres: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  barre: { width: 4, borderRadius: 1, backgroundColor: colors.textSecondary },
  sep: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  stats: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statSep: { width: 1, height: 40, backgroundColor: colors.border, marginHorizontal: 12 },
  statFort: { fontSize: 19, lineHeight: 24 },
  statSous: { fontSize: 14, lineHeight: 18, color: colors.textSecondary },
  jours: { flexDirection: 'row', gap: 6, marginTop: 16 },
  jour: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border },
  jourTxt: { fontSize: 14, lineHeight: 18 },
  rond: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: colors.textTertiary },
  rondOn: { backgroundColor: colors.pink, borderColor: colors.pink },
  h3: { fontSize: 19, lineHeight: 24 },
  premiere: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 },
  tuile: { width: 56, height: 56, borderRadius: 14, backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center' },
  premiereTitre: { fontSize: 18, lineHeight: 23 },
  premiereSous: { fontSize: 15, lineHeight: 20, color: colors.textSecondary, marginTop: 2 },
  modifier: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12, paddingVertical: 16, paddingHorizontal: 18, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  modifierTxt: { flex: 1, fontSize: 17, lineHeight: 22 },
  foot: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 12 },
});
