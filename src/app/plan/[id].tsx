import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ouvrirPlus } from '@/components/app/ouvrirPlus';
import { DetailHead, detail, Hero, KStat, ParCoach, Tags } from '@/components/app/Detail';
import { Kcal } from '@/components/app/Kcal';
import { DayNum, Row, RowText, rowStyles } from '@/components/app/Rows';
import { SectionHead } from '@/components/app/Section';
import { Button, Text, toast } from '@/components/ui';
import { COACH_IMAGES, LIEUX, PROGRAMMES } from '@/data';
import type { ProgrammeId } from '@/data/types';
import { buildPlan, coachById, exercice, LVLN, lvlN, prog } from '@/lib/plan';
import { progLocked } from '@/lib/premium';
import { JOURS, nextSession, weekDates } from '@/lib/semaine';
import { selectProfil, useProfil, useSemaine } from '@/store/profil';
import { colors, glow } from '@/theme';

/** Détail d'un programme du coach (vPlan du prototype). */
export default function PlanDetail() {
  const { id } = useLocalSearchParams<{ id: ProgrammeId }>();
  const profil = useProfil();
  const p = selectProfil(profil);
  const sem = useSemaine();
  const c = coachById(p.coach);
  const pr = PROGRAMMES[c.id].find((x) => x.id === id) ?? prog(p);
  const on = pr.id === prog(p).id;
  // Aperçu du plan avec ce programme, sans changer celui en cours.
  const P = buildPlan({ ...p, progs: { ...p.progs, [c.id]: pr.id } });
  const moy = Math.round(P.sessions.reduce((a, s) => a + s.min, 0) / P.sessions.length);
  const wd = weekDates();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <DetailHead titre="Programme" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Hero source={COACH_IMAGES[c.id].corps} color={c.c} />
        <View style={detail.pad}>
          <ParCoach id={c.id} nom={c.nom} />
          <Text style={[detail.h1, styles.h1]}>{pr.nom}</Text>
          <Tags items={[LVLN[lvlN(p.level) - 1], LIEUX[p.gear === 'maison' ? 'maison' : 'salle'], c.style]} />
          <KStat
            items={[
              ['cal', `${pr.sem} semaines`],
              ['dumb', `${p.days} séances/semaine`],
              ['clock', `≈ ${moy} min`],
            ]}
          />
          <Text style={detail.sub}>
            {pr.desc} {c.desc}
          </Text>
        </View>
        {/* .adapt : ce que le coach a adapté pour toi */}
        <View style={styles.adapt}>
          {P.notes.map((n) => (
            <Text key={n} style={styles.adaptTag}>
              {n}
            </Text>
          ))}
        </View>
        <SectionHead title="Ta semaine avec ce programme" />
        {/* .miniw */}
        <View style={styles.miniw}>
          {wd.map((d, i) => {
            const s = P.sessions.find((x) => x.day === i);
            return (
              <View key={i} style={[styles.mini, s && styles.miniOn]}>
                <Text style={styles.miniSmall}>{JOURS[i]}</Text>
                <Text weight="bold" style={styles.miniB}>
                  {d.getDate()}
                </Text>
                <View style={[styles.miniDot, s && [styles.miniDotOn, glow(colors.pink, 6)]]} />
              </View>
            );
          })}
        </View>
        <View style={rowStyles.list}>
          {P.sessions.map((s, i) => (
            <Row key={i}>
              <DayNum jour={JOURS[s.day]} />
              <RowText
                title={s.titre}
                sub={`${s.min} min • ${s.items
                  .map((it) => exercice(it.id).nom)
                  .slice(0, 3)
                  .join(', ')}…`}
              />
              <Kcal kcal={s.kcal} />
            </Row>
          ))}
        </View>
      </ScrollView>
      <View style={styles.foot}>
        <Button label="Retour" variant="dark" onPress={() => router.back()} style={styles.flex} />
        {on ? (
          <Button
            label="Séance du jour"
            arrow
            onPress={() => {
              const d = nextSession(sem).s.day;
              if (d != null) router.push(`/seance/${d}`);
            }}
            style={styles.flex}
          />
        ) : progLocked(c.id, pr.id) ? (
          <Button label="Débloquer" icon="lock" onPress={() => ouvrirPlus()} style={styles.flex} />
        ) : (
          <Button
            label="Suivre ce programme"
            onPress={() => {
              profil.suivre(pr.id);
              toast('« ' + pr.nom + ' » ajouté à ton calendrier');
              router.navigate({ pathname: '/programme', params: { vue: 'calendrier' } });
            }}
            style={styles.flex}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  h1: { fontSize: 26, lineHeight: 31 },
  adapt: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 10, paddingHorizontal: 20 },
  adaptTag: {
    fontSize: 11,
    lineHeight: 14,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,79,163,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,79,163,0.35)',
    color: colors.pinkPale,
  },
  miniw: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingBottom: 12 },
  mini: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniOn: { borderColor: colors.pink },
  miniSmall: { fontSize: 10.5, lineHeight: 13, color: colors.textSecondary },
  miniB: { fontSize: 14, lineHeight: 18 },
  miniDot: { width: 6, height: 6, borderRadius: 3 },
  miniDotOn: { backgroundColor: colors.pink },
  foot: { flexDirection: 'row', gap: 10, paddingTop: 12, paddingHorizontal: 20, paddingBottom: 18 },
});
