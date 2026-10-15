import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ENTRAINEMENT, Rubriques } from '@/components/app/EnTete';
import { IconeSport } from '@/components/app/IconeSport';
import { ImagePosture } from '@/components/app/Yoga';
import { Appui, Button, Icon, Text } from '@/components/ui';
import { OBJECTIFS_YOGA, POSTURES, SEANCES_YOGA, type ObjectifYoga, type SeanceYoga } from '@/data/yoga';
import { dureeMin, NIVEAUX_YOGA, posturesDe, seanceDuMoment } from '@/lib/yoga';
import { colors, fonts, ui } from '@/theme';

type Filtre = ObjectifYoga | 'court';
const FILTRES: [Filtre, string][] = [
  ['debut', 'Débuter'],
  ['court', '≤ 15 min'],
  ['matin', 'Matin'],
  ['souplesse', 'Souplesse'],
  ['dos', 'Dos'],
  ['equilibre', 'Équilibre'],
  ['force', 'Force'],
  ['recup', 'Récupération'],
  ['detente', 'Détente'],
  ['sommeil', 'Sommeil'],
];

const garde = (s: SeanceYoga, f: Filtre | null) => !f || (f === 'court' ? dureeMin(s) <= 15 : s.objectif === f);
const ouvrir = (s: SeanceYoga) => router.push({ pathname: '/yoga/[id]', params: { id: s.id } });

/** Une séance de la liste : durée, niveau, style, objectif. */
function Ligne({ s }: { s: SeanceYoga }) {
  const p = posturesDe(s)[1] ?? posturesDe(s)[0];
  return (
    <Appui onPress={() => ouvrir(s)} style={styles.ligne} accessibilityRole="button" accessibilityLabel={s.titre}>
      <ImagePosture posture={p} taille={64} />
      <View style={styles.flex}>
        <Text weight="semibold" style={styles.h5} numberOfLines={1}>
          {s.titre}
        </Text>
        <Text style={styles.p} numberOfLines={1}>
          {dureeMin(s)} min · {NIVEAUX_YOGA[s.niveau]} · {s.style}
        </Text>
        <Text style={styles.tag}>{OBJECTIFS_YOGA[s.objectif]}</Text>
      </View>
      <Icon name="right" size={18} color={colors.textSecondary} />
    </Appui>
  );
}

/** Yoga (hors cahier des charges, demandé par l'utilisateur) : séance du moment, filtres, 30 séances guidées gratuites, postures. */
export default function Yoga() {
  const [filtre, setFiltre] = useState<Filtre | null>(null);
  const moment = seanceDuMoment(SEANCES_YOGA);
  const liste = SEANCES_YOGA.filter((s) => garde(s, filtre));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Rubriques rubriques={ENTRAINEMENT} actif="Yoga" sansMarge />
        <View style={styles.tete}>
          <View style={styles.flex}>
            <Text style={styles.h1} accessibilityRole="header">
              Yoga
            </Text>
            <Text style={styles.sous}>{SEANCES_YOGA.length} séances guidées, posture par posture.</Text>
          </View>
          <IconeSport glyphe="lotus" size={56} strokeWidth={1.3} />
        </View>

        {/* Séance du moment : matin, soir ou du jour. */}
        <Animated.View entering={FadeInDown.duration(350)}>
          <Appui onPress={() => ouvrir(moment)} style={styles.moment} accessibilityRole="button">
            <Text style={styles.momentSur}>Pour toi, maintenant</Text>
            <Text weight="bold" style={styles.momentTitre}>
              {moment.titre}
            </Text>
            <Text style={styles.p}>
              {dureeMin(moment)} min · {NIVEAUX_YOGA[moment.niveau]} · {moment.style}
            </Text>
            <Text style={[styles.p, styles.mt8]} numberOfLines={2}>
              {moment.desc}
            </Text>
            <Button label="Commencer" icon="play" onPress={() => router.push({ pathname: '/yoga/en-cours', params: { id: moment.id } })} style={styles.mt12} />
          </Appui>
        </Animated.View>

        <View style={styles.filtres}>
          {FILTRES.map(([k, l]) => {
            const on = filtre === k;
            return (
              <Appui key={k} onPress={() => setFiltre(on ? null : k)} style={[styles.filtre, on && styles.filtreOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
                <Text weight={on ? 'semibold' : 'regular'} style={[styles.filtreTxt, on && styles.filtreTxtOn]}>
                  {l}
                </Text>
              </Appui>
            );
          })}
        </View>

        <Text style={styles.h2}>{filtre ? `${liste.length} séance${liste.length > 1 ? 's' : ''}` : 'Toutes les séances'}</Text>
        <View style={styles.liste}>
          {liste.map((s, i) => (
            <Animated.View key={s.id} entering={FadeInDown.delay(Math.min(i, 8) * 40).duration(300)}>
              <Ligne s={s} />
            </Animated.View>
          ))}
        </View>

        <Appui onPress={() => router.push('/yoga/postures')} style={styles.biblio} accessibilityRole="button">
          <IconeSport glyphe="lotus" size={30} />
          <View style={styles.flex}>
            <Text weight="semibold" style={styles.h5}>
              Les {POSTURES.length} postures
            </Text>
            <Text style={styles.p}>Consignes, souffle et version plus douce.</Text>
          </View>
          <Icon name="right" size={18} color={colors.textSecondary} />
        </Appui>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  tete: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  h1: { ...fonts.bold, fontSize: 38, lineHeight: 44, letterSpacing: -0.8 },
  sous: { fontSize: 16, lineHeight: 21, color: colors.textSecondary, marginTop: 2, marginBottom: 8 },
  moment: { marginTop: 12, padding: 18, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.pink },
  momentSur: { ...fonts.semibold, fontSize: 13, lineHeight: 17, color: colors.pink },
  momentTitre: { fontSize: 24, lineHeight: 30, marginTop: 4 },
  filtres: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  filtre: { borderRadius: 100, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 8 },
  filtreOn: { backgroundColor: colors.pink, borderColor: colors.pink },
  filtreTxt: { fontSize: 14, lineHeight: 18 },
  filtreTxtOn: { color: colors.onPrimary },
  h2: { ...fonts.bold, fontSize: 24, lineHeight: 30, marginTop: 24, marginBottom: 6 },
  liste: { gap: 10 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: 20, backgroundColor: colors.surface },
  h5: { fontSize: 16, lineHeight: 21 },
  p: { fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  tag: { ...fonts.semibold, fontSize: 12, lineHeight: 16, color: colors.pink, marginTop: 3 },
  biblio: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, backgroundColor: ui.dark, marginTop: 20 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 14 },
});
