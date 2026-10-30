/**
 * Haut de l'onglet Programme, d'après les designs 10K « Routine » (process-routine-page) et « Calendrier »
 * (process-program-calendar), portés de SwiftUI : semaine en cercles de 40 pt, progression du programme en barre de
 * traits (PlanLymphCircuitStepsBar, 52 pt, coins de 18), séance du jour en carrousel de grandes cartes
 * (PlanProtocolCarouselCard : 156 × 272, coins de 22, fondu sombre, pastille séries × reps) puis Lancer la séance.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { TitreSection } from '@/components/app/AccueilDesign';
import { ExerciceSheet } from '@/components/app/ExerciceSheet';
import { lancerSortie } from '@/components/app/lancerSortie';
import { Appui, Icon, Text } from '@/components/ui';
import { DECO_IMAGES, EXERCICE_IMAGES } from '@/data';
import { exercice, lvlN, LVLN, prog, progWeek, todayIdx, type PlanItem } from '@/lib/plan';
import { nextSession, sessionForDay, weekDates } from '@/lib/semaine';
import { selectProfil, useProfil, useSemaine } from '@/store/profil';
import { alpha, colors, fonts } from '@/theme';

const LETTRES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const ouvrirCalendrier = () => router.navigate({ pathname: '/programme', params: { vue: 'calendrier' } });

/** Jour fait d'après le journal (date locale). */
export const jourFait = (logs: readonly { d: string }[], d: Date) => logs.some((l) => new Date(l.d).toDateString() === d.toDateString());

/**
 * Semaine en cercles (cellules du calendrier 10K) : lettre au-dessus, numéro du jour ; plein orange coché = activité faite,
 * anneau orange = séance prévue, aujourd'hui éclairci et en gras. Toucher un jour ouvre le calendrier.
 */
export function SemaineJours() {
  const sem = useSemaine();
  const logs = useProfil((s) => s.logs);
  const wd = weekDates();
  const auj = todayIdx();
  return (
    <Appui accessibilityRole="button" accessibilityLabel="Ouvrir le calendrier" onPress={ouvrirCalendrier} style={styles.semaine}>
      {wd.map((d, i) => {
        const fait = jourFait(logs, d);
        const prevu = !!sessionForDay(sem, i);
        const estAuj = i === auj;
        return (
          <View key={i} style={styles.jour}>
            <Text weight="semibold" style={[styles.lettre, estAuj && styles.lettreAuj]}>
              {LETTRES[i]}
            </Text>
            <View style={[styles.cercle, estAuj && styles.cercleAuj, prevu && !fait && styles.cerclePrevu, fait && styles.cercleFait]}>
              {fait ? (
                <Icon name="check" size={15} strokeWidth={3} color={colors.onPrimary} />
              ) : (
                <Text weight={estAuj ? 'bold' : 'medium'} style={[styles.num, estAuj && styles.numAuj]}>
                  {d.getDate()}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </Appui>
  );
}

const TRAIT = 2.75;

/** Barre de traits (PlanLymphCircuitStepsBar) : autant de traits que la largeur en permet, les premiers allumés en orange. */
export function BarreTraits({ part }: { part: number }) {
  const [w, setW] = useState(0);
  const n = Math.max(8, Math.floor((w + TRAIT) / (TRAIT * 2)));
  const allumes = part > 0 ? Math.min(n, Math.max(1, Math.floor(n * part))) : 0;
  return (
    <View style={styles.traits} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && Array.from({ length: n }, (_, i) => <View key={i} style={[styles.trait, i < allumes && styles.traitOn]} />)}
    </View>
  );
}

/** Programme suivi : nom et semaine n sur N, puis la barre de traits et le pourcentage. */
export function CarteProgramme() {
  const p = useProfil(useShallow(selectProfil));
  const pr = prog(p);
  const n = progWeek(p);
  const pc = Math.min(100, Math.round((Math.max(0, n - 1) / pr.sem) * 100 + 100 / pr.sem / 2));
  return (
    <Appui accessibilityRole="button" accessibilityLabel={`${pr.nom}, semaine ${n} sur ${pr.sem}, ${pc} %`} onPress={() => router.push(`/plan/${pr.id}`)}>
      <View style={styles.prog}>
        <View style={styles.progHaut}>
          <Text weight="semibold" style={styles.progNom} numberOfLines={1}>
            {pr.nom}
          </Text>
          <Text weight="medium" style={styles.progSem}>
            Semaine {n} sur {pr.sem}
          </Text>
          <Icon name="right" size={15} color={colors.textTertiary} />
        </View>
        <View style={styles.barreLigne}>
          <Icon name="chart" size={17} color={colors.pink} strokeWidth={2.2} />
          <BarreTraits part={pc / 100} />
          <Text weight="semibold" style={styles.pc}>
            {pc} %
          </Text>
        </View>
      </View>
    </Appui>
  );
}

const badge = (it: PlanItem) => `${it.sets}×${it.reps ? it.reps[1] : `${it.sec} s`}`;

/**
 * Séance du jour (ou la prochaine) : titre de section, carte d'en-tête (scène du coach, durée, exercices, à la maison),
 * carrousel des exercices en grandes cartes (toucher = fiche exercice) puis Lancer la séance.
 */
export function Aujourdhui() {
  const sem = useSemaine();
  const level = useProfil((s) => s.level);
  const ns = nextSession(sem);
  const s = ns.s;
  const [exo, setExo] = useState<PlanItem | null>(null);
  const titre = ns.offset === 0 ? 'Aujourd’hui' : ns.offset === 1 ? 'Demain' : 'Ta prochaine séance';
  const lancer = () => {
    if (s.ride) return lancerSortie(s.min, s.cat);
    if (s.day == null) return;
    router.push({ pathname: '/seance-en-cours', params: { jour: String(s.day) } });
  };
  const voir = () => (s.day != null ? router.push(`/seance/${s.day}`) : undefined);
  return (
    <View>
      <TitreSection titre={titre} action="Voir la séance" onAction={s.day != null ? voir : undefined} />
      <Appui accessibilityRole="button" accessibilityLabel={`Voir ${s.titre}`} onPress={voir}>
        <View style={styles.tete}>
          <Image source={ns.offset === 0 ? DECO_IMAGES.salle : DECO_IMAGES.etirement} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={['transparent', alpha(colors.bgAlt, 0.35), alpha(colors.bgAlt, 0.9)]} locations={[0.25, 0.6, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.pastilles}>
            {!!sem.planMaison && !s.cat && !s.ride && s.day != null ? (
              <Appui
                accessibilityRole="switch"
                accessibilityState={{ checked: !!s.maison }}
                accessibilityLabel="Faire la séance à la maison"
                onPress={() => useProfil.getState().aLaMaison(s.day!, !s.maison)}
                style={[styles.pastille, s.maison && styles.pastilleOn]}
              >
                <Icon name="home" size={13} color={s.maison ? colors.onPrimary : colors.text} />
                <Text weight="semibold" style={[styles.pastilleTxt, s.maison && styles.pastilleTxtOn]}>
                  {s.maison ? 'À la maison' : 'Faire à la maison'}
                </Text>
              </Appui>
            ) : (
              <View />
            )}
            <View style={styles.pastille}>
              <Text weight="bold" style={styles.pastilleTxt}>
                {Math.round(s.min)} min
              </Text>
            </View>
          </View>
          <View style={styles.teteBas}>
            <Text weight="bold" style={styles.teteTitre} numberOfLines={2}>
              {s.titre}
            </Text>
            <Text style={styles.teteMeta}>{s.ride ? 'Sortie vélo' : `${s.items.length} exercices · ${s.maison ? 'à la maison' : LVLN[lvlN(level) - 1]}`}</Text>
          </View>
        </View>
      </Appui>

      {!s.ride && s.items.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARTE_L + 12}
          decelerationRate="fast"
          contentContainerStyle={styles.carrousel}
          style={styles.carrouselZone}
        >
          {s.items.map((it, i) => (
            <Appui key={i} accessibilityRole="button" accessibilityLabel={`${exercice(it.id).nom}, ${badge(it)}`} onPress={() => setExo(it)}>
              <View style={styles.carte}>
                <View style={styles.carteFond}>
                  <Image source={EXERCICE_IMAGES[it.id]} style={styles.carteImg} contentFit="contain" contentPosition="top" />
                </View>
                <LinearGradient
                  colors={[alpha(colors.bgAlt, 0.06), 'transparent', alpha(colors.bgAlt, 0.35), alpha(colors.bgAlt, 0.88)]}
                  locations={[0, 0.3, 0.62, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.badge}>
                  <Text weight="bold" style={styles.badgeTxt}>
                    {badge(it)}
                  </Text>
                </View>
                <View style={styles.carteBas}>
                  <Text style={styles.carteNum}>{String(i + 1).padStart(2, '0')}</Text>
                  <Text weight="semibold" style={styles.carteNom} numberOfLines={2}>
                    {exercice(it.id).nom}
                  </Text>
                </View>
              </View>
            </Appui>
          ))}
        </ScrollView>
      )}

      <Appui accessibilityRole="button" onPress={lancer} style={styles.lancer}>
        <Icon name="play" size={18} color={colors.onPrimary} strokeWidth={2.4} />
        <Text weight="semibold" style={styles.lancerTxt}>
          {s.ride ? 'Lancer la sortie' : 'Lancer la séance'}
        </Text>
      </Appui>
      <ExerciceSheet id={exo?.id ?? null} it={exo ?? undefined} onClose={() => setExo(null)} />
    </View>
  );
}

const CARTE_L = 156;
const CARTE_H = 252;

const styles = StyleSheet.create({
  semaine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  jour: { alignItems: 'center', gap: 8 },
  lettre: { fontSize: 12, lineHeight: 15, color: alpha(colors.textSecondary, 0.8) },
  lettreAuj: { color: colors.text },
  cercle: { width: 40, height: 40, borderRadius: 20, backgroundColor: alpha(colors.text, 0.07), alignItems: 'center', justifyContent: 'center' },
  cercleAuj: { backgroundColor: alpha(colors.text, 0.14) },
  cerclePrevu: { borderWidth: 2, borderColor: colors.pink },
  cercleFait: { backgroundColor: colors.pink, boxShadow: `0 0 12px ${alpha(colors.pink, 0.45)}` },
  num: { fontSize: 15, lineHeight: 19, color: alpha(colors.text, 0.82), fontVariant: ['tabular-nums'] },
  numAuj: { color: colors.text },
  prog: { borderRadius: 18, backgroundColor: colors.surface, borderWidth: 0.6, borderColor: alpha(colors.text, 0.08), paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  progHaut: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progNom: { flex: 1, fontSize: 16, lineHeight: 21 },
  progSem: { fontSize: 13, lineHeight: 17, color: colors.textSecondary },
  barreLigne: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 44 },
  traits: { flex: 1, height: 14, flexDirection: 'row', justifyContent: 'space-between' },
  trait: { width: TRAIT, height: 14, borderRadius: TRAIT / 2, backgroundColor: alpha(colors.text, 0.13) },
  traitOn: { backgroundColor: colors.pink },
  pc: { fontSize: 15, lineHeight: 19, minWidth: 40, textAlign: 'right', fontVariant: ['tabular-nums'] },
  tete: { height: 176, borderRadius: 22, overflow: 'hidden', justifyContent: 'space-between', backgroundColor: colors.surface },
  pastilles: { flexDirection: 'row', justifyContent: 'space-between', padding: 10 },
  pastille: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: alpha(colors.bgAlt, 0.5),
    borderWidth: 0.5,
    borderColor: alpha(colors.text, 0.14),
  },
  pastilleOn: { backgroundColor: colors.pink, borderColor: colors.pink },
  pastilleTxt: { fontSize: 12, lineHeight: 15, color: colors.text, fontVariant: ['tabular-nums'] },
  pastilleTxtOn: { color: colors.onPrimary },
  teteBas: { paddingHorizontal: 16, paddingBottom: 14, gap: 2 },
  teteTitre: { fontSize: 21, lineHeight: 26, letterSpacing: -0.3 },
  teteMeta: { fontSize: 13.5, lineHeight: 18, color: alpha(colors.text, 0.78) },
  carrouselZone: { marginHorizontal: -16, marginTop: 14 },
  carrousel: { gap: 12, paddingHorizontal: 16, paddingVertical: 4 },
  carte: {
    width: CARTE_L,
    height: CARTE_H,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: alpha(colors.text, 0.12),
    boxShadow: `0 5px 9px ${alpha(colors.bgAlt, 0.34)}`,
  },
  carteFond: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.surface2, paddingTop: 22, paddingHorizontal: 8 },
  carteImg: { width: '100%', height: CARTE_H * 0.62 },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: alpha(colors.bgAlt, 0.45),
    borderWidth: 0.5,
    borderColor: alpha(colors.text, 0.12),
  },
  badgeTxt: { fontSize: 11, lineHeight: 14, color: alpha(colors.text, 0.96), fontVariant: ['tabular-nums'] },
  carteBas: { position: 'absolute', left: 12, right: 12, bottom: 14, gap: 2 },
  carteNum: { fontSize: 12, lineHeight: 15, color: colors.pink, ...fonts.bold, fontVariant: ['tabular-nums'] },
  carteNom: { fontSize: 15, lineHeight: 19, color: colors.text },
  lancer: {
    marginTop: 16,
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
