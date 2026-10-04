import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PastilleDifficulte } from '@/components/app/Rando';
import { Appui, Button, Icon, Text } from '@/components/ui';
import { DECO_IMAGES } from '@/data';
import { SENTIERS } from '@/data/randos';
import { AXEL_RANDO, photoGrande, RANDO_IMAGES } from '@/data/randosImages';
import { lundiISO } from '@/lib/ligue';
import { lvlN } from '@/lib/plan';
import { duree, randoSemaine, suggestion, type Sentier } from '@/lib/rando';
import { baseHrv } from '@/lib/sommeil';
import { useProfil } from '@/store/profil';
import { useRando } from '@/store/rando';
import { chercherRandosPres, useRandosPres } from '@/store/randosPres';
import { colors, fonts, ui } from '@/theme';

type Filtre = 'facile' | 'modere' | 'difficile' | 'court' | 'vue' | 'chute';
const FILTRES: [Filtre, string][] = [
  ['facile', 'Facile'],
  ['modere', 'Modéré'],
  ['difficile', 'Difficile'],
  ['court', '< 2 h'],
  ['vue', 'Vue panoramique'],
  ['chute', "Chutes d'eau"],
];

const garde = (s: Sentier, f: Filtre | null) =>
  !f ||
  (f === 'court' ? s.min < 120 : f === 'vue' ? s.voir.includes('belvedere') : f === 'chute' ? s.voir.includes('chute') : s.difficulte === f);

const km = (v: number) => String(v).replace('.', ',');

/** Chiffres d'un sentier : distance, dénivelé, durée. */
function Chiffres({ s, clair = false }: { s: Sentier; clair?: boolean }) {
  const c = clair ? colors.text : colors.textSecondary;
  return (
    <View style={styles.chiffres}>
      <Icon name="rando" size={15} color={c} />
      <Text style={[styles.chiffre, { color: c }]}>{km(s.km)} km</Text>
      <Text style={[styles.point, { color: c }]}>·</Text>
      <Icon name="trend" size={15} color={c} />
      <Text style={[styles.chiffre, { color: c }]}>D+ {s.dplus} m</Text>
      <Text style={[styles.point, { color: c }]}>·</Text>
      <Icon name="clock" size={15} color={c} />
      <Text style={[styles.chiffre, { color: c }]}>{duree(s.min)}</Text>
    </View>
  );
}

/** Onglet Randonnée (maquette de l'utilisateur) : filtres, rando de la semaine, sentiers à explorer, rando libre. */
export default function Randonnee() {
  const [filtre, setFiltre] = useState<Filtre | null>(null);
  const enCours = useRando((s) => s.run);
  const semaine = randoSemaine(SENTIERS, lundiISO());
  const liste = SENTIERS.filter((s) => garde(s, filtre));
  const pres = useRandosPres();
  const niveau = useProfil((p) => lvlN(p.level));
  const recupBasse = useProfil((p) => {
    const m = p.hrvChecks[p.hrvChecks.length - 1];
    return !!m && new Date(m.d).toDateString() === new Date().toDateString() && m.hrv < baseHrv(p.nights, p.hrvChecks) * 0.9;
  });
  const proposee = suggestion(pres.liste, niveau, recupBasse);
  const autour = pres.liste.filter((s) => s.id !== proposee?.s.id && garde(s, filtre));
  useEffect(() => {
    void chercherRandosPres();
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.tete}>
          <View style={styles.flex}>
            <Text style={styles.h1} accessibilityRole="header">
              Randonnée
            </Text>
            <Text style={styles.sous}>Des sentiers près de chez toi</Text>
          </View>
          <Image source={AXEL_RANDO} style={styles.axel} contentFit="contain" />
        </View>

        {enCours && (
          <Appui onPress={() => router.push('/randonnee/en-cours')} style={styles.enCours} accessibilityRole="button">
            <Icon name="rando" color={colors.pink} />
            <Text weight="semibold" style={[styles.flex, styles.enCoursTxt]}>
              Rando en cours : reprendre
            </Text>
            <Icon name="right" size={18} color={colors.pink} />
          </Appui>
        )}

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

        {/* Vrais sentiers balisés autour de toi (OpenStreetMap). */}
        <View style={styles.titreLigne}>
          <Text style={styles.h2}>Près de toi</Text>
          {pres.etat === 'ok' && (
            <Appui onPress={() => chercherRandosPres(true)} accessibilityRole="button" accessibilityLabel="Actualiser">
              <Icon name="refresh" size={20} color={colors.textSecondary} />
            </Appui>
          )}
        </View>
        {pres.etat === 'recherche' || (pres.etat === 'vide' && !pres.liste.length) ? (
          <Text style={styles.vide}>Recherche des sentiers balisés autour de toi…</Text>
        ) : pres.etat === 'refus' ? (
          <Text style={styles.vide}>Autorise ta position pour voir les vrais sentiers près de chez toi.</Text>
        ) : pres.etat === 'erreur' && !pres.liste.length ? (
          <Text style={styles.vide}>Impossible de joindre OpenStreetMap pour l’instant. Vérifie ta connexion.</Text>
        ) : !proposee ? (
          <Text style={styles.vide}>Aucun sentier balisé trouvé à moins de 30 km. Essaie une rando libre !</Text>
        ) : (
          <Appui onPress={() => router.push({ pathname: '/randonnee/[id]', params: { id: proposee.s.id } })} style={styles.suggestion} accessibilityRole="button">
            <View style={styles.badgeSemaine}>
              <Text weight="bold" style={styles.badgeTxt}>
                SUGGESTION DU JOUR
              </Text>
            </View>
            <Text weight="bold" style={[styles.semaineNom, styles.mtSugg]} numberOfLines={2}>
              {proposee.s.nom}
            </Text>
            <Text style={styles.semaineLieu}>
              {proposee.s.region}
              {proposee.s.lieu !== 'Sentier balisé' ? ` · ${proposee.s.lieu}` : ''}
            </Text>
            <View style={styles.ligne}>
              <View style={styles.flex}>
                <Chiffres s={proposee.s} clair />
              </View>
              <PastilleDifficulte d={proposee.s.difficulte} />
            </View>
            <Text style={styles.pourquoi}>🧭 {proposee.pourquoi}</Text>
            <Button label="Voir le sentier" iconAfter="right" small onPress={() => router.push({ pathname: '/randonnee/[id]', params: { id: proposee.s.id } })} style={styles.btn} />
          </Appui>
        )}
        {autour.map((s) => (
          <Appui key={s.id} onPress={() => router.push({ pathname: '/randonnee/[id]', params: { id: s.id } })} style={styles.item} accessibilityRole="button" accessibilityLabel={s.nom}>
            <View style={styles.vignetteOsm}>
              <Icon name="montagne" size={28} color={colors.pink} />
            </View>
            <View style={styles.flex}>
              <Text weight="bold" style={styles.itemNom} numberOfLines={1}>
                {s.nom}
              </Text>
              <Text style={styles.itemLieu} numberOfLines={1}>
                {s.region}
              </Text>
              <Chiffres s={s} />
            </View>
            <View style={styles.droite}>
              <PastilleDifficulte d={s.difficulte} />
              <Icon name="right" size={16} color={colors.textSecondary} />
            </View>
          </Appui>
        ))}
        {pres.liste.length > 0 && <Text style={styles.note}>Sentiers et tracés © contributeurs OpenStreetMap · dénivelé calculé avec l’altitude du terrain.</Text>}

        {/* Rando de la semaine */}
        <Text style={styles.h2}>Incontournables</Text>
        <Appui onPress={() => router.push({ pathname: '/randonnee/[id]', params: { id: semaine.id } })} style={styles.semaine} accessibilityRole="button">
          <Image source={photoGrande(semaine.id)} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={ui.voilePhoto} locations={[0.25, 0.6, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.badgeSemaine}>
            <Text weight="bold" style={styles.badgeTxt}>
              RANDO DE LA SEMAINE
            </Text>
          </View>
          <View style={styles.semaineBas}>
            <Text weight="bold" style={styles.semaineNom} numberOfLines={1}>
              {semaine.nom}
            </Text>
            <Text style={styles.semaineLieu}>{semaine.lieu}</Text>
            <View style={styles.ligne}>
              <View style={styles.flex}>
                <Chiffres s={semaine} clair />
              </View>
              <PastilleDifficulte d={semaine.difficulte} />
            </View>
            <Button label="Voir le sentier" iconAfter="right" small onPress={() => router.push({ pathname: '/randonnee/[id]', params: { id: semaine.id } })} style={styles.btn} />
          </View>
        </Appui>

        <Text style={styles.h2}>À explorer</Text>
        {liste.length === 0 && <Text style={styles.vide}>Aucun sentier pour ce filtre pour l’instant.</Text>}
        {liste.map((s, i) => (
          <Animated.View key={s.id} entering={FadeInDown.delay(Math.min(i, 8) * 55).duration(380).springify().damping(18)}>
            <Appui onPress={() => router.push({ pathname: '/randonnee/[id]', params: { id: s.id } })} style={styles.item} accessibilityRole="button" accessibilityLabel={s.nom}>
              <Image source={RANDO_IMAGES[s.id]} style={styles.vignette} contentFit="cover" />
              <View style={styles.flex}>
                <Text weight="bold" style={styles.itemNom} numberOfLines={1}>
                  {s.nom}
                </Text>
                <Text style={styles.itemLieu} numberOfLines={1}>
                  {s.region}
                </Text>
                <Chiffres s={s} />
              </View>
              <View style={styles.droite}>
                <PastilleDifficulte d={s.difficulte} />
                <Icon name="right" size={16} color={colors.textSecondary} />
              </View>
            </Appui>
          </Animated.View>
        ))}

        <View style={styles.libre}>
          <Image source={DECO_IMAGES.sommet} style={styles.libreScene} contentFit="cover" accessibilityIgnoresInvertColors />
          <Text weight="semibold" style={styles.libreTitre}>
            Ton propre sentier ?
          </Text>
          <Text style={styles.vide}>Lance une rando libre : distance, dénivelé et carte Explorateur… si tu atteins un sommet !</Text>
          <Button
            label="Rando libre"
            icon="rando"
            variant="dark"
            onPress={() => {
              useRando.getState().demarrer();
              router.push('/randonnee/en-cours');
            }}
            style={styles.btn}
          />
        </View>
        <Text style={styles.note}>Données indicatives : vérifie le sentier, l’accès et les conditions auprès du parc avant de partir.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  scroll: { paddingHorizontal: 20, paddingBottom: 30 },
  tete: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 6 },
  h1: { ...fonts.bold, fontSize: 38, lineHeight: 44, letterSpacing: -0.8 },
  sous: { fontSize: 16, lineHeight: 21, color: colors.textSecondary, marginTop: 2, marginBottom: 8 },
  axel: { width: 92, height: 138, marginRight: -4 },
  enCours: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 18, backgroundColor: ui.selFond, marginTop: 6 },
  enCoursTxt: { fontSize: 15, lineHeight: 20 },
  filtres: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  filtre: { borderRadius: 100, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 8 },
  filtreOn: { backgroundColor: colors.pink, borderColor: colors.pink },
  filtreTxt: { fontSize: 14, lineHeight: 18 },
  filtreTxtOn: { color: colors.onPrimary },
  semaine: { height: 300, borderRadius: 22, overflow: 'hidden', marginTop: 10, backgroundColor: colors.surface },
  titreLigne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  suggestion: { borderRadius: 22, padding: 16, marginTop: 6, backgroundColor: ui.selFond, borderWidth: 1, borderColor: ui.pinkRing },
  mtSugg: { marginTop: 34 },
  pourquoi: { fontSize: 13.5, lineHeight: 19, color: colors.text, marginTop: 10 },
  vignetteOsm: { width: 92, height: 62, borderRadius: 12, backgroundColor: ui.selFond, alignItems: 'center', justifyContent: 'center' },
  badgeSemaine: { position: 'absolute', top: 14, left: 14, backgroundColor: colors.pink, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5 },
  badgeTxt: { fontSize: 11.5, lineHeight: 15, color: colors.onPrimary, letterSpacing: 0.5 },
  semaineBas: { position: 'absolute', left: 16, right: 16, bottom: 14 },
  semaineNom: { fontSize: 24, lineHeight: 29 },
  semaineLieu: { fontSize: 14, lineHeight: 19, color: colors.textSecondary, marginTop: 1 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  btn: { marginTop: 12 },
  chiffres: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, flexWrap: 'wrap' },
  chiffre: { fontSize: 13, lineHeight: 17 },
  point: { fontSize: 13, lineHeight: 17, marginHorizontal: 1 },
  h2: { ...fonts.bold, fontSize: 24, lineHeight: 30, marginTop: 24, marginBottom: 6 },
  vide: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 20, backgroundColor: colors.surface, marginTop: 8 },
  vignette: { width: 92, height: 62, borderRadius: 12 },
  itemNom: { fontSize: 16, lineHeight: 21 },
  itemLieu: { fontSize: 13, lineHeight: 17, color: colors.textSecondary },
  droite: { alignItems: 'flex-end', gap: 8 },
  libre: { marginTop: 20, padding: 16, borderRadius: 20, backgroundColor: colors.surface },
  libreScene: { marginTop: -16, marginHorizontal: -16, marginBottom: 14, aspectRatio: 16 / 9, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  libreTitre: { fontSize: 17, lineHeight: 22 },
  note: { fontSize: 11.5, lineHeight: 16, color: colors.textSecondary, textAlign: 'center', marginTop: 18 },
});
