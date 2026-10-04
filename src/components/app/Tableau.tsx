/**
 * Blocs de l'Accueil, direction « nuit » (maquette de l'utilisateur, oct. 2026) : deux grands anneaux à lueur
 * (Récupération, Effort), carte du coach, prochaine séance avec image, tuiles Sommeil et VFC.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useShallow } from 'zustand/react/shallow';

import { useRafraichir } from '@/components/app/Cercles';
import { Appui, Card, Icon, Text, type IconName } from '@/components/ui';
import { COACH_IMAGES, DECO_IMAGES } from '@/data';
import { part, type IdCercle } from '@/lib/cercles';
import { coachById } from '@/lib/plan';
import { motivationDuJour } from '@/lib/motivation';
import type { SeanceJour } from '@/lib/semaine';
import { lastNight } from '@/lib/sommeil';
import { useCercles } from '@/store/cercles';
import { useProfil } from '@/store/profil';
import { alpha, colors, fonts, ui } from '@/theme';

const ArcAnime = Animated.createAnimatedComponent(Circle);

/** Grand anneau orange à lueur (arc doublé d'un trait large et transparent), valeur et icône au centre. */
function GrandAnneau({ p, valeur, nom, icone, taille }: { p: number; valeur: string; nom: string; icone: IconName; taille: number }) {
  const trait = 11;
  const r = taille / 2 - 14;
  const tour = 2 * Math.PI * r;
  const v = useSharedValue(0);
  useEffect(() => {
    v.set(withTiming(Math.min(1, Math.max(0, p)), { duration: 900 }));
  }, [v, p]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: tour * (1 - v.value) }));
  const c = taille / 2;
  return (
    <View style={{ width: taille, height: taille, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={taille} height={taille} style={StyleSheet.absoluteFill}>
        <Circle cx={c} cy={c} r={r} stroke={ui.dark} strokeWidth={trait} fill="none" />
        {/* Lueur : même arc, plus large et transparent. */}
        <ArcAnime cx={c} cy={c} r={r} stroke={colors.pink} strokeOpacity={0.18} strokeWidth={trait + 14} fill="none" strokeLinecap="round" strokeDasharray={tour} animatedProps={props} transform={`rotate(-90 ${c} ${c})`} />
        <ArcAnime cx={c} cy={c} r={r} stroke={colors.pink} strokeWidth={trait} fill="none" strokeLinecap="round" strokeDasharray={tour} animatedProps={props} transform={`rotate(-90 ${c} ${c})`} />
      </Svg>
      <Text weight="bold" style={styles.anneauVal}>
        {valeur}
      </Text>
      <Text style={styles.anneauNom}>{nom}</Text>
      <Icon name={icone} size={18} color={colors.pink} />
    </View>
  );
}

/** Récupération (VFC du jour / ta référence) et Effort (Bouger + Exercice) ; toucher ouvre l'écran lié. */
export function AnneauxDuJour() {
  useRafraichir();
  const { semaine, auj } = useCercles();
  const jour = semaine[auj] ?? [];
  const get = (id: IdCercle) => jour.find((c) => c.id === id);
  const rec = get('recup');
  const bouger = get('bouger');
  const exo = get('exercice');
  const effort = bouger && exo ? (Math.min(1, part(bouger)) + Math.min(1, part(exo))) / 2 : 0;
  const recVal = rec?.val ? Math.min(100, rec.val) : 0;
  return (
    <View style={styles.anneaux}>
      <Appui accessibilityRole="button" accessibilityLabel={`Récupération ${recVal || 'à mesurer'}`} onPress={() => router.push('/recuperation')}>
        <GrandAnneau p={recVal / 100} valeur={recVal ? String(recVal) : '—'} nom="Récupération" icone="heart" taille={158} />
      </Appui>
      <Appui accessibilityRole="button" accessibilityLabel={`Effort ${Math.round(effort * 100)}`} onPress={() => router.navigate('/progres')}>
        <GrandAnneau p={effort} valeur={String(Math.round(effort * 100))} nom="Effort" icone="bolt" taille={158} />
      </Appui>
    </View>
  );
}

/** État de récupération en une phrase (titre de la carte du coach). */
function phraseRecup(val: number): string {
  if (!val) return 'Mesure ta récupération ?';
  if (val >= 90) return 'Tu as bien récupéré.';
  if (val >= 75) return 'Récupération correcte.';
  return 'Tu es un peu fatigué.';
}

/** Carte du coach : sa tête, ton état du jour, son message (motivation du jour) ; ouvre la conversation. */
export function CarteCoach() {
  const { coach, progStart, name } = useProfil(useShallow((s) => ({ coach: s.coach, progStart: s.progStart, name: s.name })));
  const { semaine, auj } = useCercles();
  const rec = (semaine[auj] ?? []).find((c) => c.id === 'recup');
  const c = coachById(coach);
  return (
    <Appui accessibilityRole="button" accessibilityLabel={`Parler à ${c.nom}`} onPress={() => router.navigate('/coach')}>
      <Card style={styles.coach}>
        <View style={styles.tete}>
          <Image source={COACH_IMAGES[c.id].tete} style={styles.teteImg} contentFit="cover" />
        </View>
        <View style={styles.flex}>
          <Text weight="bold" style={styles.coachTitre}>
            {phraseRecup(rec?.val ?? 0)}
          </Text>
          <Text style={styles.coachTxt} numberOfLines={2}>
            {motivationDuJour(progStart, name)}
          </Text>
        </View>
        <Icon name="right" size={18} color={colors.textSecondary} />
      </Card>
    </Appui>
  );
}

/** Prochaine séance : libellé, titre, durée · exercices, Commencer ; image à droite qui se fond dans la carte. */
export function CarteSeance({ s, offset, onCommencer }: { s: SeanceJour; offset: number; onCommencer: () => void }) {
  const quand = offset === 0 ? 'Ta séance du jour' : offset === 1 ? 'Demain' : 'Ta prochaine séance';
  return (
    <Appui
      accessibilityRole="button"
      accessibilityLabel={`Voir la séance ${s.titre}`}
      onPress={() => (s.day != null ? router.push(`/seance/${s.day}`) : router.navigate('/programme'))}
    >
      <Card style={styles.seance}>
        <Image source={offset === 0 ? DECO_IMAGES.salle : DECO_IMAGES.etirement} style={styles.seanceImg} contentFit="cover" />
        <LinearGradient colors={[colors.surface, alpha(colors.surface, 0.85), alpha(colors.surface, 0)]} locations={[0.35, 0.55, 0.85]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={styles.seanceTxt}>
          <Text style={styles.petit}>{quand}</Text>
          <Text weight="bold" style={styles.seanceTitre} numberOfLines={2}>
            {s.titre}
          </Text>
          <Text style={styles.meta}>
            {Math.round(s.min)} min{s.ride ? ' · sortie' : ` · ${s.items.length} exercices`}
          </Text>
          <Appui accessibilityRole="button" onPress={onCommencer} style={styles.commencer}>
            <Icon name="play" size={18} color={colors.onPrimary} strokeWidth={2.4} />
            <Text weight="semibold" style={styles.commencerTxt}>
              {s.ride ? 'Lancer' : 'Commencer'}
            </Text>
          </Appui>
        </View>
      </Card>
    </Appui>
  );
}

/** Une tuile : pastille d'icône colorée, libellé, grande valeur, chevron. */
function Tuile({ icone, couleur, nom, valeur, onPress }: { icone: IconName; couleur: string; nom: string; valeur: string; onPress: () => void }) {
  return (
    <Appui accessibilityRole="button" accessibilityLabel={`${nom} ${valeur}`} onPress={onPress} style={styles.flex}>
      <Card style={styles.tuile}>
        <View style={[styles.tuileIc, { backgroundColor: alpha(couleur, 0.16) }]}>
          <Icon name={icone} size={20} color={couleur} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.petit}>{nom}</Text>
          <Text weight="bold" style={styles.tuileVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {valeur}
          </Text>
        </View>
        <Icon name="right" size={16} color={colors.textSecondary} />
      </Card>
    </Appui>
  );
}

/** Sommeil de la dernière nuit et dernière VFC (mesure du matin, sinon nuit). */
export function TuilesSante() {
  const { nights, hrvChecks } = useProfil(useShallow((s) => ({ nights: s.nights, hrvChecks: s.hrvChecks })));
  const n = lastNight(nights);
  const h = n ? Math.floor(n.h) : 0;
  const m = n ? Math.round((n.h - h) * 60) : 0;
  const vfc = hrvChecks[hrvChecks.length - 1]?.hrv ?? n?.hrv ?? null;
  return (
    <View style={styles.tuiles}>
      <Tuile icone="moon" couleur={ui.tuileSommeil} nom="Sommeil" valeur={n ? `${h} h ${String(m).padStart(2, '0')}` : '—'} onPress={() => router.push('/sommeil')} />
      <Tuile icone="pulse" couleur={ui.tuileVfc} nom="VFC" valeur={vfc ? `${vfc} ms` : '—'} onPress={() => router.push('/recuperation')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  anneaux: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 6 },
  anneauVal: { fontSize: 38, lineHeight: 44, letterSpacing: -1 },
  anneauNom: { fontSize: 14, lineHeight: 18, color: colors.text, marginBottom: 4 },
  coach: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  tete: { width: 62, height: 62, borderRadius: 31, overflow: 'hidden', backgroundColor: ui.iconBg, boxShadow: `0 0 18px ${alpha(colors.pink, 0.3)}` },
  teteImg: { width: '100%', height: '100%' },
  coachTitre: { fontSize: 17, lineHeight: 22 },
  coachTxt: { fontSize: 13.5, lineHeight: 18, color: colors.textSecondary, marginTop: 2 },
  seance: { padding: 0, overflow: 'hidden', minHeight: 176 },
  seanceImg: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '62%' },
  seanceTxt: { padding: 18, gap: 4, width: '68%' },
  petit: { fontSize: 13, lineHeight: 17, color: colors.textSecondary },
  seanceTitre: { fontSize: 26, lineHeight: 31, letterSpacing: -0.4 },
  meta: { fontSize: 15, lineHeight: 20, color: colors.textSecondary },
  commencer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.pink,
    alignSelf: 'flex-start',
    paddingHorizontal: 30,
    boxShadow: `0 6px 22px ${alpha(colors.pink, 0.4)}`,
  },
  commencerTxt: { ...fonts.semibold, fontSize: 16, lineHeight: 20, color: colors.onPrimary },
  tuiles: { flexDirection: 'row', gap: 12 },
  tuile: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 12 },
  tuileIc: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  tuileVal: { fontSize: 20, lineHeight: 25, letterSpacing: -0.3 },
});
