/**
 * Haut de l'onglet Programme, direction « nuit » (maquette de l'utilisateur, oct. 2026) : la semaine (jours faits, séances
 * prévues), la carte du programme suivi avec sa progression, et « Aujourd'hui » (image, durée, exercices, Lancer la séance).
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { lancerSortie } from '@/components/app/lancerSortie';
import { Appui, Card, Icon, Text } from '@/components/ui';
import { DECO_IMAGES, EXERCICE_IMAGES } from '@/data';
import { exercice, lvlN, LVLN, prog, progWeek, todayIdx } from '@/lib/plan';
import { nextSession, sessionForDay, weekDates } from '@/lib/semaine';
import { selectProfil, useProfil, useSemaine } from '@/store/profil';
import { alpha, colors, fonts, ui } from '@/theme';

const LETTRES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Ligne de la semaine : coche orange = activité faite, point orange = séance prévue, gris = libre. */
export function SemaineJours() {
  const sem = useSemaine();
  const logs = useProfil((s) => s.logs);
  const wd = weekDates();
  const auj = todayIdx();
  return (
    <View style={styles.semaine}>
      <Appui accessibilityRole="button" accessibilityLabel="Calendrier" onPress={() => router.navigate({ pathname: '/programme', params: { vue: 'calendrier' } })} style={styles.fleche}>
        <Icon name="left" size={16} color={colors.textSecondary} />
      </Appui>
      {wd.map((d, i) => {
        const fait = logs.some((l) => new Date(l.d).toDateString() === d.toDateString());
        const prevu = !!sessionForDay(sem, i);
        return (
          <View key={i} style={styles.jour}>
            <Text weight={i === auj ? 'bold' : 'medium'} style={[styles.lettre, i === auj && styles.lettreAuj]}>
              {LETTRES[i]}
            </Text>
            <View style={[styles.point, prevu && styles.pointPrevu, fait && styles.pointFait]}>
              {fait && <Icon name="check" size={13} strokeWidth={3} color={colors.onPrimary} />}
            </View>
          </View>
        );
      })}
      <Appui accessibilityRole="button" accessibilityLabel="Calendrier" onPress={() => router.navigate({ pathname: '/programme', params: { vue: 'calendrier' } })} style={styles.fleche}>
        <Icon name="right" size={16} color={colors.textSecondary} />
      </Appui>
    </View>
  );
}

/** Programme suivi : nom, semaine n sur N, barre de progression et pourcentage. */
export function CarteProgramme() {
  const p = useProfil(useShallow(selectProfil));
  const pr = prog(p);
  const n = progWeek(p);
  const pc = Math.round((Math.max(0, n - 1) / pr.sem) * 100 + 100 / pr.sem / 2);
  return (
    <Appui accessibilityRole="button" accessibilityLabel={`${pr.nom}, semaine ${n} sur ${pr.sem}`} onPress={() => router.push(`/plan/${pr.id}`)}>
      <Card style={styles.prog}>
        <View style={styles.progIc}>
          <Icon name="chart" size={22} color={colors.pink} strokeWidth={2.2} />
        </View>
        <View style={styles.flex}>
          <Text weight="bold" style={styles.progNom} numberOfLines={1}>
            {pr.nom}
          </Text>
          <Text style={styles.petit}>
            Semaine {n} sur {pr.sem}
          </Text>
          <View style={styles.progLigne}>
            <View style={styles.barre}>
              <View style={[styles.rempli, { width: `${Math.min(100, pc)}%` }]} />
            </View>
            <Text style={styles.petit}>{Math.min(100, pc)} %</Text>
          </View>
        </View>
        <Icon name="right" size={18} color={colors.textSecondary} />
      </Card>
    </Appui>
  );
}

/** « Aujourd'hui » : la séance du jour (ou la prochaine), ses 3 premiers exercices et Lancer la séance. */
export function Aujourdhui() {
  const sem = useSemaine();
  const level = useProfil((s) => s.level);
  const ns = nextSession(sem);
  const s = ns.s;
  const titre = ns.offset === 0 ? 'Aujourd’hui' : ns.offset === 1 ? 'Demain' : 'Prochaine séance';
  const lancer = () => {
    if (s.ride) return lancerSortie(s.min, s.cat);
    if (s.day == null) return;
    router.push({ pathname: '/seance-en-cours', params: { jour: String(s.day) } });
  };
  const voir = () => (s.day != null ? router.push(`/seance/${s.day}`) : undefined);
  return (
    <View>
      <Text weight="bold" style={styles.h2}>
        {titre}
      </Text>
      <Card style={styles.auj}>
        <Appui accessibilityRole="button" accessibilityLabel={`Voir ${s.titre}`} onPress={voir}>
          <View style={styles.photo}>
            <Image source={ns.offset === 0 ? DECO_IMAGES.salle : DECO_IMAGES.etirement} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient colors={['transparent', alpha(colors.surface, 0.6), colors.surface]} locations={[0.35, 0.7, 1]} style={StyleSheet.absoluteFill} />
            <View style={styles.badge}>
              <Text weight="semibold" style={styles.badgeTxt}>
                {Math.round(s.min)} min
              </Text>
            </View>
            <View style={styles.photoBas}>
              <Text weight="bold" style={styles.aujTitre} numberOfLines={1}>
                {s.titre}
              </Text>
              <Text style={styles.meta}>{s.ride ? 'Sortie vélo' : `${s.items.length} exercices · ${LVLN[lvlN(level) - 1]}`}</Text>
            </View>
          </View>
        </Appui>
        {!s.ride &&
          s.items.slice(0, 3).map((it, i) => (
            <Appui key={i} accessibilityRole="button" onPress={voir} style={styles.exo}>
              <Image source={EXERCICE_IMAGES[it.id]} style={styles.exoImg} contentFit="contain" />
              <Text weight="medium" style={[styles.flex, styles.exoNom]} numberOfLines={1}>
                {exercice(it.id).nom}
              </Text>
              <Text style={styles.petit}>
                {it.sets} × {it.reps ? it.reps[1] : `${it.sec} s`}
              </Text>
              <Icon name="right" size={16} color={colors.textSecondary} />
            </Appui>
          ))}
        <Appui accessibilityRole="button" onPress={lancer} style={styles.lancer}>
          <Icon name="play" size={18} color={colors.onPrimary} strokeWidth={2.4} />
          <Text weight="semibold" style={styles.lancerTxt}>
            {s.ride ? 'Lancer la sortie' : 'Lancer la séance'}
          </Text>
        </Appui>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  semaine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  fleche: { width: 30, height: 30, borderRadius: 15, backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center' },
  jour: { alignItems: 'center', gap: 8, width: 34 },
  lettre: { fontSize: 13, lineHeight: 17, color: colors.textSecondary },
  lettreAuj: { color: colors.text },
  point: { width: 22, height: 22, borderRadius: 11, backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center' },
  pointPrevu: { backgroundColor: colors.pink, boxShadow: `0 0 10px ${alpha(colors.pink, 0.5)}` },
  pointFait: { backgroundColor: colors.pink },
  prog: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  progIc: { width: 48, height: 48, borderRadius: 14, backgroundColor: ui.iconBg, alignItems: 'center', justifyContent: 'center' },
  progNom: { fontSize: 18, lineHeight: 23 },
  petit: { fontSize: 13.5, lineHeight: 18, color: colors.textSecondary },
  progLigne: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  barre: { flex: 1, height: 6, borderRadius: 3, backgroundColor: ui.dark, overflow: 'hidden' },
  rempli: { height: 6, borderRadius: 3, backgroundColor: colors.pink },
  h2: { fontSize: 20, lineHeight: 25, marginBottom: 10 },
  auj: { padding: 0, overflow: 'hidden', gap: 0 },
  photo: { height: 170, justifyContent: 'flex-end' },
  badge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, backgroundColor: alpha(colors.bg, 0.7), borderWidth: 1, borderColor: colors.pink },
  badgeTxt: { fontSize: 14, lineHeight: 18, color: colors.pink },
  photoBas: { padding: 16, paddingBottom: 10 },
  aujTitre: { fontSize: 22, lineHeight: 27 },
  meta: { fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  exo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  exoImg: { width: 44, height: 44, borderRadius: 10, backgroundColor: ui.dark },
  exoNom: { fontSize: 15, lineHeight: 20 },
  lancer: {
    margin: 14,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.pink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: `0 6px 22px ${alpha(colors.pink, 0.4)}`,
  },
  lancerTxt: { ...fonts.semibold, fontSize: 17, lineHeight: 22, color: colors.onPrimary },
});
