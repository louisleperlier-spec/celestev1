import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Glow, Icon, RadialBackground, Text, type IconName } from '@/components/ui';
import { COACH_IMAGES } from '@/data';
import type { CoachId } from '@/data/types';
import { dec, fmt } from '@/lib/charges';
import { mmss } from '@/lib/coeur';
import { coachById } from '@/lib/plan';
import { useProfil } from '@/store/profil';
import type { Resultat } from '@/store/seance';
import { colors, fonts } from '@/theme';

import { CourbeFC, ListeZones } from './Coeur';

/** Fond .recap : halo rose en haut. */
const FOND = [{ rx: 70, ry: 45, cx: 50, cy: 30, color: 'rgba(255,79,163,0.28)' }] as const;

/** Récap de séance (vRecap du prototype). */
export function Recap({ coachId, res: r }: { coachId: CoachId; res: Resultat }) {
  const c = coachById(coachId);
  const age = useProfil((s) => s.age);
  const nset = useProfil((s) => s.nset);
  return (
    <View style={styles.root}>
      <RadialBackground layers={FOND} />
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.bot}>
            <Glow width={260} height={240} intensity={0.45} />
            <Image source={COACH_IMAGES[c.id].corps} style={styles.botImg} contentFit="contain" />
          </View>
          <Text style={styles.h1}>SÉANCE TERMINÉE !</Text>
          <Text style={styles.sub}>
            « {c.prog} » — {c.nom}
          </Text>
          <View style={styles.grid}>
            <Kpi icon="clock" label="Durée" value={mmss(r.sec)} />
            <Kpi icon="trend" label="Volume" value={`${fmt(r.vol)} kg`} />
            <Kpi icon="heart" label="FC moyenne" value={`${r.st.avg} bpm`} em={`max ${r.st.max}`} emGris />
            <Kpi icon="wave" label="VFC moyenne" value={`${r.st.hrv} ms`} />
            <Kpi icon="flame" label="Calories" value={String(r.cal)} />
            <Kpi icon="trophy" label="XP gagnée" value={`+${r.xp}`} em={`boost x${dec(r.m.toFixed(2))}`} />
          </View>
          <Card style={styles.hrchart}>
            <View style={styles.h4}>
              <Text weight="semibold" style={styles.h4Txt}>
                Fréquence cardiaque
              </Text>
              <Text style={styles.h4Small}>simulée</Text>
            </View>
            <CourbeFC samples={r.hr} age={age} />
            <ListeZones z={r.st.z} />
          </Card>
          {nset.post && (
            <View style={styles.noteRow}>
              <Icon name="bell" size={14} color={colors.textSecondary} />
              <Text style={styles.note}>
                Notification VFC post-entraînement dans {nset.delay < 1 ? 'quelques secondes' : nset.delay + ' min'} pour mesurer ta récupération.
              </Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.foot}>
          <Button label="Retour à l'accueil" arrow onPress={() => router.dismissTo('/accueil')} />
        </View>
      </SafeAreaView>
    </View>
  );
}

export function Kpi({ icon, label, value, em, emGris }: { icon: IconName; label: string; value: string; em?: string; emGris?: boolean }) {
  return (
    <Card style={styles.kpi}>
      <Icon name={icon} size={22} color={colors.pink} />
      <View style={styles.flex}>
        <Text style={styles.kSmall}>{label}</Text>
        <Text weight="bold" style={styles.kB} numberOfLines={1}>
          {value}
        </Text>
        {em ? <Text style={[styles.kEm, emGris && styles.kEmN]}>{em}</Text> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 12 },
  bot: { height: 220, alignItems: 'center', justifyContent: 'flex-end', marginTop: 10 },
  botImg: { height: 210, width: 210 },
  h1: { fontFamily: fonts.black, fontSize: 27, lineHeight: 30, letterSpacing: -0.27, marginTop: 14, textAlign: 'center' },
  sub: { color: colors.textSecondary, fontSize: 14, lineHeight: 19.6, marginTop: 6, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 18 },
  kpi: { width: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, minHeight: 76 },
  kSmall: { fontSize: 11, lineHeight: 14, color: colors.textSecondary },
  kB: { fontSize: 18, lineHeight: 23, marginVertical: 2 },
  kEm: { fontSize: 11, lineHeight: 14, color: colors.pinkLight },
  kEmN: { color: '#C6C6CC' },
  hrchart: { marginTop: 12, padding: 12 },
  h4: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h4Txt: { fontSize: 13.5, lineHeight: 18 },
  h4Small: { fontSize: 13.5, lineHeight: 18, color: colors.textSecondary },
  noteRow: { flexDirection: 'row', gap: 6, paddingTop: 10 },
  note: { flex: 1, fontSize: 11.5, lineHeight: 16, color: colors.textSecondary },
  foot: { paddingTop: 12, paddingHorizontal: 20, paddingBottom: 18 },
});
