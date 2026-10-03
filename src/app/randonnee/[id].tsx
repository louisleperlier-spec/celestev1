import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CarteSentier } from '@/components/app/CarteRando';
import { PastilleDifficulte, ProfilAltitude, useMeteo } from '@/components/app/Rando';
import { Button, Card, Icon, Text, type IconName } from '@/components/ui';
import { sentier, SENTIERS } from '@/data/randos';
import { AXEL_RANDO, photoGrande, VOIR_IMAGES } from '@/data/randosImages';
import { duree, profilSentier, VOIR } from '@/lib/rando';
import { useRando } from '@/store/rando';
import { colors, fonts, ui } from '@/theme';

/** Conseils d'Axel selon la difficulté (eau, couches, bâtons, météo). */
const conseils = (dplus: number, min: number): [IconName, string][] => [
  ['wave', `Eau · ${min >= 180 ? '1,5' : '1'} L`],
  ['cloud', 'Prévois des couches'],
  [dplus >= 400 ? 'trend' : 'run', dplus >= 400 ? 'Prends tes bâtons' : 'Bonnes chaussures'],
  ['sun', 'Vérifie la météo'],
];

/** Fiche d'un sentier (maquette de l'utilisateur) : photo, chiffres, profil, carte, points d'intérêt, conseils, météo. */
export default function FicheSentier() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = sentier(id) ?? SENTIERS[0];
  const insets = useSafeAreaInsets();
  const meteo = useMeteo(s.lat, s.lng, s.altSommet);
  const enCours = useRando((r) => r.run);
  const demarrer = () => {
    if (!enCours) useRando.getState().demarrer(s.id);
    router.push('/randonnee/en-cours');
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={photoGrande(s.id)} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={ui.voilePhoto} locations={[0.35, 0.7, 1]} style={StyleSheet.absoluteFill} />
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.navigate('/rando'))} style={[styles.rond, { top: insets.top + 6 }]} accessibilityRole="button" accessibilityLabel="Retour">
            <Icon name="left" size={22} />
          </Pressable>
          <View style={styles.heroBas}>
            <Text weight="bold" style={styles.nom}>
              {s.nom}
            </Text>
            <Text style={styles.region}>{s.region}</Text>
          </View>
        </View>

        <View style={styles.pad}>
          <View style={styles.tuiles}>
            <Tuile icone="rando" valeur={`${String(s.km).replace('.', ',')} km`} label="Distance" />
            <Tuile icone="trend" valeur={`${s.dplus} m`} label="Dénivelé +" />
            <Tuile icone="clock" valeur={duree(s.min)} label="Durée estimée" />
            <View style={styles.tuile}>
              <PastilleDifficulte d={s.difficulte} />
              <Text style={styles.tuileLbl}>Difficulté</Text>
            </View>
          </View>

          <Card style={styles.carte}>
            <Text weight="semibold" style={styles.h3}>
              Profil d’altitude
            </Text>
            <Text style={styles.petit}>Profil approximatif (aller-retour)</Text>
            <View style={styles.mt}>
              <ProfilAltitude points={profilSentier(s)} marges={72} />
            </View>
          </Card>

          <CarteSentier lat={s.lat} lng={s.lng} />
          <Button label="Itinéraire dans Plans" icon="pin" variant="dark" small onPress={() => Linking.openURL('http://maps.apple.com/?q=' + encodeURIComponent(s.recherche))} style={styles.mt} />

          <Text weight="semibold" style={[styles.h3, styles.titre]}>
            Ce que tu vas voir
          </Text>
          <View style={styles.voir}>
            {s.voir.map((v) => (
              <View key={v} style={styles.voirItem}>
                <Image source={VOIR_IMAGES[v]} style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient colors={ui.voilePhoto} locations={[0.3, 0.7, 1]} style={StyleSheet.absoluteFill} />
                <Text weight="semibold" style={styles.voirTxt}>
                  {VOIR[v]}
                </Text>
              </View>
            ))}
          </View>

          <Card style={[styles.carte, styles.conseils]}>
            <Image source={AXEL_RANDO} style={styles.axel} contentFit="contain" />
            <View style={styles.flex}>
              <Text weight="semibold" style={styles.h3}>
                Conseils d’Axel
              </Text>
              {conseils(s.dplus, s.min).map(([ic, t]) => (
                <View key={t} style={styles.conseil}>
                  <Icon name={ic} size={18} color={colors.pink} />
                  <Text style={styles.conseilTxt}>{t}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.carte}>
            <Text weight="semibold" style={styles.h3}>
              Aujourd’hui au sommet
            </Text>
            {meteo ? (
              <View style={styles.meteo}>
                <Text style={styles.meteoEmoji}>{meteo.emoji}</Text>
                <Text weight="bold" style={styles.meteoT}>
                  {meteo.t}°
                </Text>
                <View style={styles.flex}>
                  <Text style={styles.petitClair}>Ressenti {meteo.ressenti}°</Text>
                  <Text style={styles.petitClair}>Vent {meteo.vent} km/h</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.petit}>Météo indisponible pour l’instant.</Text>
            )}
          </Card>

          <Button label={enCours ? 'Reprendre ma rando' : 'Démarrer la rando'} iconAfter="right" onPress={demarrer} style={styles.mt} />
          <Text style={styles.note}>Données indicatives : vérifie le sentier, l’accès et les conditions auprès du parc avant de partir.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Tuile({ icone, valeur, label }: { icone: IconName; valeur: string; label: string }) {
  return (
    <View style={styles.tuile}>
      <Icon name={icone} size={18} color={colors.pink} />
      <Text weight="bold" style={styles.tuileVal} numberOfLines={1}>
        {valeur}
      </Text>
      <Text style={styles.tuileLbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  hero: { height: 330, justifyContent: 'flex-end' },
  rond: { position: 'absolute', left: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  heroBas: { paddingHorizontal: 20, paddingBottom: 6 },
  nom: { fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  region: { fontSize: 16, lineHeight: 21, color: colors.textSecondary, marginTop: 2 },
  pad: { paddingHorizontal: 20 },
  tuiles: { flexDirection: 'row', gap: 6, marginTop: 14 },
  tuile: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 8, gap: 3, alignItems: 'flex-start' },
  tuileVal: { fontSize: 15.5, lineHeight: 20 },
  tuileLbl: { fontSize: 11.5, lineHeight: 15, color: colors.textSecondary },
  carte: { padding: 16, marginTop: 12 },
  h3: { fontSize: 18, lineHeight: 23 },
  titre: { marginTop: 18 },
  petit: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary, marginTop: 2 },
  petitClair: { fontSize: 14, lineHeight: 19 },
  mt: { marginTop: 12 },
  voir: { flexDirection: 'row', gap: 8, marginTop: 10 },
  voirItem: { flex: 1, height: 88, borderRadius: 14, overflow: 'hidden', justifyContent: 'flex-end', padding: 8 },
  voirTxt: { fontSize: 14, lineHeight: 18 },
  conseils: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  axel: { width: 96, height: 120 },
  conseil: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  conseilTxt: { fontSize: 14, lineHeight: 19 },
  meteo: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 },
  meteoEmoji: { fontSize: 40, lineHeight: 48 },
  meteoT: { fontSize: 44, lineHeight: 52, ...fonts.bold },
  note: { fontSize: 11.5, lineHeight: 16, color: colors.textSecondary, textAlign: 'center', marginTop: 14 },
});
