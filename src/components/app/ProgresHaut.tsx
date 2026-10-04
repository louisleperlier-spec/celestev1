/**
 * Haut de l'onglet Progrès, direction « nuit » (maquette de l'utilisateur, oct. 2026) : jours de régularité en grand
 * (halo de points orange), semaine cochée, tuiles séances / cartes gagnées, dernière récompense (carte succès) et collection.
 */
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useShallow } from 'zustand/react/shallow';

import { Appui, Card, Icon, Text, type IconName } from '@/components/ui';
import { SUCCES_IMAGES, SUCCES_RATIO } from '@/data/succesImages';
import { possedees, RARETES } from '@/lib/jeu';
import { weekDates } from '@/lib/semaine';
import { missionsPrises, SUCCES, type Succes } from '@/lib/succes';
import { streak } from '@/lib/xp';
import { useProfil } from '@/store/profil';
import { alpha, colors, fonts, ui } from '@/theme';

const LETTRES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const PHRASES: Record<Succes['id'], string> = {
  'premier-pas': 'Le début de tout. Bravo pour ce premier pas.',
  endurance: 'Garde le rythme, tu tiens la distance.',
  force: 'Plus fort chaque jour.',
  explorateur: 'Toujours plus loin. Chaque pas compte.',
  inarretable: 'La force de l’habitude.',
};

/** Halo de points orange autour du grand chiffre (anneaux concentriques, de plus en plus transparents). */
function Halo({ taille }: { taille: number }) {
  const c = taille / 2;
  const points: { x: number; y: number; o: number }[] = [];
  for (let a = 0; a < 5; a++) {
    const r = 46 + a * 13;
    const n = Math.round((2 * Math.PI * r) / 11);
    for (let k = 0; k < n; k++) {
      const t = (k / n) * 2 * Math.PI;
      points.push({ x: c + r * Math.cos(t), y: c + r * Math.sin(t), o: 0.75 - a * 0.14 });
    }
  }
  return (
    <Svg width={taille} height={taille} style={StyleSheet.absoluteFill}>
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={1.7} fill={colors.pink} fillOpacity={p.o} />
      ))}
    </Svg>
  );
}

/** Une tuile chiffrée (icône orange, nombre, libellé, chevron). */
function Tuile({ icone, n, nom, onPress }: { icone: IconName; n: number; nom: string; onPress: () => void }) {
  return (
    <Appui accessibilityRole="button" accessibilityLabel={`${n} ${nom}`} onPress={onPress} style={styles.flex}>
      <Card style={styles.tuile}>
        <Icon name={icone} size={26} color={colors.pink} strokeWidth={2.2} />
        <View style={styles.flex}>
          <Text weight="bold" style={styles.tuileN}>
            {n}
          </Text>
          <Text style={styles.petit} numberOfLines={2}>
            {nom}
          </Text>
        </View>
        <Icon name="right" size={16} color={colors.textSecondary} />
      </Card>
    </Appui>
  );
}

export function ProgresHaut() {
  const { logs, days, jeu } = useProfil(useShallow((s) => ({ logs: s.logs, days: s.days, jeu: s.jeu })));
  const serie = streak(logs, days);
  const wd = weekDates();
  // Dernière récompense : la carte succès de la dernière mission récompensée.
  const prises = missionsPrises(jeu);
  const derniere = [...prises].reverse().map((m) => SUCCES.find((s) => m.startsWith(s.id + ':'))).find(Boolean) ?? null;
  return (
    <View style={styles.wrap}>
      <View style={styles.tete}>
        <Text weight="bold" style={styles.h1} accessibilityRole="header">
          Tes progrès
        </Text>
        <Appui accessibilityRole="button" accessibilityLabel="Mon profil" onPress={() => router.navigate('/profil')} style={styles.rond}>
          <Icon name="user" size={21} />
        </Appui>
      </View>

      <View style={styles.serie}>
        <View style={styles.haloZone}>
          <Halo taille={210} />
          <Text weight="bold" style={styles.grand}>
            {serie}
          </Text>
        </View>
        <Text weight="semibold" style={styles.serieTxt}>
          {serie > 1 ? 'jours de régularité' : 'jour de régularité'}
        </Text>
        <Text style={styles.petitC}>Chaque effort compte.</Text>
      </View>

      <View style={styles.semaine}>
        {wd.map((d, i) => {
          const fait = logs.some((l) => new Date(l.d).toDateString() === d.toDateString());
          return (
            <View key={i} style={styles.jour}>
              <Text weight="medium" style={styles.lettre}>
                {LETTRES[i]}
              </Text>
              <View style={[styles.point, fait && styles.pointFait]}>{fait && <Icon name="check" size={14} strokeWidth={3} color={colors.onPrimary} />}</View>
            </View>
          );
        })}
      </View>

      <View style={styles.tuiles}>
        <Tuile icone="chart" n={logs.length} nom={logs.length > 1 ? 'séances' : 'séance'} onPress={() => router.navigate({ pathname: '/programme', params: { vue: 'calendrier' } })} />
        <Tuile icone="trophy" n={possedees(jeu)} nom="cartes gagnées" onPress={() => router.push('/cartes')} />
      </View>

      <Text weight="bold" style={styles.h2}>
        {derniere ? 'Ta dernière récompense' : 'Ta prochaine récompense'}
      </Text>
      <Appui accessibilityRole="button" onPress={() => router.push('/cartes')}>
        <Card style={[styles.recompense, { borderColor: alpha(ui.rarete[(derniere ?? SUCCES[0]).rarete], 0.7) }]}>
          <Image source={SUCCES_IMAGES[(derniere ?? SUCCES[0]).id]} style={[styles.recImg, !derniere && styles.terne]} contentFit="cover" />
          <View style={styles.flex}>
            <Text weight="bold" style={styles.recNom}>
              {(derniere ?? SUCCES[0]).nom}
            </Text>
            <View style={[styles.rarete, { borderColor: ui.rarete[(derniere ?? SUCCES[0]).rarete] }]}>
              <Icon name="star" size={13} color={ui.rarete[(derniere ?? SUCCES[0]).rarete]} fill={ui.rarete[(derniere ?? SUCCES[0]).rarete]} />
              <Text weight="semibold" style={[styles.rareteTxt, { color: ui.rarete[(derniere ?? SUCCES[0]).rarete] }]}>
                {RARETES[(derniere ?? SUCCES[0]).rarete]}
              </Text>
            </View>
            <Text style={styles.petit}>{derniere ? PHRASES[derniere.id] : 'Termine ta première activité pour la débloquer.'}</Text>
            <Text weight="bold" style={styles.xp}>
              +{(derniere ?? SUCCES[0]).missions.reduce((a, m) => a + m.xp, 0)} XP
            </Text>
          </View>
        </Card>
      </Appui>
      <Appui accessibilityRole="button" onPress={() => router.push('/cartes')} style={styles.collection}>
        <Icon name="book" size={18} color={colors.text} />
        <Text weight="semibold" style={styles.collectionTxt}>
          Voir ma collection
        </Text>
        <Icon name="right" size={16} color={colors.textSecondary} />
      </Appui>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  wrap: { paddingHorizontal: 20, paddingTop: 10, gap: 14 },
  tete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontSize: 30, lineHeight: 36, letterSpacing: -0.4 },
  rond: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  serie: { alignItems: 'center', marginTop: -6 },
  haloZone: { width: 210, height: 170, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  grand: { fontSize: 104, lineHeight: 116, color: colors.pink, letterSpacing: -4 },
  serieTxt: { fontSize: 18, lineHeight: 23, marginTop: -6 },
  petitC: { fontSize: 15, lineHeight: 20, color: colors.textSecondary, marginTop: 2 },
  semaine: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  jour: { alignItems: 'center', gap: 8 },
  lettre: { fontSize: 13, lineHeight: 17, color: colors.textSecondary },
  point: { width: 26, height: 26, borderRadius: 13, backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center' },
  pointFait: { backgroundColor: colors.pink, boxShadow: `0 0 10px ${alpha(colors.pink, 0.5)}` },
  tuiles: { flexDirection: 'row', gap: 12 },
  tuile: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  tuileN: { fontSize: 22, lineHeight: 27 },
  petit: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  h2: { fontSize: 18, lineHeight: 23, marginTop: 4 },
  recompense: { flexDirection: 'row', gap: 14, padding: 12, borderWidth: 1.5 },
  recImg: { width: 120, height: 120 / SUCCES_RATIO, borderRadius: 12 },
  terne: { opacity: 0.35 },
  recNom: { fontSize: 20, lineHeight: 25 },
  rarete: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 3, marginVertical: 8 },
  rareteTxt: { fontSize: 13, lineHeight: 17 },
  xp: { fontSize: 20, lineHeight: 25, color: colors.pink, marginTop: 10 },
  collection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border2,
  },
  collectionTxt: { ...fonts.semibold, fontSize: 15, lineHeight: 20 },
});
