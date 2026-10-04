import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BoutonRandoMontre } from '@/components/app/BoutonMontre';
import { CarteSentier } from '@/components/app/CarteRando';
import { GalerieSentier } from '@/components/app/GalerieSentier';
import { ProfilAltitude, useMeteo } from '@/components/app/Rando';
import { Button, Card, Icon, Text, toast, type IconName } from '@/components/ui';
import { DECO_IMAGES } from '@/data';
import { SENTIERS } from '@/data/randos';
import { AXEL_CONSEIL, creditPrincipal, galerie, imageVoir, photoGrande } from '@/data/randosImages';
import { DIFFICULTES, duree, profilSentier, VOIR } from '@/lib/rando';
import { useRando } from '@/store/rando';
import { trouverSentier as sentier } from '@/store/randosPres';
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
  const osm = s.source === 'osm';
  const meteo = useMeteo(s.lat, s.lng, s.altSommet);
  const enCours = useRando((r) => r.run);
  const largeurRelief = useWindowDimensions().width - 40 - 2;
  const demarrer = () => {
    if (!enCours) useRando.getState().demarrer(s.id);
    router.push('/randonnee/en-cours');
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {/* Vrai sentier d'OpenStreetMap : sa carte avec le tracé ; sinon la photo. */}
          {osm ? (
            <CarteSentier lat={s.lat} lng={s.lng} trace={s.trace} depart={s.depart} hauteur={330} arrondi={false} />
          ) : (
            <Image source={photoGrande(s.id)} style={StyleSheet.absoluteFill} contentFit="cover" />
          )}
          <LinearGradient colors={ui.voilePhoto} locations={[0.35, 0.7, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.navigate('/rando'))} style={[styles.rond, { top: insets.top + 6 }]} accessibilityRole="button" accessibilityLabel="Retour">
            <Icon name="left" size={22} />
          </Pressable>
          <View style={styles.heroBas}>
            <Text weight="bold" style={styles.nom}>
              {s.nom}
            </Text>
            <Text style={styles.region}>{s.region}</Text>
            {!osm && creditPrincipal(s.id) && <Text style={styles.creditHero}>Photo © {creditPrincipal(s.id)}</Text>}
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(120).duration(480).springify().damping(18)} style={styles.pad}>
          <View style={styles.tuiles}>
            <Tuile icone="rando" valeur={`${String(s.km).replace('.', ',')} km`} label="Distance" />
            <Tuile icone="trend" valeur={`${s.dplus} m`} label="Dénivelé +" />
            <Tuile icone="clock" valeur={duree(s.min)} label="Durée estimée" />
            <Tuile icone="chart" valeur={DIFFICULTES[s.difficulte]} label="Difficulté" />
          </View>

          {/* Ton parcours en relief (maquette « nuit ») : relief illustratif, altitude du sommet, départ → sommet → retour. */}
          <Card style={styles.relief}>
            <View style={styles.reliefTete}>
              <Text weight="bold" style={styles.reliefTitre}>
                Ton parcours en relief
              </Text>
              <Pressable accessibilityRole="button" onPress={() => toast('Illustration : le relief exact du sentier n’est pas représenté')} style={styles.apercu}>
                <Text style={styles.apercuTxt}>Aperçu illustratif</Text>
                <Icon name="info" size={14} color={colors.textSecondary} />
              </Pressable>
            </View>
            <View style={{ width: largeurRelief, height: (largeurRelief * 400) / 760, marginHorizontal: -16 }}>
              <Image source={DECO_IMAGES.relief} style={StyleSheet.absoluteFill} contentFit="cover" />
              <View style={styles.altitude}>
                <Text weight="bold" style={styles.altitudeVal}>
                  {s.altSommet} m
                </Text>
                <Text style={styles.petit}>Altitude du sommet</Text>
              </View>
              <View style={[styles.drapeau, { left: largeurRelief * 0.582 - 2 }]}>
                <Text weight="semibold" style={styles.drapeauTxt}>
                  Sommet
                </Text>
              </View>
            </View>
            <View style={styles.etapes}>
              <View style={styles.etape}>
                <View style={styles.pointEtape} />
                <Text style={styles.etapeTxt}>Départ</Text>
              </View>
              <Text style={styles.fleche} numberOfLines={1}>
                ‐ ‐ ‐ ‐ ›
              </Text>
              <View style={styles.etape}>
                <Icon name="montagne" size={22} color={colors.pink} strokeWidth={2.2} />
                <Text style={styles.etapeTxt}>Sommet</Text>
              </View>
              <Text style={styles.fleche} numberOfLines={1}>
                ‐ ‐ ‐ ‐ ›
              </Text>
              <View style={styles.etape}>
                <View style={styles.pointEtape} />
                <Text style={styles.etapeTxt}>{s.boucle ? 'Arrivée' : 'Retour'}</Text>
              </View>
            </View>
            <Text style={styles.distance}>
              {String(s.km).replace('.', ',')} km · {s.boucle ? 'boucle' : 'aller-retour'}
            </Text>
          </Card>

          <Button label={enCours ? 'Reprendre ma rando' : 'Démarrer la rando'} icon="rando" iconAfter="right" onPress={demarrer} style={styles.mt} />
          <BoutonRandoMontre id={s.id} style={styles.mt} />

          {/* Vrai sentier d'OpenStreetMap : profil mesuré sur le terrain. */}
          {osm && (
            <Card style={styles.carte}>
              <Text weight="semibold" style={styles.h3}>
                Profil d’altitude
              </Text>
              <Text style={styles.petit}>{`Altitude du terrain le long du tracé${s.boucle ? ' (boucle)' : ' (aller-retour)'}`}</Text>
              <View style={styles.mt}>
                <ProfilAltitude points={s.profil ?? profilSentier(s)} marges={72} />
              </View>
            </Card>
          )}

          {!osm && <CarteSentier lat={s.lat} lng={s.lng} />}
          <Button
            label={osm ? 'Itinéraire jusqu’au départ' : 'Itinéraire dans Plans'}
            icon="pin"
            variant="dark"
            small
            onPress={() =>
              Linking.openURL(osm && s.depart ? `http://maps.apple.com/?daddr=${s.depart[0]},${s.depart[1]}&dirflg=d` : 'http://maps.apple.com/?q=' + encodeURIComponent(s.recherche))
            }
            style={styles.mt}
          />

          {!osm && galerie(s.id).length > 1 && (
            <>
              <Text weight="semibold" style={[styles.h3, styles.titre]}>
                Photos du sentier
              </Text>
              <GalerieSentier photos={galerie(s.id)} />
            </>
          )}

          {s.voir.length > 0 && (
            <Text weight="semibold" style={[styles.h3, styles.titre]}>
              Ce que tu vas voir
            </Text>
          )}
          <View style={styles.voir}>
            {s.voir.map((v) => (
              <View key={v} style={styles.voirItem}>
                <Image source={imageVoir(s.id, v)} style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient colors={ui.voilePhoto} locations={[0.3, 0.7, 1]} style={StyleSheet.absoluteFill} />
                <Text weight="semibold" style={styles.voirTxt}>
                  {VOIR[v]}
                </Text>
              </View>
            ))}
          </View>

          <Card style={[styles.carte, styles.conseils]}>
            <Image source={AXEL_CONSEIL} style={styles.axel} contentFit="contain" />
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

          <Text style={styles.note}>
            {osm
              ? 'Tracé © contributeurs OpenStreetMap · altitude Open-Meteo (Copernicus). Durée et difficulté estimées : vérifie l’accès, le balisage et les conditions avant de partir.'
              : 'Données indicatives : vérifie le sentier, l’accès et les conditions auprès du parc avant de partir.'}
          </Text>
        </Animated.View>
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
  relief: { marginTop: 14, padding: 16, gap: 10, overflow: 'hidden' },
  reliefTete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  reliefTitre: { flex: 1, fontSize: 20, lineHeight: 25 },
  apercu: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.border2 },
  apercuTxt: { fontSize: 12.5, lineHeight: 16, color: colors.textSecondary },
  altitude: { position: 'absolute', left: 18, top: 0 },
  altitudeVal: { fontSize: 38, lineHeight: 44, letterSpacing: -1 },
  drapeau: { position: 'absolute', top: 2, paddingLeft: 18 },
  drapeauTxt: { fontSize: 13, lineHeight: 17 },
  etapes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  etape: { alignItems: 'center', gap: 4, minWidth: 60 },
  pointEtape: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.pink, borderWidth: 4, borderColor: colors.text },
  etapeTxt: { fontSize: 14, lineHeight: 18 },
  fleche: { flex: 1, textAlign: 'center', fontSize: 15, lineHeight: 19, color: colors.pink, marginBottom: 18 },
  distance: { fontSize: 14, lineHeight: 19, color: colors.textSecondary, textAlign: 'center' },
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  hero: { height: 330, justifyContent: 'flex-end' },
  rond: { position: 'absolute', left: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  heroBas: { paddingHorizontal: 20, paddingBottom: 6 },
  nom: { fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  creditHero: { fontSize: 10.5, lineHeight: 14, color: colors.textSecondary, marginTop: 4 },
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
  voirItem: { flex: 1, height: 120, borderRadius: 14, overflow: 'hidden', justifyContent: 'flex-end', padding: 8 },
  voirTxt: { fontSize: 14, lineHeight: 18 },
  conseils: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  axel: { width: 88, height: 132 },
  conseil: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  conseilTxt: { fontSize: 14, lineHeight: 19 },
  meteo: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 },
  meteoEmoji: { fontSize: 40, lineHeight: 48 },
  meteoT: { fontSize: 44, lineHeight: 52, ...fonts.bold },
  note: { fontSize: 11.5, lineHeight: 16, color: colors.textSecondary, textAlign: 'center', marginTop: 14 },
});
