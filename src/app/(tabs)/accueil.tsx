import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BilanDuJour } from '@/components/app/Cercles';
import { lancerSortie } from '@/components/app/lancerSortie';
import { ouvrirPlus } from '@/components/app/ouvrirPlus';
import { Reperes } from '@/components/app/Reperes';
import { SectionHead } from '@/components/app/Section';
import { Thumb } from '@/components/app/Thumb';
import { Button, Card, Icon, Text } from '@/components/ui';
import { COACH_IMAGES } from '@/data';
import { coachById } from '@/lib/plan';
import { estPremium } from '@/lib/premium';
import { nextSession } from '@/lib/semaine';
import { useProfil, useSemaine } from '@/store/profil';
import { colors, fonts, gradients, ui } from '@/theme';

const DATE = new Intl.DateTimeFormat('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' });
const JOURS_LONGS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

/** Onglet Accueil : bilan du jour (anneaux), mot du coach, prochaine séance et repères de récupération. */
export default function Accueil() {
  const p = useProfil();
  const sem = useSemaine();
  const c = coachById(p.coach);
  const ns = nextSession(sem);
  const s = ns.s;
  const nonLues = p.notifs.some((n) => !n.read);
  const quand = ns.offset === 0 ? "Aujourd'hui" : ns.offset === 1 ? 'Demain' : s.day != null ? JOURS_LONGS[s.day] : 'Bientôt';
  const message = ns.offset === 0 ? 'Ta séance du jour est prête' : ns.offset === 1 ? "Repos aujourd'hui, séance demain" : 'Jour de repos : récupère bien';

  const commencer = () => {
    if (s.ride) return lancerSortie(s.min, s.cat);
    if (s.day == null) return router.navigate('/programme');
    router.push({ pathname: '/seance-en-cours', params: { jour: String(s.day) } });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* En-tête : bonjour, cloche, avatar (Profil) */}
        <View style={styles.top}>
          <View style={styles.flex}>
            <Text style={styles.h1} accessibilityRole="header" numberOfLines={1}>
              Bonjour {p.name}
            </Text>
            <Text style={styles.date}>{DATE.format(new Date())}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Notifications" style={styles.rond} onPress={() => router.push('/notifications')}>
            <Icon name="bell" size={20} />
            {nonLues && <View style={styles.bellDot} />}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Mon profil" style={[styles.rond, styles.avatar]} onPress={() => router.navigate('/profil')}>
            <Text weight="semibold" style={styles.initiale}>
              {(p.name || '?').slice(0, 1).toUpperCase()}
            </Text>
          </Pressable>
        </View>

        <SectionHead title="Ton bilan du jour" />
        <View style={styles.pad}>
          <BilanDuJour />
        </View>

        {/* Mot du coach : ouvre l'onglet Coach */}
        <Pressable accessibilityRole="button" accessibilityLabel={`Parler à ${c.nom}`} onPress={() => router.navigate('/coach')} style={styles.coachWrap}>
          <Card style={styles.coach}>
            <Image source={COACH_IMAGES[c.id].corps} style={styles.coachImg} contentFit="contain" />
            <View style={styles.flex}>
              <Text weight="semibold" style={styles.coachTitre}>
                {message}
              </Text>
              <Text style={styles.coachTxt} numberOfLines={3}>
                {c.daily}
              </Text>
              <Text weight="semibold" style={styles.coachLien}>
                Parler à {c.nom}
              </Text>
            </View>
          </Card>
        </Pressable>

        <SectionHead title="Ta prochaine séance" action="Programme" onAction={() => router.navigate('/programme')} />
        <Card style={[styles.pad, styles.seance]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Voir la séance ${s.titre}`}
            onPress={() => (s.day != null ? router.push(`/seance/${s.day}`) : router.navigate('/programme'))}
            style={styles.seanceHaut}
          >
            <Text style={styles.quand}>
              {quand} • {s.min} min
            </Text>
            <Text weight="semibold" style={styles.seanceTitre}>
              {s.titre}
            </Text>
            <Text style={styles.meta}>
              {s.items.length} exercices • ≈ {s.kcal} kcal
            </Text>
            {!s.ride && s.items.length > 0 && (
              <View style={styles.vignettes}>
                {s.items.slice(0, 4).map((it, i) => (
                  <Thumb key={i} id={it.id} />
                ))}
                {s.items.length > 4 && (
                  <View style={styles.plus}>
                    <Text weight="semibold" style={styles.plusTxt}>
                      +{s.items.length - 4}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Pressable>
          <Button label={s.ride ? 'Lancer la sortie' : 'Commencer la séance'} onPress={commencer} style={styles.btn} />
        </Card>

        {/* NÉA Plus, seulement en version gratuite */}
        {!estPremium(p.premium) && (
          <Pressable accessibilityRole="button" onPress={() => ouvrirPlus()} style={styles.pad}>
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
          </Pressable>
        )}

        <SectionHead title="Tes repères" action="Sommeil" onAction={() => router.push('/sommeil')} />
        <View style={styles.pad}>
          <Reperes nights={p.nights} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 28 },
  flex: { flex: 1 },
  pad: { marginHorizontal: 20 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, paddingHorizontal: 20 },
  h1: { ...fonts.semibold, fontSize: 30, lineHeight: 36, letterSpacing: -0.3 },
  date: { fontSize: 15, lineHeight: 20, color: colors.textSecondary, marginTop: 2 },
  rond: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  avatar: { backgroundColor: ui.dark, borderWidth: 1.5, borderColor: colors.pink },
  initiale: { fontSize: 17, lineHeight: 22, color: colors.pinkLight },
  // Pastille rose tant qu'une notification n'est pas lue
  bellDot: { position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.pink },
  coachWrap: { marginTop: 12, marginHorizontal: 20 },
  coach: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  coachImg: { width: 76, height: 86 },
  coachTitre: { fontSize: 16, lineHeight: 21 },
  coachTxt: { fontSize: 14, lineHeight: 19, color: colors.textSecondary, marginTop: 3 },
  coachLien: { fontSize: 14, lineHeight: 18, color: colors.pinkLight, marginTop: 6 },
  seance: { padding: 18 },
  seanceHaut: { gap: 4 },
  quand: { fontSize: 13, lineHeight: 17, color: colors.textSecondary },
  seanceTitre: { fontSize: 21, lineHeight: 26 },
  meta: { fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  vignettes: { flexDirection: 'row', gap: 8, marginTop: 12 },
  plus: { width: 56, height: 56, borderRadius: 12, backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center' },
  plusTxt: { fontSize: 15, lineHeight: 20, color: colors.textSecondary },
  btn: { marginTop: 14 },
  upsell: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, paddingVertical: 14 },
  upsellIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center' },
  upsellB: { fontSize: 15, lineHeight: 20 },
  upsellSmall: { fontSize: 13, lineHeight: 17, color: colors.textSecondary },
});
