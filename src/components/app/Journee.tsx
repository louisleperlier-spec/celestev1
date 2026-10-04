import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming, ZoomIn } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { lancerSortie } from '@/components/app/lancerSortie';
import { Appui, Card, Icon, Text } from '@/components/ui';
import { phraseJournee, tachesDuJour, journeeDu, type Tache } from '@/lib/journee';
import { todayIdx } from '@/lib/plan';
import { nextSession } from '@/lib/semaine';
import { feter } from '@/store/jeu';
import { useCercles } from '@/store/cercles';
import { useProfil, useSemaine } from '@/store/profil';
import { colors, ui } from '@/theme';

const CercleAnime = Animated.createAnimatedComponent(Circle);
const T = 46;
const R = 19;
const TOUR = 2 * Math.PI * R;

/** Anneau de la journée (tâches faites / total), qui se remplit en douceur. */
function Anneau({ part, texte }: { part: number; texte: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(part, { duration: 700 }));
  }, [p, part]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: TOUR * (1 - p.value) }));
  return (
    <View style={styles.anneau}>
      <Svg width={T} height={T} style={StyleSheet.absoluteFill}>
        <Circle cx={T / 2} cy={T / 2} r={R} stroke={ui.dark} strokeWidth={5} fill="none" />
        <CercleAnime
          cx={T / 2}
          cy={T / 2}
          r={R}
          stroke={colors.pink}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={TOUR}
          animatedProps={props}
          transform={`rotate(-90 ${T / 2} ${T / 2})`}
        />
      </Svg>
      <Text weight="bold" style={styles.anneauTxt}>
        {texte}
      </Text>
    </View>
  );
}

/**
 * « Ta journée » (Accueil) : séance, objectif Bouger, mesure de récupération, nuit, eau, pause respiration.
 * Toucher une ligne ouvre l'écran qui va avec ; l'eau et la respiration se cochent ici. Tout coché : fête et +30 XP.
 */
export function Journee() {
  const p = useProfil();
  const sem = useSemaine();
  const { semaine, auj } = useCercles();
  const cercles = semaine[auj] ?? [];
  const ns = nextSession(sem);
  const s = ns.offset === 0 ? ns.s : null;
  const taches = tachesDuJour({
    logs: p.logs,
    hrvChecks: p.hrvChecks,
    nights: p.nights,
    journee: p.journee,
    seance: s ? { titre: s.titre, min: s.min, sortie: !!s.ride } : null,
    bouger: cercles.find((c) => c.id === 'bouger') ?? { id: 'bouger', nom: 'Bouger', val: 0, obj: 300, unite: 'kcal' },
    exercice: cercles.find((c) => c.id === 'exercice') ?? { id: 'exercice', nom: 'Exercice', val: 0, obj: 30, unite: 'min' },
  });
  const faites = taches.filter((t) => t.fait).length;
  const toutFait = faites === taches.length;
  const dejaFetee = !!journeeDu(p.journee).fete;

  // Journée parfaite : une fête et 30 XP, une seule fois par jour.
  useEffect(() => {
    if (!toutFait || dejaFetee) return;
    const st = useProfil.getState();
    st.marquerJourneeFetee();
    st.addXp(30, 'Journée parfaite');
    feter({ titre: 'Journée parfaite !', sous: 'Tu as coché tout ce qui fait une bonne journée 🌟', emoji: '☀️', gains: ['+30 XP'] });
  }, [toutFait, dejaFetee]);

  const ouvrir = (t: Tache) => {
    const st = useProfil.getState();
    if (t.id === 'eau') return st.ajouterVerre();
    if (t.id === 'calme') return st.basculerCalme();
    if (t.id === 'recup') return router.push('/recuperation');
    if (t.id === 'nuit') return router.push({ pathname: '/sommeil', params: t.fait ? {} : { ajout: '1' } });
    if (t.id === 'bouger') return router.navigate('/velo');
    if (s?.ride) return lancerSortie(s.ride);
    if (s && s.day != null) return router.push({ pathname: '/seance/[jour]', params: { jour: String(s.day ?? todayIdx()) } });
    router.navigate('/rando');
  };

  return (
    <Card style={styles.carte}>
      <View style={styles.tete}>
        <View style={styles.flex}>
          <Text weight="semibold" style={styles.titre}>
            Ta journée
          </Text>
          <Text style={styles.phrase}>{phraseJournee(faites, taches.length)}</Text>
        </View>
        <Anneau part={faites / taches.length} texte={`${faites}/${taches.length}`} />
      </View>
      {taches.map((t) => (
        <Appui key={t.id} onPress={() => ouvrir(t)} style={styles.ligne} accessibilityRole="button" accessibilityLabel={`${t.titre}, ${t.fait ? 'fait' : t.sous}`}>
          <View style={[styles.ic, t.fait && styles.icFait]}>
            {t.fait ? (
              <Animated.View key="ok" entering={ZoomIn.springify().damping(12)}>
                <Icon name="check" size={17} strokeWidth={3} color={colors.onPrimary} />
              </Animated.View>
            ) : (
              <Icon name={t.icone} size={18} color={colors.pink} />
            )}
          </View>
          <View style={styles.flex}>
            <Text weight="semibold" style={[styles.tTitre, t.fait && styles.tFait]} numberOfLines={1}>
              {t.titre}
            </Text>
            <Text style={styles.tSous} numberOfLines={1}>
              {t.sous}
            </Text>
            {t.progres > 0 && t.progres < 1 && (
              <View style={styles.barre}>
                <View style={[styles.rempli, { width: `${t.progres * 100}%` }]} />
              </View>
            )}
          </View>
          {t.id === 'eau' && !t.fait ? (
            <View style={styles.plus}>
              <Icon name="plus" size={18} strokeWidth={2.6} color={colors.onPrimary} />
            </View>
          ) : (
            <Icon name="right" size={16} color={colors.textSecondary} />
          )}
        </Appui>
      ))}
      <Text style={styles.soir}>🌙 Ce soir : au lit vers {p.nset.bedT} pour bien récupérer</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  carte: { padding: 16, gap: 4 },
  tete: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  flex: { flex: 1, minWidth: 0 },
  titre: { fontSize: 18, lineHeight: 23 },
  phrase: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, marginTop: 2 },
  anneau: { width: T, height: T, alignItems: 'center', justifyContent: 'center' },
  anneauTxt: { fontSize: 12.5, lineHeight: 16 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  ic: { width: 36, height: 36, borderRadius: 18, backgroundColor: ui.iconBg, alignItems: 'center', justifyContent: 'center' },
  icFait: { backgroundColor: colors.pink },
  tTitre: { fontSize: 15, lineHeight: 20 },
  tFait: { color: colors.textSecondary },
  tSous: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  barre: { height: 4, borderRadius: 2, backgroundColor: ui.dark, marginTop: 5, overflow: 'hidden' },
  rempli: { height: 4, borderRadius: 2, backgroundColor: colors.pink },
  plus: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center' },
  soir: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
});
