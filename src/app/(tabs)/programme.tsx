import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { bientot } from '@/components/app/bientot';
import { CoachFace } from '@/components/app/CoachFace';
import { ExerciceSheet } from '@/components/app/ExerciceSheet';
import { Kcal } from '@/components/app/Kcal';
import { PlanifierSheet } from '@/components/app/PlanifierSheet';
import { DayNum, Row, RowText, rowStyles } from '@/components/app/Rows';
import { SectionHead } from '@/components/app/Section';
import { Thumb } from '@/components/app/Thumb';
import { Card, Icon, Text, toast } from '@/components/ui';
import { COACH_IMAGES, EXERCICE_IMAGES, EXERCICES, GOALF, GROUPES, LIEUX, MATERIEL, PROGRAMMES, SEANCES, SEANCES_GRATUITES } from '@/data';
import type { ExerciceId, GoalFiltre, GroupeId, LieuId, Seance, SeanceId } from '@/data/types';
import { fmt } from '@/lib/charges';
import { coachById, LVLN, prog, progWeek, todayIdx } from '@/lib/plan';
import { isPremium, progLocked, wkLocked } from '@/lib/premium';
import { catSession, JOURS, nextSession, sessionForDay, weekDates } from '@/lib/semaine';
import { selectProfil, useProfil, useSemaine } from '@/store/profil';
import { alpha, colors, fonts, glow, mix, ui } from '@/theme';

type Filtre = 'Tous' | 'pecs' | 'dos' | 'epaules' | 'bras' | 'jambes' | 'abdos' | 'cardio';
const FILTRES: readonly [Filtre, string][] = [
  ['Tous', 'Tous'],
  ['pecs', 'Pecs'],
  ['dos', 'Dos'],
  ['epaules', 'Épaules'],
  ['bras', 'Bras'],
  ['jambes', 'Jambes'],
  ['abdos', 'Abdos'],
  ['cardio', 'Cardio'],
];
const filtrer = (f: Filtre, g: GroupeId) =>
  f === 'Tous' ||
  g === f ||
  (f === 'bras' && ['biceps', 'triceps'].includes(g)) ||
  (f === 'jambes' && ['quads', 'ischios', 'fessiers', 'mollets'].includes(g));

/** Recherche sans accents ni majuscules. */
const n = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const premierExo = (w: Seance) => w.ex[0].split(':')[0] as ExerciceId;

/** Onglet Programme et sous-onglet Calendrier (vProg / vCal du prototype). */
export default function Programme() {
  const { vue } = useLocalSearchParams<{ vue?: string }>();
  const [exo, setExo] = useState<ExerciceId | null>(null);
  const [aPlanifier, setAPlanifier] = useState<SeanceId | null>(null);
  const cal = vue === 'calendrier';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {cal ? <Calendrier /> : <Catalogue onExo={setExo} onPlanifier={setAPlanifier} />}
      <ExerciceSheet id={exo} onClose={() => setExo(null)} />
      <PlanifierSheet id={aPlanifier} onClose={() => setAPlanifier(null)} />
    </SafeAreaView>
  );
}

function Onglets({ cal }: { cal: boolean }) {
  return (
    <View style={styles.phd}>
      {cal ? (
        <>
          <Pressable accessibilityRole="button" onPress={() => router.setParams({ vue: 'programme' })}>
            <Text weight="bold" style={styles.phdBtn}>
              Programme
            </Text>
          </Pressable>
          <Text style={styles.phdH1}>Calendrier</Text>
        </>
      ) : (
        <>
          <Text style={styles.phdH1}>Programme</Text>
          <Pressable accessibilityRole="button" onPress={() => router.setParams({ vue: 'calendrier' })}>
            <Text weight="bold" style={styles.phdBtn}>
              Calendrier
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

function Catalogue({ onExo, onPlanifier }: { onExo: (id: ExerciceId) => void; onPlanifier: (id: SeanceId) => void }) {
  const profil = useProfil();
  const p = selectProfil(profil);
  const sem = useSemaine();
  const c = coachById(p.coach);
  const pr = prog(p);
  const ns = nextSession(sem);
  const [q, setQ] = useState('');
  const [lieu, setLieu] = useState<LieuId>({ maison: 'maison', salle: 'salle', deux: 'salle' }[p.gear] as LieuId);
  const [goalf, setGoalf] = useState<GoalFiltre>('Tous');
  const [f, setF] = useState<Filtre>('Tous');
  const [page, setPage] = useState(0);
  const { width } = useWindowDimensions();
  const cardW = width - 60;

  const wkRow = (w: Seance) => {
    const s = catSession(w, null, p.weight, profil.wkMod[w.id] ?? 0);
    const lk = wkLocked(w.id);
    return (
      <View key={w.id} style={styles.wrow}>
        <Pressable accessibilityRole="button" style={styles.wmain} onPress={() => router.push(`/catalogue/${w.id}`)}>
          <Thumb id={premierExo(w)} big locked={lk} />
          <View style={styles.flex}>
            <Text weight="bold" style={styles.wh5} numberOfLines={1}>
              {w.t}
            </Text>
            <Text style={styles.wp}>
              {s.min} min • {LVLN[w.lvl - 1]}
              {lk ? ' • Plus' : SEANCES_GRATUITES.includes(w.id) && !isPremium() ? ' • Gratuit' : ''}
            </Text>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Ajouter à ma semaine" style={styles.wadd} onPress={() => onPlanifier(w.id)}>
          <Icon name="plus" color={colors.pinkLight} />
        </Pressable>
      </View>
    );
  };

  const exoRow = (e: (typeof EXERCICES)[number], sub: string, chev: boolean) => (
    <Row key={e.id} onPress={() => onExo(e.id)} accessibilityLabel={e.nom}>
      <Thumb id={e.id} />
      <RowText title={e.nom} sub={sub} />
      {chev && <Icon name="right" color={colors.textSecondary} />}
    </Row>
  );

  const k = n(q.trim());
  const liste = SEANCES.filter((w) => w.lieu === lieu && (goalf === 'Tous' || w.goal === goalf));

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Onglets cal={false} />
      {/* .srch */}
      <View style={styles.srch}>
        <Icon name="search" color={colors.textSecondary} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Rechercher des séances et exercices"
          placeholderTextColor={colors.textSecondary}
          style={styles.srchInput}
          accessibilityLabel="Rechercher"
          returnKeyType="search"
        />
      </View>

      {k ? (
        <View style={[rowStyles.list, styles.res]}>
          {(() => {
            const ws = SEANCES.filter((w) => n(w.t + ' ' + w.goal + ' ' + LIEUX[w.lieu]).includes(k));
            const es = EXERCICES.filter((e) => n(e.nom + ' ' + e.muscles + ' ' + GROUPES[e.groupe]).includes(k));
            return (
              <>
                {ws.map(wkRow)}
                {es.map((e) => exoRow(e, `Exercice • ${GROUPES[e.groupe]}`, false))}
                {!ws.length && !es.length && <Text style={styles.note}>Aucun résultat.</Text>}
              </>
            );
          })()}
        </View>
      ) : (
        <>
          <SectionHead title="Mon plan" action={`Parler à ${c.nom}`} onAction={() => bientot('coach')} />
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
                <Pressable key={x.id} accessibilityRole="button" onPress={() => router.push(`/plan/${x.id}`)}>
                  <LinearGradient
                    colors={['#131316', '#131316', mix(c.c, 22, '#131316')]}
                    locations={[0, 0.5, 1]}
                    start={{ x: 0, y: 0.35 }}
                    end={{ x: 1, y: 0.65 }}
                    style={[styles.plancard, { width: cardW }, on && styles.plancardOn]}
                  >
                    <View style={styles.ptxt}>
                      <Text weight="semibold" style={styles.ptag}>
                        {on
                          ? `En cours • semaine ${progWeek(p)}/${x.sem}`
                          : progLocked(c.id, x.id)
                            ? `🔒 NÉA Plus • ${x.sem} semaines`
                            : `${x.sem} semaines`}
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
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.dots}>
            {PROGRAMMES[c.id].map((x, i) => (
              <View key={x.id} style={[styles.dot, i === page && styles.dotOn]} />
            ))}
          </View>

          <SectionHead title="Plan d'entraînement" note="Tout est prêt, lance et suis" />
          {/* .lieux */}
          <Card style={styles.lieux}>
            <View style={styles.ltabs}>
              {(Object.entries(LIEUX) as [LieuId, string][]).map(([key, l]) => (
                <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: key === lieu }} onPress={() => setLieu(key)} style={styles.ltab}>
                  <Text weight="semibold" style={[styles.ltabTxt, key === lieu && styles.ltabOn]}>
                    {l}
                  </Text>
                  {key === lieu && <View style={[styles.ltabBar, glow(colors.pink, 8)]} />}
                </Pressable>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gchips}>
              {GOALF.map((g) => (
                <Chip key={g} label={g} on={goalf === g} onPress={() => setGoalf(g)} petit />
              ))}
            </ScrollView>
            {liste.length ? (
              liste.map((w, i) => <View key={w.id} style={i < liste.length - 1 && styles.wsep}>{wkRow(w)}</View>)
            ) : (
              <Text style={[styles.note, styles.noteVide]}>Aucune séance pour cet objectif ici : essaie un autre lieu.</Text>
            )}
          </Card>

          <SectionHead title="À la une" />
          <View style={rowStyles.list}>
            {SEANCES.filter((w) => w.feat).map((w) => {
              const s = catSession(w, null, p.weight, profil.wkMod[w.id] ?? 0);
              return (
                <Pressable key={w.id} accessibilityRole="button" onPress={() => router.push(`/catalogue/${w.id}`)}>
                  <Card style={styles.feat}>
                    <View style={styles.featTxt}>
                      {wkLocked(w.id) && (
                        <LinearGradient colors={['#FFE38A', '#FFC23D']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.plusb}>
                          <Icon name="lock" size={11} color={ui.onGold} />
                          <Text weight="extrabold" style={styles.plusbTxt}>
                            PLUS
                          </Text>
                        </LinearGradient>
                      )}
                      <Text weight="extrabold" style={styles.fh3}>
                        {w.t}
                      </Text>
                      <Text style={styles.fp} numberOfLines={2}>
                        {w.desc}
                      </Text>
                      <View style={styles.psmall}>
                        <Icon name="dumb" size={15} color={colors.pinkLight} />
                        <Text style={styles.fsmall}>{w.ex.length} exercices</Text>
                        <Icon name="clock" size={15} color={colors.pinkLight} />
                        <Text style={styles.fsmall}>{s.min} min</Text>
                      </View>
                    </View>
                    <Image source={EXERCICE_IMAGES[premierExo(w)]} style={styles.fimg} contentFit="contain" />
                  </Card>
                </Pressable>
              );
            })}
          </View>

          <SectionHead title="Les 50 exercices" style={styles.mt14} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {FILTRES.map(([key, l]) => (
              <Chip key={key} label={l} on={f === key} onPress={() => setF(key)} />
            ))}
          </ScrollView>
          <View style={rowStyles.list}>
            {EXERCICES.filter((e) => filtrer(f, e.groupe)).map((e) => exoRow(e, `${GROUPES[e.groupe]} • ${MATERIEL[e.materiel]}`, true))}
          </View>
        </>
      )}
      <View style={{ height: 10 }} />
    </ScrollView>
  );
}

/** Filtre pilule (.filters button / .gchips button). */
function Chip({ label, on, onPress, petit }: { label: string; on: boolean; onPress: () => void; petit?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={[petit ? styles.gchip : styles.filter, on && styles.chipOn]}>
      <Text style={[petit ? styles.gchipTxt : styles.filterTxt, on && styles.chipTxtOn]}>{label}</Text>
    </Pressable>
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
      <Onglets cal />
      <Pressable accessibilityRole="button" onPress={() => router.push(`/plan/${pr.id}`)} style={styles.pheadWrap}>
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
      </Pressable>
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
  mt14: { marginTop: 14 },
  phd: { flexDirection: 'row', alignItems: 'baseline', gap: 16, paddingTop: 14, paddingHorizontal: 20 },
  phdH1: { fontFamily: fonts.black, fontSize: 32, lineHeight: 39, letterSpacing: -0.64 },
  phdBtn: { fontSize: 21, lineHeight: 26, color: colors.textTertiary },
  srch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    marginHorizontal: 20,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  srchInput: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 14.5 },
  res: { marginTop: 12 },
  note: { fontSize: 11.5, lineHeight: 16, color: colors.textSecondary },
  noteVide: { paddingVertical: 12, paddingHorizontal: 4 },
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
    backgroundColor: 'rgba(255,79,163,0.16)',
    color: colors.pinkPale,
  },
  ph3: { fontSize: 19, lineHeight: 22, fontFamily: fonts.extrabold },
  pp: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  psmall: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 'auto' },
  psmallTxt: { fontSize: 12, lineHeight: 16, color: ui.text3, marginRight: 4 },
  pimg: { position: 'absolute', right: -18, bottom: -26, height: 190, width: 150 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginTop: 12 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border2 },
  dotOn: { width: 18, backgroundColor: colors.pink },
  lieux: { marginHorizontal: 20, paddingTop: 6, paddingHorizontal: 12, paddingBottom: 8 },
  ltabs: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 },
  ltab: { paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center' },
  ltabTxt: { fontSize: 14, lineHeight: 18, color: colors.textSecondary },
  ltabOn: { color: colors.text },
  ltabBar: { position: 'absolute', bottom: 2, left: '30%', right: '30%', height: 3, borderRadius: 3, backgroundColor: colors.pink },
  gchips: { gap: 6, paddingTop: 2, paddingBottom: 8 },
  gchip: { height: 30, paddingHorizontal: 12, borderRadius: 999, backgroundColor: ui.dark, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  gchipTxt: { fontSize: 12, lineHeight: 15, color: '#C6C6CC' },
  filters: { gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  filter: { height: 32, paddingHorizontal: 14, borderRadius: 999, backgroundColor: ui.chipBg, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  filterTxt: { fontSize: 12.5, lineHeight: 16, color: '#C6C6CC' },
  chipOn: { borderColor: colors.pink, backgroundColor: 'rgba(255,79,163,0.14)' },
  chipTxtOn: { color: colors.text },
  wrow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 4 },
  wsep: { borderBottomWidth: 1, borderBottomColor: colors.border },
  wmain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 },
  wh5: { fontSize: 14.5, lineHeight: 19 },
  wp: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary, marginTop: 3 },
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
  feat: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, marginBottom: 10, minHeight: 150, overflow: 'hidden' },
  featTxt: { flex: 1, gap: 6, zIndex: 2 },
  plusb: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999 },
  plusbTxt: { fontSize: 10.5, lineHeight: 13, color: ui.onGold },
  fh3: { fontSize: 17, lineHeight: 20.4, maxWidth: 230 },
  fp: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary, maxWidth: 220 },
  fsmall: { fontSize: 12.5, lineHeight: 16, color: ui.text3, marginRight: 4 },
  fimg: { position: 'absolute', right: -6, bottom: 4, height: 130, width: '46%', opacity: 0.95 },
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
