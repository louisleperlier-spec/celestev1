import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CarteJeu } from '@/components/app/CarteJeu';
import { CarteRando } from '@/components/app/CarteRando';
import { BandeauCartes } from '@/components/app/Jeu';
import { ProfilAltitude } from '@/components/app/Rando';
import { Button, Card, Icon, Text, type IconName } from '@/components/ui';
import { trouverSentier as sentier } from '@/store/randosPres';
import { AXEL_SOMMET, photoGrande } from '@/data/randosImages';
import { vibrerFete } from '@/store/jeu';
import { useRando } from '@/store/rando';
import { colors, fonts, ui } from '@/theme';

const km1 = (v: number) => v.toFixed(1).replace('.', ',');
const hm = (s: number) => `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`;

/** Récap de rando (maquette de l'utilisateur) : sommet, chiffres, profil mesuré, carte Explorateur, badges, partage. */
export default function RecapRando() {
  const insets = useSafeAreaInsets();
  const r = useRando((x) => x.res);
  const pts = useRando((x) => x.pts);
  const s = sentier(r?.sentier);
  useEffect(() => {
    if (r?.sommet) vibrerFete();
  }, [r?.sommet]);

  if (!r) return <Redirect href="/rando" />;

  const partager = () =>
    Share.share({
      message: `${r.sommet ? '⛰️ Sommet atteint' : '🥾 Rando terminée'}${s ? ` : ${s.nom}` : ''} ! ${km1(r.km)} km, ${r.dplus} m de D+ en ${hm(r.sec)} avec NÉA 🧡`,
    });

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {/* Sentier de la collection : sa photo ; sentier d'OpenStreetMap ou rando libre : ton tracé. */}
          {s && !s.source ? <Image source={photoGrande(s.id)} style={StyleSheet.absoluteFill} contentFit="cover" /> : <CarteRando pts={pts} />}
          <LinearGradient colors={ui.voilePhoto} locations={[0.3, 0.75, 1]} style={StyleSheet.absoluteFill} />
          <View style={[styles.haut, { top: insets.top + 6 }]}>
            <Pressable onPress={() => router.navigate('/rando')} style={styles.rond} accessibilityRole="button" accessibilityLabel="Fermer">
              <Icon name="x" size={22} />
            </Pressable>
            <Pressable onPress={partager} style={styles.rond} accessibilityRole="button" accessibilityLabel="Partager">
              <Icon name="arrow" size={20} />
            </Pressable>
          </View>
          <Image source={AXEL_SOMMET} style={styles.axel} contentFit="contain" />
          <View style={styles.heroBas}>
            <Text weight="bold" style={styles.h1}>
              {r.sommet ? 'Sommet atteint !' : 'Rando terminée !'}
            </Text>
            <Text weight="semibold" style={styles.nom}>
              {s?.nom ?? 'Rando libre'}
            </Text>
            {s && <Text style={styles.region}>{s.region}</Text>}
          </View>
        </View>

        <View style={styles.pad}>
          <Card style={styles.stats}>
            <Stat icone="clock" valeur={hm(r.sec)} label="Durée" />
            <Stat icone="rando" valeur={`${km1(r.km)} km`} label="Distance" />
            <Stat icone="trend" valeur={`${r.dplus} m`} label="D+ mesuré" />
            <Stat icone="flame" valeur={String(r.cal)} label="kcal" />
            <Stat icone="heart" valeur={`${r.st.avg} bpm`} label="FC moyenne" />
            <Stat icone="bolt" valeur={`+${r.xp}`} label="XP" />
          </Card>

          {r.profil.length > 1 && (
            <Card style={styles.carte}>
              <Text weight="semibold" style={styles.h3}>
                Ton profil d’altitude
              </Text>
              <View style={styles.mt}>
                <ProfilAltitude points={r.profil} marges={72} />
              </View>
            </Card>
          )}

          {s && !s.source && (
            <Card style={[styles.carte, styles.gagnee]}>
              <CarteJeu id={`rando:${s.id}`} largeur={130} cachee={!r.sommet} />
              <View style={styles.flex}>
                <Text weight="semibold" style={styles.h3}>
                  {r.sommet ? (r.carte ? 'Carte gagnée : Explorateur' : 'Explorateur') : 'Carte Explorateur'}
                </Text>
                <View style={styles.legende}>
                  <Text weight="bold" style={styles.legendeTxt}>
                    LÉGENDAIRE
                  </Text>
                </View>
                <Text style={styles.p}>
                  {r.sommet
                    ? r.carte
                      ? 'Un sommet de plus. Une nouvelle carte rejoint ta collection.'
                      : 'Tu l’avais déjà : un exemplaire de plus dans ta collection.'
                    : `Atteins le sommet (au moins ${Math.round(s.dplus * 0.6)} m de D+) pour la gagner.`}
                </Text>
              </View>
            </Card>
          )}

          {r.badges.length > 0 && (
            <View style={styles.badges}>
              {r.badges.map((b) => (
                <View key={b.id} style={styles.badge}>
                  <Icon name={b.icone} size={26} color={colors.pink} />
                  <Text weight="semibold" style={styles.badgeTxt}>
                    {b.titre}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {r.cases > 0 && <Text style={[styles.p, styles.mt]}>⬢ {r.cases} cases traversées pour tes territoires.</Text>}
          <BandeauCartes style={styles.mt} />
          <Button label="Partager ma rando" icon="arrow" onPress={partager} style={styles.mt} />
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ icone, valeur, label }: { icone: IconName; valeur: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Icon name={icone} size={22} color={colors.pink} />
      <View style={styles.flex}>
        <Text weight="bold" style={styles.statVal} numberOfLines={1}>
          {valeur}
        </Text>
        <Text style={styles.statLbl}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  hero: { height: 360, justifyContent: 'flex-end' },
  haut: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  rond: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  axel: { position: 'absolute', right: 8, bottom: 30, width: 140, height: 210 },
  heroBas: { paddingHorizontal: 20, paddingBottom: 8, paddingRight: 150 },
  h1: { fontSize: 34, lineHeight: 40, letterSpacing: -0.5 },
  nom: { fontSize: 19, lineHeight: 24, marginTop: 2 },
  region: { fontSize: 14.5, lineHeight: 19, color: colors.textSecondary },
  pad: { paddingHorizontal: 20 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', padding: 14, rowGap: 14, marginTop: 12 },
  stat: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 10 },
  statVal: { fontSize: 18, lineHeight: 23 },
  statLbl: { fontSize: 12.5, lineHeight: 16, color: colors.textSecondary },
  carte: { padding: 16, marginTop: 12 },
  h3: { fontSize: 18, lineHeight: 23, ...fonts.semibold },
  mt: { marginTop: 12 },
  gagnee: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  legende: { alignSelf: 'flex-start', borderWidth: 1.5, borderColor: ui.rarete[3], borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3, marginTop: 8 },
  legendeTxt: { fontSize: 11.5, lineHeight: 15, color: ui.rarete[3], letterSpacing: 0.5 },
  p: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: 8 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderRadius: 18, paddingVertical: 14 },
  badgeTxt: { fontSize: 13, lineHeight: 17, textAlign: 'center' },
});
