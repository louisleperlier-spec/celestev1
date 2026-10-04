import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { catalogueStyles as cs, lieuDuProfil, OngletsLieux, SeanceLigne } from '@/components/app/Catalogue';
import { CoachFace } from '@/components/app/CoachFace';
import { EnTete, ENTRAINEMENT } from '@/components/app/EnTete';
import { Kcal } from '@/components/app/Kcal';
import { PlanifierSheet } from '@/components/app/PlanifierSheet';
import { DayNum, Row, RowText, rowStyles } from '@/components/app/Rows';
import { SectionHead } from '@/components/app/Section';
import { Appui, Card, Icon, Text, toast } from '@/components/ui';
import { COACH_IMAGES, EXERCICE_IMAGES, EXERCICES, LIEUX, PROGRAMMES, SEANCES } from '@/data';
import type { LieuId, Seance, SeanceId } from '@/data/types';
import { fmt } from '@/lib/charges';
import { coachById, lvlN, prog, progWeek, todayIdx } from '@/lib/plan';
import { progLocked, wkLocked } from '@/lib/premium';
import { JOURS, nextSession, sessionForDay, weekDates } from '@/lib/semaine';
import { selectProfil, useProfil, useSemaine } from '@/store/profil';
import { alpha, colors, fonts, mix, ui } from '@/theme';

/** Onglet Programme et sous-onglet Calendrier (vProg / vCal du prototype). */
export default function Programme() {
  const { vue } = useLocalSearchParams<{ vue?: string }>();
  const [aPlanifier, setAPlanifier] = useState<SeanceId | null>(null);
  const cal = vue === 'calendrier';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {cal ? <Calendrier /> : <Catalogue onPlanifier={setAPlanifier} />}
      <PlanifierSheet id={aPlanifier} onClose={() => setAPlanifier(null)} />
    </SafeAreaView>
  );
}

/**
 * Onglet Programme, allégé (écart validé) : mon plan (carrousel des 3 programmes), 4 séances prêtes pour mon lieu
 * et mon niveau avec « Tout voir », et la bibliothèque d'exercices. Les listes complètes sont dans /seances et /exercices.
 */
function Catalogue({ onPlanifier }: { onPlanifier: (id: SeanceId) => void }) {
  const profil = useProfil();
  const p = selectProfil(profil);
  const sem = useSemaine();
  const c = coachById(p.coach);
  const pr = prog(p);
  const ns = nextSession(sem);
  const [lieu, setLieu] = useState<LieuId>(lieuDuProfil(p.gear));
  const [page, setPage] = useState(0);
  const { width } = useWindowDimensions();
  const cardW = width - 60;

  // Les séances du lieu : celles que je peux ouvrir d'abord, puis les plus proches de mon niveau (ordre du catalogue sinon).
  const niveau = lvlN(p.level);
  const duLieu = SEANCES.filter((w) => w.lieu === lieu);
  const rang = (w: Seance) => (wkLocked(w.id) ? 10 : 0) + Math.abs(w.lvl - niveau);
  const choix = [...duLieu].sort((x, y) => rang(x) - rang(y)).slice(0, 4);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <EnTete titre="Entraînement" rubriques={ENTRAINEMENT} actif="Programme" />
      <SectionHead title="Mon plan" action={`Parler à ${c.nom}`} onAction={() => router.push('/chat')} />
      {/* .plans : carrousel des 3 programmes du coach */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardW + 12}
        decelerationRate="fast"
        contentContainerStyle={styles.plans}
        onScroll={(ev) => setPage(Math.round(ev.nativeEvent.contentOffset.x / (cardW + 12)))}
        scrollEventThrottle={32}
      >
        {PROGRAMMES[c.id].map((x) => {
          const on = x.id === pr.id;
          return (
            <Appui key={x.id} accessibilityRole="button" onPress={() => router.push(`/plan/${x.id}`)}>
              <LinearGradient
                colors={[colors.surface, colors.surface, mix(c.c, 22, colors.surface)]}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0.35 }}
                end={{ x: 1, y: 0.65 }}
                style={[styles.plancard, { width: cardW }, on && styles.plancardOn]}
              >
                <View style={styles.ptxt}>
                  <Text weight="semibold" style={styles.ptag}>
                    {on ? `En cours • semaine ${progWeek(p)}/${x.sem}` : progLocked(c.id, x.id) ? `🔒 NÉA Plus • ${x.sem} semaines` : `${x.sem} semaines`}
                  </Text>
                  <Text weight="extrabold" style={styles.ph3}>
                    {x.nom}
                  </Text>
                  <Text style={styles.pp} numberOfLines={2}>
                    {x.desc}
                  </Text>
                  <View style={styles.psmall}>
                    <Icon name="dumb" size={15} color={colors.pinkLight} />
                    <Text style={styles.psmallTxt}>{p.days} séances/sem.</Text>
                    <Icon name="clock" size={15} color={colors.pinkLight} />
                    <Text style={styles.psmallTxt}>{on ? ns.s.min : sem.plan.sessions[0].min} min</Text>
                  </View>
                </View>
                <Image source={COACH_IMAGES[c.id].corps} style={styles.pimg} contentFit="contain" />
              </LinearGradient>
            </Appui>
          );
        })}
      </ScrollView>
      <View style={styles.dots}>
        {PROGRAMMES[c.id].map((x, i) => (
          <View key={x.id} style={[styles.dot, i === page && styles.dotOn]} />
        ))}
      </View>

      <SectionHead title="Séances prêtes" action={`Tout voir (${SEANCES.length})`} onAction={() => router.push({ pathname: '/seances', params: { lieu } })} />
      <Card style={styles.lieux}>
        <OngletsLieux lieu={lieu} onChange={setLieu} />
        {choix.map((w, i) => (
          <View key={w.id} style={i < choix.length - 1 && cs.wsep}>
            <SeanceLigne w={w} onPlanifier={onPlanifier} />
          </View>
        ))}
        {duLieu.length > choix.length && (
          <Appui accessibilityRole="button" onPress={() => router.push({ pathname: '/seances', params: { lieu } })} style={styles.plus}>
            <Text weight="semibold" style={styles.plusTxt}>
              {duLieu.length - choix.length} autres séances {LIEUX[lieu].toLowerCase()}
            </Text>
            <Icon name="right" size={16} color={colors.pinkLight} />
          </Appui>
        )}
      </Card>

      <SectionHead title="Bibliothèque" />
      <Appui accessibilityRole="button" onPress={() => router.push('/exercices')} style={styles.biblioWrap}>
        <Card style={styles.biblio}>
          <View style={styles.biblioImgs}>
            {EXERCICES.slice(0, 3).map((e, i) => (
              <Image key={e.id} source={EXERCICE_IMAGES[e.id]} style={[styles.biblioImg, { left: i * 26, zIndex: 3 - i }]} contentFit="contain" />
            ))}
          </View>
          <View style={styles.flex}>
            <Text weight="bold" style={styles.biblioH}>
              {EXERCICES.length} exercices
            </Text>
            <Text style={styles.biblioP}>Technique, muscles travaillés et démo guidée</Text>
          </View>
          <Icon name="right" color={colors.textSecondary} />
        </Card>
      </Appui>
      <View style={{ height: 10 }} />
    </ScrollView>
  );
}

/** Sous-onglet Calendrier (vCal du prototype). */
function Calendrier() {
  const profil = useProfil();
  const p = selectProfil(profil);
  const sem = useSemaine();
  const c = coachById(p.coach);
  const pr = prog(p);
  const wd = weekDates();
  const ti = todayIdx();
  const jours = wd.map((_, i) => sessionForDay(sem, i));
  const tot = jours.reduce((a, s) => a + (s?.kcal || 0), 0);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <EnTete titre="Entraînement" rubriques={ENTRAINEMENT} actif="Calendrier" />
      <Appui accessibilityRole="button" onPress={() => router.push(`/plan/${pr.id}`)} style={styles.pheadWrap}>
        <Card style={styles.phead}>
          <CoachFace id={c.id} size={52} borderColor={c.c} />
          <View style={styles.flex}>
            <Text weight="bold" style={styles.pheadH3}>
              {pr.nom}
            </Text>
            <Text style={styles.pheadP}>
              Semaine {progWeek(p)}/{pr.sem} avec {c.nom} • {p.days} séances
            </Text>
          </View>
          <Icon name="right" />
        </Card>
      </Appui>
      <View style={styles.wsum}>
        <View style={styles.wsumBox}>
          <Text style={styles.wsumSmall}>Cette semaine</Text>
          <Text weight="bold" style={styles.wsumB}>
            {jours.filter(Boolean).length} séances
          </Text>
        </View>
        <View style={styles.wsumBox}>
          <Text style={styles.wsumSmall}>Calories prévues</Text>
          <Text weight="bold" style={styles.wsumB}>
            ≈ {fmt(tot)} kcal
          </Text>
        </View>
      </View>
      <SectionHead title="Ta semaine" action="Modifier" onAction={() => router.push('/reglages')} />
      <View style={rowStyles.list}>
        {wd.map((d, i) => {
          const s = jours[i];
          return (
            <Row
              key={i}
              onPress={() => (s ? router.push(`/seance/${i}`) : toast('Jour de repos, récupère bien'))}
              style={[i === ti && styles.rowToday, s?.cat && styles.rowAdded]}
            >
              <DayNum jour={JOURS[i]} date={d.getDate()} />
              <RowText
                title={s ? s.titre : 'Repos'}
                sub={
                  s
                    ? `${s.min} min • ${s.ride ? 'vélo' : s.items.length + ' exercices'}${s.cat ? ' • ajoutée' : ' • ' + pr.nom}`
                    : 'Récupération, marche ou vélo tranquille'
                }
              />
              {s && <Kcal kcal={s.kcal} />}
            </Row>
          );
        })}
      </View>
      <Text style={[styles.note, styles.notePad]}>
        Change de programme dans « Mon plan » ou planifie une séance avec + : ta semaine se met à jour ici.
      </Text>
      <View style={{ height: 10 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  note: { fontSize: 11.5, lineHeight: 16, color: colors.textSecondary },
  notePad: { paddingTop: 8, paddingHorizontal: 20 },
  plans: { gap: 12, paddingHorizontal: 20 },
  plancard: { minHeight: 180, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  plancardOn: { borderColor: colors.pink },
  ptxt: { width: '66%', gap: 6, flex: 1, zIndex: 2 },
  ptag: {
    alignSelf: 'flex-start',
    fontSize: 11,
    lineHeight: 14,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,107,26,0.16)',
    color: colors.pinkPale,
  },
  ph3: { fontSize: 19, lineHeight: 22, ...fonts.extrabold },
  pp: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  psmall: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 'auto' },
  psmallTxt: { fontSize: 12, lineHeight: 16, color: ui.text3, marginRight: 4 },
  pimg: { position: 'absolute', right: -18, bottom: -26, height: 190, width: 150 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginTop: 12 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border2 },
  dotOn: { width: 18, backgroundColor: colors.pink },
  plus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  plusTxt: { fontSize: 13, lineHeight: 17, color: colors.pinkLight },
  biblioWrap: { marginHorizontal: 20 },
  biblio: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  biblioImgs: { width: 104, height: 56 },
  biblioImg: { position: 'absolute', top: 0, width: 56, height: 56, borderRadius: 12, backgroundColor: ui.iconBg },
  biblioH: { fontSize: 15.5, lineHeight: 20 },
  biblioP: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary, marginTop: 2 },
  lieux: { marginHorizontal: 20, paddingTop: 6, paddingHorizontal: 12, paddingBottom: 8 },
  wadd: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1D1D22',
    borderWidth: 1,
    borderColor: colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pheadWrap: { marginTop: 12, marginHorizontal: 20 },
  phead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  pheadH3: { fontSize: 15, lineHeight: 19 },
  pheadP: { fontSize: 12.5, lineHeight: 17.5, color: colors.textSecondary, marginTop: 3 },
  wsum: { flexDirection: 'row', gap: 10, paddingTop: 10, paddingHorizontal: 20 },
  wsumBox: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  wsumSmall: { fontSize: 11, lineHeight: 14, color: colors.textSecondary },
  wsumB: { fontSize: 16, lineHeight: 20 },
  rowToday: { borderColor: colors.pink },
  rowAdded: { borderColor: alpha(colors.pink, 0.45) },
});
