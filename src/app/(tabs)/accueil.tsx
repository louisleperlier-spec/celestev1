import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDefilementOnglets } from '@/components/app/TabBar';
import { ACCUEIL, FlammeSerie, PileCartes, TitreSection } from '@/components/app/AccueilDesign';
import { BilanDuJour, CarteCollection, CarteMessageCoach, CarteProchaineSeance, quandSeance, RessentiSheet } from '@/components/app/Bilan';
import { SemaineCercles } from '@/components/app/Cercles';
import { Journee } from '@/components/app/Journee';
import { Ligue } from '@/components/app/Ligue';
import { lancerSortie } from '@/components/app/lancerSortie';
import { ouvrirPlus } from '@/components/app/ouvrirPlus';
import { TuilesSante } from '@/components/app/Tableau';
import { Appui, Icon, Text } from '@/components/ui';
import { ordreAccueil, type IdCarte } from '@/lib/accueil';
import { serie } from '@/lib/gel';
import { estPremium } from '@/lib/premium';
import { nextSession } from '@/lib/semaine';
import { proposerNoteSiBon } from '@/store/note';
import { useProfil, useSemaine } from '@/store/profil';
import { colors } from '@/theme';

/**
 * Onglet Accueil (maquette de l'utilisateur, oct. 2026) : bilan du jour utile même sans Apple Watch (Énergie et
 * Sommeil / Courbatures du check-in, Activité du journal), message du coach, prochaine séance, cartes à découvrir.
 */
export default function Accueil() {
  const defile = useDefilementOnglets();
  const p = useProfil();
  const sem = useSemaine();
  const ns = nextSession(sem);
  const s = ns.s;
  const nonLues = p.notifs.some((n) => !n.read);
  // Note App Store après la 3e activité terminée (fenêtre native d'Apple).
  useFocusEffect(useCallback(() => void proposerNoteSiBon(), []));
  // Check-in du matin ; la clé remet la feuille à zéro à chaque ouverture.
  const [feuille, setFeuille] = useState(0);
  const ouvrirRessenti = () => setFeuille((n) => (n > 0 ? n + 1 : Math.abs(n) + 1));

  const commencer = () => {
    if (s.ride) return lancerSortie(s.min, s.cat);
    if (s.day == null) return router.navigate('/programme');
    router.push({
      pathname: '/seance-en-cours',
      params: { jour: String(s.day) },
    });
  };

  const jours = serie(p);

  /**
   * Cartes de l'Accueil, dans l'ordre choisi (« Mon écran d'accueil » du Profil), en sections du design 10K « Accueil quotidien » :
   * titre de 17 pt et action à droite, 36 pt entre les sections ; le message du coach et les cartes à découvrir collent à la section d'avant.
   */
  const cartes: Record<IdCarte, { titre?: string; action?: string; onAction?: () => void; colle?: boolean; contenu: React.ReactNode } | null> = {
    journee: { contenu: <Journee /> },
    bilan: { titre: 'Ton bilan du jour', action: 'Mon ressenti', onAction: ouvrirRessenti, contenu: <BilanDuJour onRessenti={ouvrirRessenti} /> },
    coach: { colle: true, contenu: <CarteMessageCoach onRessenti={ouvrirRessenti} /> },
    seance: {
      titre: 'Ta prochaine séance',
      action: quandSeance(ns.offset),
      onAction: () => router.navigate('/programme'),
      contenu: <CarteProchaineSeance s={s} offset={ns.offset} onLancer={commencer} />,
    },
    cartes: { colle: true, contenu: <CarteCollection /> },
    // NÉA Plus passe dans la pile de cartes du haut.
    plus: null,
    reperes: { titre: 'Tes repères', contenu: <TuilesSante /> },
    cercles: { titre: 'Tes cercles de la semaine', contenu: <SemaineCercles /> },
    ligue: { contenu: <Ligue integree /> },
  };

  // Pile du haut (PlanHomeUpgradeProCard) : bienvenue (à balayer), puis l'essai de NÉA Plus en version gratuite.
  const pile = [
    {
      id: 'bienvenue',
      titre: 'Bienvenue dans NÉA',
      sous: 'Ton programme est prêt. Fais ta séance, note ton ressenti et avance chaque jour.',
      coach: p.coach,
    },
    ...(estPremium(p.premium)
      ? []
      : [
          {
            id: 'plus',
            titre: 'Essaie NÉA Plus gratuitement',
            sous: '3 jours offerts : tous les programmes et ton coach en illimité.',
            coach: p.coach === 'axel' ? ('nova' as const) : ('axel' as const),
            onPress: () => ouvrirPlus(),
          },
        ]),
  ];

  const visibles = ordreAccueil(p.accueil).filter((x) => x.on && cartes[x.id]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <Animated.ScrollView onScroll={defile} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* En-tête (design 10K) : « Salut {prénom} » à gauche, la série en flamme, la cloche et le profil à droite. */}
        <View style={styles.top}>
          <Text weight="bold" style={styles.h1} numberOfLines={1} accessibilityRole="header">
            Salut {p.name}
          </Text>
          <FlammeSerie jours={jours} onPress={() => router.navigate('/progres')} />
          <Appui accessibilityRole="button" accessibilityLabel="Notifications" style={styles.rond} onPress={() => router.push('/notifications')}>
            <Icon name="bell" size={20} />
            {nonLues && <View style={styles.bellDot} />}
          </Appui>
          <Appui accessibilityRole="button" accessibilityLabel="Mon profil" style={styles.rond} onPress={() => router.navigate('/profil')}>
            <Icon name="user" size={21} />
          </Appui>
        </View>

        <PileCartes cartes={pile} />

        {visibles.map((x, i) => {
          const c = cartes[x.id]!;
          return (
            // Les sections arrivent l'une après l'autre (glissé du bas + ressort).
            <Animated.View
              key={x.id}
              entering={FadeInDown.delay(60 + i * 70)
                .duration(450)
                .springify()
                .damping(18)}
              style={c.colle ? styles.colle : styles.section}
            >
              {c.titre ? <TitreSection titre={c.titre} action={c.action} onAction={c.onAction} /> : null}
              {c.contenu}
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
      {feuille > 0 && <RessentiSheet key={feuille} visible onClose={() => setFeuille((n) => -n)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  // Marges du design : 16 pt sur les côtés, 36 pt entre les sections.
  scroll: { paddingHorizontal: ACCUEIL.marge, paddingBottom: 120 },
  section: { marginTop: ACCUEIL.entreSections },
  colle: { marginTop: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 10 },
  h1: { flex: 1, fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
  rond: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  // Pastille orange tant qu'une notification n'est pas lue
  bellDot: { position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.pink },
});
