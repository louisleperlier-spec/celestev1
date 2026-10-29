import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDefilementOnglets } from '@/components/app/TabBar';
import { EntreeTerritoires } from '@/components/app/EntreeTerritoires';
import { TERRITOIRES } from '@/lib/fonctions';
import { BandeauCartes, DefisSemaine, MesRecords } from '@/components/app/Jeu';
import { Ligue } from '@/components/app/Ligue';
import { SemaineCercles } from '@/components/app/Cercles';
import { PeseeSheet as Pesee } from '@/components/app/PeseeSheet';
import { Metriques } from '@/components/app/Metriques';
import { Collection, Parcours } from '@/components/app/ProgresVues';
import { Appui, Icon, Segmente, Text } from '@/components/ui';
import { COACH_IMAGES } from '@/data';
import { coachById } from '@/lib/plan';
import { useProfil } from '@/store/profil';
import { alpha, colors, fonts, mix, ui } from '@/theme';

type Periode = 'Semaine' | 'Mois' | 'Année';
const RUBRIQUES = ['Parcours', 'Statistiques', 'Collection', 'Ligue'] as const;
type Rubrique = (typeof RUBRIQUES)[number];


/** Onglet Progrès (direction « nuit ») : rubriques Parcours, Statistiques, Collection et Ligue. */
export default function Progres() {
  const defile = useDefilementOnglets();
  const profil = useProfil();
  const c = coachById(profil.coach);
  const [p, setP] = useState<Periode>('Semaine');
  const [rub, setRub] = useState<Rubrique>('Parcours');
  const [pesee, setPesee] = useState(false);
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <Animated.ScrollView onScroll={defile} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
        {/* En-tête et rubriques (maquettes « nuit ») */}
        <View style={styles.tete}>
          <Text weight="bold" style={styles.h1} accessibilityRole="header">
            Tes progrès
          </Text>
          {/* Deux boutons ronds (design 10K « Progression ») : calendrier et profil. */}
          <View style={styles.boutons}>
            <Appui
              accessibilityRole="button"
              accessibilityLabel="Calendrier"
              onPress={() => router.navigate({ pathname: '/programme', params: { vue: 'calendrier' } })}
              style={styles.rondProfil}
            >
              <Icon name="cal" size={19} />
            </Appui>
            <Appui accessibilityRole="button" accessibilityLabel="Mon profil" onPress={() => router.navigate('/profil')} style={styles.rondProfil}>
              <Icon name="user" size={20} />
            </Appui>
          </View>
        </View>
        <Segmente options={RUBRIQUES} value={rub} onChange={setRub} style={styles.rubriques} />
        <View style={styles.jeu}>
          <BandeauCartes />
        </View>

        {rub === 'Parcours' && (
          <View style={styles.vue}>
            <Parcours />
            <DefisSemaine />
            <MesRecords />
          </View>
        )}

        {rub === 'Statistiques' && (
          <>
            <View style={styles.vue}>
              <Segmente options={['Semaine', 'Mois', 'Année'] as const} value={p} onChange={setP} />
              <Metriques periode={p} onPesee={() => setPesee(true)} />
            </View>
            <View style={styles.cercles}>
              <SemaineCercles />
            </View>
            {TERRITOIRES && <EntreeTerritoires />}
            {/* .qcard */}
            <LinearGradient
              colors={[colors.surface, colors.surface, mix(colors.mauve, 30, colors.surface)]}
              locations={[0, 0.4, 1]}
              start={{ x: 0, y: 0.4 }}
              end={{ x: 1, y: 0.6 }}
              style={styles.qcard}
            >
              <Text style={styles.qText}>« {c.prog} »</Text>
              <Text style={styles.qEm}>— {c.nom}</Text>
              <Image source={COACH_IMAGES[c.id].tete} style={styles.qImg} contentFit="contain" />
            </LinearGradient>
          </>
        )}

        {rub === 'Collection' && (
          <View style={styles.vue}>
            <Collection />
          </View>
        )}

        {rub === 'Ligue' && <Ligue integree />}
        <View style={styles.basPage} />
      </Animated.ScrollView>
      <Pesee visible={pesee} onClose={() => setPesee(false)} />
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  tete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, paddingHorizontal: 20 },
  h1: { fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
  boutons: { flexDirection: 'row', gap: 8 },
  rondProfil: { width: 40, height: 40, borderRadius: 20, backgroundColor: alpha(colors.text, 0.1), alignItems: 'center', justifyContent: 'center' },
  rubriques: { marginTop: 14, marginHorizontal: 20 },
  vue: { paddingHorizontal: 20, paddingTop: 14, gap: 14 },
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  cercles: { paddingTop: 14, paddingHorizontal: 20 },
  ptitle: { fontSize: 24, lineHeight: 30, paddingTop: 14, paddingHorizontal: 20 },
  seg: { marginTop: 14, marginHorizontal: 20 },
  basPage: { height: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 14, paddingHorizontal: 20 },
  jeu: { marginTop: 12, marginHorizontal: 20, gap: 10 },
  chart: { marginTop: 10, marginHorizontal: 20, paddingTop: 14, paddingHorizontal: 14, paddingBottom: 8 },
  h4: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h4Txt: { fontSize: 14, lineHeight: 18 },
  h4Btn: { fontSize: 12, lineHeight: 16, color: colors.pinkLight, ...fonts.medium },
  voir: { fontSize: 12, lineHeight: 16, color: colors.pinkLight, ...fonts.medium },
  cplan: { flexDirection: 'row', gap: 8, marginTop: 10 },
  cplanCell: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: ui.dark, alignItems: 'center' },
  cplanSmall: { fontSize: 10.5, lineHeight: 14, color: colors.textSecondary, textAlign: 'center' },
  cplanB: { fontSize: 14, lineHeight: 18 },
  svg: { marginTop: 10 },
  note: { fontSize: 11.5, lineHeight: 16, color: colors.textSecondary, paddingTop: 6 },
  noteVide: { paddingTop: 14, paddingBottom: 8 },
  qcard: {
    marginTop: 12,
    marginHorizontal: 20,
    marginBottom: 18,
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,107,26,0.4)',
    overflow: 'hidden',
  },
  qText: { fontSize: 13.5, lineHeight: 19.6 },
  qEm: { fontSize: 13.5, lineHeight: 19.6, color: colors.textSecondary, marginTop: 4 },
  qImg: { position: 'absolute', right: -10, bottom: -26, width: 124, height: 124 },
});
