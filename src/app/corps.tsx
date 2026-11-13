import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { CarteMuscles, couleurPourcent, groupeExercice } from '@/components/app/CarteMuscles';
import { Sheet } from '@/components/app/Sheet';
import { Appui, Card, Icon, Text } from '@/components/ui';
import { alertes, BLOCS, delai, NOM_MUSCLE, recuperationMuscles, REGIONS, statut, suggestion, texteAlerte, type Entree, type Muscle } from '@/lib/corps';
import { locale } from '@/i18n';
import { useProfil } from '@/store/profil';
import { colors } from '@/theme';

/**
 * « Ton corps » (design Process « Corps », v2-flow-body, MuscleRecoveryView) : silhouette de face et de dos colorée par la
 * récupération de chaque muscle, moyenne en anneau, séance conseillée du jour, alertes, puis les 15 muscles par région
 * (pourcentage, barre, délai avant une séance légère ou intense) ; toucher un muscle = les séances qui pèsent encore dessus.
 * Le jumeau 3D du design n'est pas repris : ses modèles 3D (avatar .glb) ne sont pas fournis dans le paquet.
 */
export default function Corps() {
  const logs = useProfil((s) => s.logs);
  const { width } = useWindowDimensions();
  const [ouvert, setOuvert] = useState<Muscle | null>(null);
  // Heure de référence fixée à l'ouverture de l'écran.
  const [now] = useState(() => Date.now());
  const entrees = recuperationMuscles(logs, groupeExercice, now);
  const par = new Map(entrees.map((e) => [e.muscle, e]));
  const moyenne = Math.floor(entrees.reduce((a, e) => a + e.pourcent, 0) / entrees.length);
  const prets = entrees.filter((e) => e.etat === 'pret').length;
  const plusFatigue = entrees.reduce((a, e) => (e.pourcent < a.pourcent ? e : a));
  const conseil = suggestion(entrees);
  const avis = alertes(entrees, logs, groupeExercice, now);
  const larg = Math.min(170, (width - 32 - 24) / 2);
  const detail = ouvert ? par.get(ouvert) : undefined;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.head}>
        <Appui accessibilityRole="button" accessibilityLabel="Retour" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/progres'))} style={styles.rond}>
          <Icon name="left" />
        </Appui>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.titres}>
          <Text weight="bold" style={styles.h1} accessibilityRole="header">
            Ton corps
          </Text>
          <Text style={styles.sous}>
            {prets} muscles sur {entrees.length} prêts pour une séance intense
          </Text>
        </View>

        <Card style={styles.silhouettes}>
          <View style={styles.vue}>
            <CarteMuscles vue="face" entrees={entrees} largeur={larg} choisi={ouvert} />
            <Text variant="label">De face</Text>
          </View>
          <View style={styles.vue}>
            <CarteMuscles vue="dos" entrees={entrees} largeur={larg} choisi={ouvert} />
            <Text variant="label">De dos</Text>
          </View>
        </Card>
        <View style={styles.legende}>
          {(
            [
              [colors.good, 'Récupéré'],
              [colors.warn, 'En récupération'],
              [colors.error, 'Fatigué'],
              [colors.surface2, 'Pas travaillé'],
            ] as const
          ).map(([c, l]) => (
            <View key={l} style={styles.legendeItem}>
              <View style={[styles.point, { backgroundColor: c }]} />
              <Text style={styles.petit}>{l}</Text>
            </View>
          ))}
        </View>

        <Card style={styles.resume}>
          <Anneau pourcent={moyenne} />
          <View style={styles.flex}>
            <Text weight="semibold" style={styles.resumeTitre}>
              Récupération musculaire moyenne
            </Text>
            {plusFatigue.pourcent < 100 && (
              <Text style={styles.petit}>
                Le plus fatigué : {NOM_MUSCLE[plusFatigue.muscle]} ({plusFatigue.pourcent} %)
              </Text>
            )}
          </View>
        </Card>

        <Text variant="label" style={styles.section}>
          Séance conseillée aujourd’hui
        </Text>
        <Card style={styles.conseil}>
          <Icon name="dumb" size={20} color={colors.good} />
          <View style={styles.flex}>
            {conseil ? (
              <>
                <Text weight="semibold" style={styles.conseilTitre}>
                  {BLOCS[conseil.bloc].titre} : {conseil.moyenne} % récupérés
                </Text>
                <Text style={styles.petit}>
                  {conseil.menager.length ? `Vas-y doucement sur : ${conseil.menager.map((m) => NOM_MUSCLE[m]).join(', ')}` : 'Tous tes muscles sont prêts : tu peux y aller fort.'}
                </Text>
              </>
            ) : (
              <>
                <Text weight="semibold" style={styles.conseilTitre}>
                  Journée de récupération active
                </Text>
                <Text style={styles.petit}>Aucun bloc musculaire n’est tout à fait prêt. Marche, mobilité ou cardio léger.</Text>
              </>
            )}
          </View>
        </Card>
        {avis.map((a) => (
          <Card key={a.type + a.muscle} style={styles.alerte}>
            <Icon name="info" size={18} color={a.type === 'surcharge' ? colors.error : colors.warn} />
            <Text style={[styles.flex, styles.alerteTxt]}>{texteAlerte(a)}</Text>
          </Card>
        ))}

        {REGIONS.map(([titre, muscles]) => (
          <View key={titre} style={styles.region}>
            <Text variant="label">{titre}</Text>
            {muscles.map((m) => (
              <Ligne key={m} e={par.get(m)!} onPress={() => setOuvert(m)} />
            ))}
          </View>
        ))}
        <Text style={styles.note}>
          Estimé à partir de tes séances (exercices et séries quand ils sont enregistrés, sinon sport, durée et intensité) et de tes habitudes sur 28 jours.
        </Text>
      </ScrollView>

      <Sheet visible={!!detail} onClose={() => setOuvert(null)} title={detail ? NOM_MUSCLE[detail.muscle] : ''}>
        {detail && <Detail e={detail} />}
      </Sheet>
    </SafeAreaView>
  );
}

function Anneau({ pourcent }: { pourcent: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <View style={styles.anneau}>
      <Svg width={96} height={96} style={StyleSheet.absoluteFill}>
        <Circle cx={48} cy={48} r={r} stroke={colors.surface2} strokeWidth={10} fill="none" />
        <Circle
          cx={48}
          cy={48}
          r={r}
          stroke={couleurPourcent(pourcent)}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(c * pourcent) / 100} ${c}`}
          transform="rotate(-90 48 48)"
        />
      </Svg>
      <Text weight="bold" style={styles.anneauTxt}>
        {pourcent} %
      </Text>
    </View>
  );
}

function Ligne({ e, onPress }: { e: Entree; onPress: () => void }) {
  const c = couleurPourcent(e.pourcent);
  return (
    <Appui accessibilityRole="button" accessibilityLabel={`${NOM_MUSCLE[e.muscle]}, ${e.pourcent} %. ${statut(e)}`} onPress={onPress}>
      <Card style={styles.ligne}>
        <View style={styles.ligneHaut}>
          <Text weight="semibold" style={styles.ligneNom}>
            {NOM_MUSCLE[e.muscle]}
          </Text>
          <Text weight="bold" style={[styles.lignePc, { color: c }]}>
            {e.pourcent} %
          </Text>
          <Icon name="right" size={14} color={colors.textTertiary} />
        </View>
        <View style={styles.barre}>
          <View style={[styles.barrePlein, { width: `${e.pourcent}%`, backgroundColor: c }]} />
        </View>
        <Text style={styles.petit}>{statut(e)}</Text>
      </Card>
    </Appui>
  );
}

function Detail({ e }: { e: Entree }) {
  return (
    <View style={styles.detail}>
      <Text weight="bold" style={[styles.detailPc, { color: couleurPourcent(e.pourcent) }]}>
        {e.pourcent} % récupéré
      </Text>
      <Text style={styles.sous}>{statut(e)}</Text>
      <View style={styles.detailChiffres}>
        <Chiffre titre="Séance légère" valeur={e.heuresLeger ? `dans ${delai(e.heuresLeger)}` : 'Maintenant'} />
        <Chiffre titre="Séance intense" valeur={e.heuresIntense ? `dans ${delai(e.heuresIntense)}` : 'Maintenant'} />
        <Chiffre titre="Jours travaillés (28 j)" valeur={String(e.jours28)} />
      </View>
      <Text variant="label" style={styles.section}>
        Séances qui pèsent encore
      </Text>
      {e.sources.length === 0 ? (
        <Text style={styles.petit}>Aucune : ce muscle a complètement récupéré.</Text>
      ) : (
        e.sources.slice(0, 6).map((s) => (
          <View key={s.d + s.titre} style={styles.source}>
            <View style={styles.flex}>
              <Text weight="semibold" style={styles.sourceTitre} numberOfLines={1}>
                {s.titre}
              </Text>
              <Text style={styles.petit}>{new Date(s.d).toLocaleString(locale(), { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function Chiffre({ titre, valeur }: { titre: string; valeur: string }) {
  return (
    <View style={styles.chiffre}>
      <Text variant="label">{titre}</Text>
      <Text weight="semibold" style={styles.chiffreVal}>
        {valeur}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  head: { paddingHorizontal: 16, paddingTop: 6 },
  rond: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingBottom: 60, gap: 12 },
  titres: { gap: 4, marginTop: 8 },
  h1: { fontSize: 30, lineHeight: 36, letterSpacing: -0.9 },
  sous: { fontSize: 15, lineHeight: 20, color: colors.textSecondary },
  flex: { flex: 1, minWidth: 0 },
  silhouettes: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 18, marginTop: 6 },
  vue: { alignItems: 'center', gap: 8 },
  legende: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14 },
  legendeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  point: { width: 8, height: 8, borderRadius: 4 },
  petit: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  resume: { flexDirection: 'row', alignItems: 'center', gap: 18, padding: 18 },
  anneau: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  anneauTxt: { fontSize: 22, lineHeight: 28, fontVariant: ['tabular-nums'] },
  resumeTitre: { fontSize: 15, lineHeight: 20, marginBottom: 4 },
  section: { marginTop: 14 },
  conseil: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
  conseilTitre: { fontSize: 16, lineHeight: 21, marginBottom: 2 },
  alerte: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14 },
  alerteTxt: { fontSize: 13.5, lineHeight: 19 },
  region: { gap: 8, marginTop: 14 },
  ligne: { padding: 14, gap: 8 },
  ligneHaut: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ligneNom: { flex: 1, fontSize: 16, lineHeight: 21 },
  lignePc: { fontSize: 16, lineHeight: 21, fontVariant: ['tabular-nums'] },
  barre: { height: 5, borderRadius: 3, backgroundColor: colors.surface2, overflow: 'hidden' },
  barrePlein: { height: 5, borderRadius: 3 },
  note: { fontSize: 12, lineHeight: 17, color: colors.textTertiary, marginTop: 14 },
  detail: { gap: 6, paddingBottom: 12 },
  detailPc: { fontSize: 28, lineHeight: 34, letterSpacing: -0.8 },
  detailChiffres: { flexDirection: 'row', gap: 8, marginTop: 10 },
  chiffre: { flex: 1, borderRadius: 14, backgroundColor: colors.surface2, padding: 12, gap: 6 },
  chiffreVal: { fontSize: 15, lineHeight: 20 },
  source: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  sourceTitre: { fontSize: 15, lineHeight: 20 },
});
