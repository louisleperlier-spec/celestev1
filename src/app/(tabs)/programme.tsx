import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDefilementOnglets } from '@/components/app/TabBar';
import { catalogueStyles as cs, lieuDuProfil, OngletsLieux, SeanceLigne } from '@/components/app/Catalogue';
import { ACCUEIL, TitreSection } from '@/components/app/AccueilDesign';
import { EnTete, ENTRAINEMENT } from '@/components/app/EnTete';
import { PlanifierSheet } from '@/components/app/PlanifierSheet';
import { Aujourdhui, CarteProgramme, jourFait, SemaineJours } from '@/components/app/ProgrammeHaut';
import { Appui, BigNumber, Icon, Text } from '@/components/ui';
import { COACH_IMAGES, EXERCICE_IMAGES, EXERCICES, LIEUX, PROGRAMMES, SEANCES } from '@/data';
import type { LieuId, Seance, SeanceId } from '@/data/types';
import { serie } from '@/lib/gel';
import { coachById, lvlN, prog, progWeek } from '@/lib/plan';
import { progLocked, wkLocked } from '@/lib/premium';
import { nextSession, sessionForDay, weekDates, type SeanceJour } from '@/lib/semaine';
import { selectProfil, useProfil, useSemaine } from '@/store/profil';
import { alpha, colors, mix, ui } from '@/theme';

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
 * Onglet Programme (design 10K « Routine ») : semaine en cercles, programme suivi en barre de traits, séance du jour en
 * carrousel de grandes cartes, puis tes programmes (cartes du même style), 4 séances prêtes pour ton lieu et la bibliothèque.
 * Les listes complètes sont dans /seances et /exercices.
 */
function Catalogue({ onPlanifier }: { onPlanifier: (id: SeanceId) => void }) {
  const defile = useDefilementOnglets();
  const profil = useProfil();
  const p = selectProfil(profil);
  const sem = useSemaine();
  const c = coachById(p.coach);
  const pr = prog(p);
  const ns = nextSession(sem);
  const [lieu, setLieu] = useState<LieuId>(lieuDuProfil(p.gear));

  // Les séances du lieu : celles que je peux ouvrir d'abord, puis les plus proches de mon niveau (ordre du catalogue sinon).
  const niveau = lvlN(p.level);
  const duLieu = SEANCES.filter((w) => w.lieu === lieu);
  const rang = (w: Seance) => (wkLocked(w.id) ? 10 : 0) + Math.abs(w.lvl - niveau);
  const choix = [...duLieu].sort((x, y) => rang(x) - rang(y)).slice(0, 4);

  return (
    <Animated.ScrollView onScroll={defile} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={styles.bas}>
      <EnTete titre="Ton programme" sous="Un peu mieux, chaque semaine." rubriques={ENTRAINEMENT} actif={ENTRAINEMENT[0].label} />
      <View style={styles.page}>
        <View style={styles.haut}>
          <SemaineJours />
          <CarteProgramme />
        </View>

        <View style={styles.section}>
          <Aujourdhui />
        </View>

        {/* Tes programmes : grandes cartes du carrousel 10K, mascotte du coach, pastille de durée ou d'état. */}
        <View style={styles.section}>
          <TitreSection titre="Tes programmes" action={`Parler à ${c.nom}`} onAction={() => router.push('/coach')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={PLAN_L + 12} decelerationRate="fast" style={styles.plansZone} contentContainerStyle={styles.plans}>
            {PROGRAMMES[c.id].map((x) => {
              const on = x.id === pr.id;
              const verrou = !on && progLocked(c.id, x.id);
              return (
                <Appui key={x.id} accessibilityRole="button" accessibilityLabel={x.nom} onPress={() => router.push(`/plan/${x.id}`)}>
                  <View style={[styles.plan, on && styles.planOn]}>
                    <LinearGradient colors={[mix(c.c, 30, colors.surface), colors.surface2]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
                    <Image source={COACH_IMAGES[c.id].corps} style={styles.planImg} contentFit="contain" contentPosition="top" />
                    <LinearGradient colors={['transparent', alpha(colors.bgAlt, 0.4), alpha(colors.bgAlt, 0.92)]} locations={[0.3, 0.58, 1]} style={StyleSheet.absoluteFill} />
                    <View style={[styles.planBadge, on && styles.planBadgeOn]}>
                      {verrou && <Icon name="lock" size={11} color={colors.text} strokeWidth={2.4} />}
                      <Text weight="bold" style={[styles.planBadgeTxt, on && styles.planBadgeTxtOn]}>
                        {on ? `Semaine ${progWeek(p)}/${x.sem}` : `${x.sem} sem.`}
                      </Text>
                    </View>
                    <View style={styles.planBas}>
                      <Text weight="semibold" style={styles.planNom} numberOfLines={2}>
                        {x.nom}
                      </Text>
                      <Text style={styles.planMeta} numberOfLines={1}>
                        {on ? 'En cours' : verrou ? 'NÉA Plus' : 'Disponible'} · {p.days} séances/sem. · {on ? ns.s.min : sem.plan.sessions[0].min} min
                      </Text>
                    </View>
                  </View>
                </Appui>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <TitreSection titre="Séances prêtes" action={`Tout voir (${SEANCES.length})`} onAction={() => router.push({ pathname: '/seances', params: { lieu } })} />
          <View style={styles.liste}>
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
          </View>
        </View>

        <View style={styles.section}>
          <TitreSection titre="Bibliothèque" />
          <Appui accessibilityRole="button" onPress={() => router.push('/exercices')}>
            <View style={styles.biblio}>
              <View style={styles.biblioImgs}>
                {EXERCICES.slice(0, 3).map((e, i) => (
                  <Image key={e.id} source={EXERCICE_IMAGES[e.id]} style={[styles.biblioImg, { left: i * 26, zIndex: 3 - i }]} contentFit="contain" />
                ))}
              </View>
              <View style={styles.flex}>
                <Text weight="semibold" style={styles.biblioH}>
                  {EXERCICES.length} exercices
                </Text>
                <Text style={styles.biblioP}>Technique, muscles travaillés et démo guidée</Text>
              </View>
              <Icon name="right" color={colors.textSecondary} />
            </View>
          </Appui>
        </View>
      </View>
    </Animated.ScrollView>
  );
}

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const JOURS_LONGS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const LETTRES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const debutMois = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const memeJour = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const idxJour = (d: Date) => (d.getDay() + 6) % 7;

/** Cases de la grille d'un mois, du lundi d'avant le 1er au dimanche d'après le dernier jour. */
function casesDuMois(mois: Date): Date[] {
  const debut = debutMois(mois);
  const fin = new Date(mois.getFullYear(), mois.getMonth() + 1, 0);
  const avant = idxJour(debut);
  const total = avant + fin.getDate() + (6 - idxJour(fin));
  return Array.from({ length: total }, (_, i) => new Date(debut.getFullYear(), debut.getMonth(), 1 - avant + i));
}

type Statut = 'faite' | 'aujourdhui' | 'prevue' | 'manquee' | 'repos';
const STATUT: Record<Statut, { label: string; couleur: string }> = {
  faite: { label: 'Faite', couleur: colors.pink },
  aujourdhui: { label: "Aujourd'hui", couleur: colors.pinkLight },
  prevue: { label: 'Prévue', couleur: colors.textSecondary },
  manquee: { label: 'Manquée', couleur: colors.error },
  repos: { label: 'Repos', couleur: colors.textTertiary },
};

/**
 * Sous-onglet Calendrier (design 10K « Calendrier ») : mois en grand, carte du mois (cercles de 40 pt, jours faits en
 * orange, séances prévues en anneau, jour choisi cerclé), panneau du jour choisi avec son statut, puis série, séances du
 * mois et semaine en cours. Au-delà de la semaine en cours, seules les séances du plan sont prévues (pas les séances ajoutées).
 */
function Calendrier() {
  const profil = useProfil();
  const sem = useSemaine();
  const wd = weekDates();
  const auj = new Date();
  auj.setHours(0, 0, 0, 0);
  const [choisi, setChoisi] = useState(auj);
  const [mois, setMois] = useState(debutMois(auj));

  const seanceDu = (d: Date) => {
    if (wd.some((x) => memeJour(x, d))) return sessionForDay(sem, idxJour(d));
    if (d < wd[0]) return null;
    return (sem.plan.sessions.find((x) => x.day === idxJour(d)) as SeanceJour | undefined) ?? null;
  };
  const statutDu = (d: Date): Statut => {
    if (jourFait(profil.logs, d)) return 'faite';
    const s = seanceDu(d);
    if (!s) return 'repos';
    if (memeJour(d, auj)) return 'aujourdhui';
    return d > auj ? 'prevue' : 'manquee';
  };

  const cases = casesDuMois(mois);
  const duMois = (d: Date) => d.getMonth() === mois.getMonth() && d.getFullYear() === mois.getFullYear();
  const faitesMois = cases.filter((d) => duMois(d) && jourFait(profil.logs, d)).length;
  const prevuesSem = wd.filter((d) => sessionForDay(sem, idxJour(d))).length;
  const faitesSem = wd.filter((d) => jourFait(profil.logs, d)).length;
  const changerMois = (n: number) => setMois(new Date(mois.getFullYear(), mois.getMonth() + n, 1));

  const s = seanceDu(choisi);
  const st = statutDu(choisi);
  const logsJour = profil.logs.filter((l) => memeJour(new Date(l.d), choisi));
  const semaineCourante = wd.some((x) => memeJour(x, choisi));

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.bas}>
      <EnTete titre="Ton programme" sous="Ta semaine, jour par jour." rubriques={ENTRAINEMENT} actif="Calendrier" />
      <View style={styles.page}>
        <View style={styles.hero}>
          <Text weight="bold" style={styles.mois}>
            {MOIS[mois.getMonth()][0].toUpperCase() + MOIS[mois.getMonth()].slice(1)}.
          </Text>
          <Text style={styles.heroSous}>Touche un jour pour voir ta séance.</Text>
          <View style={styles.heroLigne}>
            <Text weight="semibold" style={styles.heroPetit}>
              PROGRESSION
            </Text>
            <Text weight="bold" style={styles.heroCompte}>
              {faitesMois} {faitesMois > 1 ? 'JOURS ACTIFS' : 'JOUR ACTIF'} CE MOIS
            </Text>
          </View>
        </View>

        <View style={styles.calCarte}>
          <View style={styles.calTete}>
            <Icon name="cal" size={15} color={colors.textSecondary} />
            <Text weight="semibold" style={styles.calTitre} numberOfLines={1}>
              Séances et journal · {MOIS[mois.getMonth()]}
            </Text>
            <Appui accessibilityRole="button" accessibilityLabel="Mois précédent" onPress={() => changerMois(-1)} style={styles.calFleche}>
              <Icon name="left" size={15} color={colors.textSecondary} strokeWidth={2.2} />
            </Appui>
            <Appui accessibilityRole="button" accessibilityLabel="Mois suivant" onPress={() => changerMois(1)} style={styles.calFleche}>
              <Icon name="right" size={15} color={colors.textSecondary} strokeWidth={2.2} />
            </Appui>
          </View>
          <View style={styles.grille}>
            {LETTRES.map((l, i) => (
              <Text key={i} weight="semibold" style={styles.calLettre}>
                {l}
              </Text>
            ))}
            {cases.map((d) => {
              const dans = duMois(d);
              const sel = memeJour(d, choisi);
              const stat = statutDu(d);
              return (
                <View key={d.toISOString()} style={styles.case}>
                  <Appui
                    accessibilityRole="button"
                    accessibilityLabel={`${JOURS_LONGS[idxJour(d)]} ${d.getDate()} ${MOIS[d.getMonth()]}, ${STATUT[stat].label}`}
                    onPress={() => {
                      setChoisi(d);
                      if (!dans) setMois(debutMois(d));
                    }}
                    style={[
                      styles.rond,
                      !dans && styles.rondHors,
                      stat === 'faite' && styles.rondFait,
                      (stat === 'prevue' || stat === 'aujourdhui') && styles.rondPrevu,
                      sel && styles.rondSel,
                      !dans && stat === 'faite' && styles.estompe,
                    ]}
                  >
                    {stat === 'faite' ? (
                      <Icon name="check" size={15} strokeWidth={3} color={colors.onPrimary} />
                    ) : (
                      <Text weight={sel || memeJour(d, auj) ? 'bold' : 'medium'} style={[styles.rondNum, !dans && styles.rondNumHors, memeJour(d, auj) && styles.rondNumAuj]}>
                        {d.getDate()}
                      </Text>
                    )}
                  </Appui>
                </View>
              );
            })}
          </View>
        </View>

        {/* Panneau du jour choisi */}
        <View style={styles.panneau}>
          <View style={styles.panneauHaut}>
            <View style={styles.flex}>
              <Text weight="bold" style={styles.panneauTitre}>
                {JOURS_LONGS[idxJour(choisi)][0].toUpperCase() + JOURS_LONGS[idxJour(choisi)].slice(1)} {choisi.getDate()} {MOIS[choisi.getMonth()]}
              </Text>
              <Text style={styles.panneauSous}>
                {logsJour.length
                  ? logsJour.map((l) => `${l.title} · ${Math.round(l.min)} min`).join('\n')
                  : s
                    ? `${s.titre} · ${Math.round(s.min)} min${s.ride ? '' : ` · ${s.items.length} exercices`}`
                    : 'Récupération, marche ou vélo tranquille'}
              </Text>
            </View>
            <View style={[styles.statut, { backgroundColor: alpha(STATUT[st].couleur, 0.14) }]}>
              <Text weight="bold" style={[styles.statutTxt, { color: STATUT[st].couleur }]}>
                {STATUT[st].label}
              </Text>
            </View>
          </View>
          {semaineCourante && s && s.day != null && st !== 'faite' && (
            <Appui accessibilityRole="button" onPress={() => router.push(`/seance/${s.day}`)} style={styles.voir}>
              <Text weight="semibold" style={styles.voirTxt}>
                Voir la séance
              </Text>
              <Icon name="right" size={15} color={colors.pink} />
            </Appui>
          )}
        </View>

        {/* Barre de chiffres (série, mois, semaine en cours en orange plein) */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text weight="semibold" style={styles.statLabel}>
              SÉRIE
            </Text>
            <BigNumber value={serie(profil)} unit="j" size={22} unitSize={13} gap={2} />
          </View>
          <View style={styles.stat}>
            <Text weight="semibold" style={styles.statLabel}>
              CE MOIS
            </Text>
            <BigNumber value={faitesMois} unit={faitesMois > 1 ? 'jours' : 'jour'} size={22} unitSize={13} color={colors.pink} />
          </View>
          <View style={[styles.stat, styles.statPlein]}>
            <Text weight="semibold" style={[styles.statLabel, styles.statLabelPlein]}>
              SEMAINE
            </Text>
            <BigNumber value={`${Math.min(faitesSem, 7)}/${prevuesSem}`} size={22} color={colors.onPrimary} />
          </View>
        </View>

        <View style={styles.section}>
          <TitreSection titre="Ton plan" action="Modifier ma semaine" onAction={() => router.push('/reglages')} />
          <CarteProgramme />
        </View>
      </View>
    </ScrollView>
  );
}

const PLAN_L = 176;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  bas: { paddingBottom: 120 },
  page: { paddingHorizontal: ACCUEIL.marge, paddingTop: 10 },
  haut: { gap: 16 },
  section: { marginTop: ACCUEIL.entreSections },
  plansZone: { marginHorizontal: -ACCUEIL.marge },
  plans: { gap: 12, paddingHorizontal: ACCUEIL.marge, paddingVertical: 4 },
  plan: {
    width: PLAN_L,
    height: 236,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: alpha(colors.text, 0.12),
    boxShadow: `0 5px 9px ${alpha(colors.bgAlt, 0.34)}`,
  },
  planOn: { borderWidth: 1.5, borderColor: colors.pink },
  planImg: { position: 'absolute', top: 14, left: 10, right: 10, height: 150 },
  planBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: alpha(colors.bgAlt, 0.45),
    borderWidth: 0.5,
    borderColor: alpha(colors.text, 0.12),
  },
  planBadgeOn: { backgroundColor: colors.pink, borderColor: colors.pink },
  planBadgeTxt: { fontSize: 11, lineHeight: 14, color: colors.text, fontVariant: ['tabular-nums'] },
  planBadgeTxtOn: { color: colors.onPrimary },
  planBas: { position: 'absolute', left: 12, right: 12, bottom: 14, gap: 3 },
  planNom: { fontSize: 16, lineHeight: 20 },
  planMeta: { fontSize: 11.5, lineHeight: 15, color: alpha(colors.text, 0.75) },
  liste: { borderRadius: 20, backgroundColor: colors.surface, borderWidth: 0.6, borderColor: alpha(colors.text, 0.08), paddingTop: 6, paddingHorizontal: 12, paddingBottom: 8 },
  plus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  plusTxt: { fontSize: 13, lineHeight: 17, color: colors.pinkLight },
  biblio: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 0.6, borderColor: alpha(colors.text, 0.08) },
  biblioImgs: { width: 104, height: 56 },
  biblioImg: { position: 'absolute', top: 0, width: 56, height: 56, borderRadius: 14, backgroundColor: ui.iconBg },
  biblioH: { fontSize: 16, lineHeight: 21 },
  biblioP: { fontSize: 13, lineHeight: 17, color: colors.textSecondary, marginTop: 2 },
  hero: { gap: 8, marginBottom: 18 },
  mois: { fontSize: 34, lineHeight: 41, letterSpacing: -0.5 },
  heroSous: { fontSize: 15, lineHeight: 20, color: colors.textSecondary },
  heroLigne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 },
  heroPetit: { fontSize: 11, lineHeight: 14, letterSpacing: 0.6, color: alpha(colors.textSecondary, 0.72) },
  heroCompte: { fontSize: 11, lineHeight: 14, letterSpacing: 0.5, color: colors.pink },
  calCarte: { borderRadius: 26, backgroundColor: alpha(colors.text, 0.07), paddingHorizontal: 14, paddingVertical: 18, gap: 14, boxShadow: `0 8px 18px ${alpha(colors.bgAlt, 0.22)}` },
  calTete: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  calTitre: { flex: 1, fontSize: 15, lineHeight: 19 },
  calFleche: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.text, 0.06) },
  grille: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  calLettre: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 12, lineHeight: 16, color: alpha(colors.textSecondary, 0.62) },
  case: { width: `${100 / 7}%`, alignItems: 'center' },
  rond: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.text, 0.07) },
  rondHors: { backgroundColor: alpha(colors.text, 0.03) },
  rondFait: { backgroundColor: colors.pink },
  rondPrevu: { borderWidth: 1.5, borderColor: alpha(colors.pink, 0.7) },
  rondSel: { borderWidth: 2, borderColor: colors.text },
  estompe: { opacity: 0.42 },
  rondNum: { fontSize: 15, lineHeight: 19, color: alpha(colors.text, 0.82), fontVariant: ['tabular-nums'] },
  rondNumHors: { color: alpha(colors.textSecondary, 0.35) },
  rondNumAuj: { color: colors.pink },
  panneau: { marginTop: 20, borderRadius: 20, backgroundColor: alpha(colors.text, 0.08), padding: 16, gap: 12 },
  panneauHaut: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  panneauTitre: { fontSize: 15, lineHeight: 20 },
  panneauSous: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, marginTop: 4 },
  statut: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statutTxt: { fontSize: 11, lineHeight: 14 },
  voir: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  voirTxt: { fontSize: 14, lineHeight: 18, color: colors.pink },
  stats: { flexDirection: 'row', gap: 10, marginTop: 12 },
  stat: { flex: 1, borderRadius: 18, backgroundColor: alpha(colors.text, 0.1), paddingHorizontal: 14, paddingVertical: 14, gap: 6 },
  statPlein: { backgroundColor: colors.pink },
  statLabel: { fontSize: 10, lineHeight: 13, letterSpacing: 0.5, color: alpha(colors.textSecondary, 0.85) },
  statLabelPlein: { color: alpha(colors.onPrimary, 0.8) },
});
