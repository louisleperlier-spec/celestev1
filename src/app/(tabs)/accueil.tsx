import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SemaineCercles } from '@/components/app/Cercles';
import { BandeauCartes } from '@/components/app/Jeu';
import { Journee } from '@/components/app/Journee';
import { Ligue } from '@/components/app/Ligue';
import { lancerSortie } from '@/components/app/lancerSortie';
import { ouvrirPlus } from '@/components/app/ouvrirPlus';
import { SectionHead } from '@/components/app/Section';
import { AnneauxDuJour, CarteCoach, CarteSeance, TuilesSante } from '@/components/app/Tableau';
import { Appui, Card, Icon, Text } from '@/components/ui';
import { ordreAccueil, type IdCarte } from '@/lib/accueil';
import { estPremium } from '@/lib/premium';
import { nextSession } from '@/lib/semaine';
import { useProfil, useSemaine } from '@/store/profil';
import { colors, gradients, ui } from '@/theme';


/** Onglet Accueil (direction « nuit ») : anneaux Récupération / Effort, coach, prochaine séance, Sommeil / VFC, Ta journée. */
export default function Accueil() {
  const p = useProfil();
  const sem = useSemaine();
  const ns = nextSession(sem);
  const s = ns.s;
  const nonLues = p.notifs.some((n) => !n.read);

  const commencer = () => {
    if (s.ride) return lancerSortie(s.min, s.cat);
    if (s.day == null) return router.navigate('/programme');
    router.push({
      pathname: '/seance-en-cours',
      params: { jour: String(s.day) },
    });
  };

  /** Cartes de l'Accueil, affichées dans l'ordre choisi (« Mon écran d'accueil » du Profil). */
  const cartes: Record<IdCarte, React.ReactNode> = {
    journee: (
      <View style={styles.journee}>
        <Journee />
      </View>
    ),
    bilan: (
      <View style={styles.pad}>
        <AnneauxDuJour />
      </View>
    ),
    coach: (
      <View style={[styles.pad, styles.mt]}>
        <CarteCoach />
      </View>
    ),
    seance: (
      <View style={[styles.pad, styles.mt]}>
        <CarteSeance s={s} offset={ns.offset} onCommencer={commencer} />
      </View>
    ),
    plus: (
      <>
        {/* NÉA Plus, seulement en version gratuite */}
        {!estPremium(p.premium) && (
          <Appui accessibilityRole="button" onPress={() => ouvrirPlus()} style={styles.pad}>
            <Card style={styles.upsell}>
              <View style={styles.upsellIcon}>
                <Icon name="star" size={18} color={gradients.gold[1]} />
              </View>
              <View style={styles.flex}>
                <Text weight="semibold" style={styles.upsellB}>
                  Essaie NÉA Plus gratuitement
                </Text>
                <Text style={styles.upsellSmall}>3 jours offerts • tous les programmes, coach illimité</Text>
              </View>
              <Icon name="right" size={16} color={colors.textTertiary} />
            </Card>
          </Appui>
        )}
      </>
    ),
    reperes: (
      <View style={[styles.pad, styles.mt]}>
        <TuilesSante />
      </View>
    ),
    cercles: (
      <>
        <SectionHead title="Tes cercles de la semaine" />
        <View style={styles.pad}>
          <SemaineCercles />
        </View>
      </>
    ),
    ligue: <Ligue integree />,
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* En-tête (direction « nuit ») : NÉA, cloche, profil ; puis bonjour. */}
        <View style={styles.top}>
          <Text weight="bold" style={styles.marque} accessibilityRole="header">
            NÉA
          </Text>
          <View style={styles.flex} />
          <Appui accessibilityRole="button" accessibilityLabel="Notifications" style={styles.rond} onPress={() => router.push('/notifications')}>
            <Icon name="bell" size={20} />
            {nonLues && <View style={styles.bellDot} />}
          </Appui>
          <Appui accessibilityRole="button" accessibilityLabel="Mon profil" style={styles.rond} onPress={() => router.navigate('/profil')}>
            <Icon name="user" size={21} />
          </Appui>
        </View>
        <View style={styles.bonjour}>
          <Text weight="bold" style={styles.h1} numberOfLines={1}>
            Bonjour {p.name}
          </Text>
          <Text style={styles.date}>Ton rythme, aujourd’hui.</Text>
        </View>
        {/* Cartes gagnées pas encore ouvertes. */}
        <BandeauCartes style={styles.bandeau} />

        {ordreAccueil(p.accueil)
          .filter((x) => x.on)
          .map((x, i) => (
            // Les cartes arrivent l'une après l'autre (glissé du bas + ressort).
            <Animated.View key={x.id} entering={FadeInDown.delay(60 + i * 70).duration(450).springify().damping(18)}>
              {cartes[x.id]}
            </Animated.View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bandeau: { marginHorizontal: 20, marginTop: 12 },
  journee: { marginHorizontal: 20, marginTop: 16 },
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 28 },
  flex: { flex: 1 },
  pad: { marginHorizontal: 20 },
  mt: { marginTop: 14 },
  marque: { fontSize: 30, lineHeight: 36, letterSpacing: 1.5 },
  bonjour: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  h1: { fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
  date: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rond: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    backgroundColor: ui.dark,
    borderWidth: 1.5,
    borderColor: colors.pink,
  },
  initiale: { fontSize: 17, lineHeight: 22, color: colors.pinkLight },
  // Pastille rose tant qu'une notification n'est pas lue
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pink,
  },
  coachWrap: { marginTop: 12, marginHorizontal: 20 },
  coach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  coachImg: { width: 76, height: 86 },
  coachTitre: { fontSize: 16, lineHeight: 21 },
  coachTxt: {
    fontSize: 14,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: 3,
  },
  coachLien: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.pinkLight,
    marginTop: 6,
  },
  seance: { padding: 18 },
  scene: { marginTop: -18, marginHorizontal: -18, marginBottom: 14, aspectRatio: 16 / 9, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  seanceHaut: { gap: 4 },
  quand: { fontSize: 13, lineHeight: 17, color: colors.textSecondary },
  seanceTitre: { fontSize: 21, lineHeight: 26 },
  meta: { fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  vignettes: { flexDirection: 'row', gap: 8, marginTop: 12 },
  plus: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: ui.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusTxt: { fontSize: 15, lineHeight: 20, color: colors.textSecondary },
  btn: { marginTop: 14 },
  upsell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingVertical: 14,
  },
  upsellIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: ui.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upsellB: { fontSize: 15, lineHeight: 20 },
  upsellSmall: { fontSize: 13, lineHeight: 17, color: colors.textSecondary },
});
