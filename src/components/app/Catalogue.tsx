import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { EXERCICES, GROUPES, LIEUX, SEANCES_GRATUITES } from '@/data';
import type { ExerciceId, GroupeId, LieuId, Seance, SeanceId } from '@/data/types';
import { LVLN } from '@/lib/plan';
import { isPremium, wkLocked } from '@/lib/premium';
import { catSession } from '@/lib/semaine';
import { useProfil } from '@/store/profil';
import { colors, fonts, glow, ui } from '@/theme';

import { Row, RowText } from './Rows';
import { Thumb } from './Thumb';

/** Morceaux communs à l'onglet Programme et aux pages « Séances prêtes » et « Exercices ». */

export type FiltreGroupe = 'Tous' | 'pecs' | 'dos' | 'epaules' | 'bras' | 'jambes' | 'abdos' | 'cardio';
export const FILTRES_GROUPES: readonly [FiltreGroupe, string][] = [
  ['Tous', 'Tous'],
  ['pecs', 'Pecs'],
  ['dos', 'Dos'],
  ['epaules', 'Épaules'],
  ['bras', 'Bras'],
  ['jambes', 'Jambes'],
  ['abdos', 'Abdos'],
  ['cardio', 'Cardio'],
];
export const filtrerGroupe = (f: FiltreGroupe, g: GroupeId) =>
  f === 'Tous' ||
  g === f ||
  (f === 'bras' && ['biceps', 'triceps'].includes(g)) ||
  (f === 'jambes' && ['quads', 'ischios', 'fessiers', 'mollets'].includes(g));

/** Recherche sans accents ni majuscules. */
export const normaliser = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export const premierExo = (w: Seance) => w.ex[0].split(':')[0] as ExerciceId;

/** Lieu proposé d'abord : celui choisi dans l'onboarding (salle si « les deux »). */
export const lieuDuProfil = (gear: string): LieuId => (gear === 'maison' ? 'maison' : 'salle');

/** Une séance prête : vignette, titre, durée, niveau, et « + » pour la planifier (.wrow du prototype). */
export function SeanceLigne({ w, onPlanifier }: { w: Seance; onPlanifier: (id: SeanceId) => void }) {
  const weight = useProfil((s) => s.weight);
  const mod = useProfil((s) => s.wkMod[w.id] ?? 0);
  const s = catSession(w, null, weight, mod);
  const lk = wkLocked(w.id);
  return (
    <View style={styles.wrow}>
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
      <Pressable accessibilityRole="button" accessibilityLabel={`Ajouter ${w.t} à ma semaine`} style={styles.wadd} onPress={() => onPlanifier(w.id)}>
        <Icon name="plus" color={colors.pinkLight} />
      </Pressable>
    </View>
  );
}

/** Un exercice de la bibliothèque. */
export function ExerciceLigne({ e, sous, onPress }: { e: (typeof EXERCICES)[number]; sous: string; onPress: () => void }) {
  return (
    <Row onPress={onPress} accessibilityLabel={e.nom}>
      <Thumb id={e.id} />
      <RowText title={e.nom} sub={sous} />
      <Icon name="right" color={colors.textSecondary} />
    </Row>
  );
}

export const sousTitreExo = (e: (typeof EXERCICES)[number], materiel: string) => `${GROUPES[e.groupe]} • ${materiel}`;

/** Onglets À la maison / Salle de sport / En extérieur (.lieux du prototype). */
export function OngletsLieux({ lieu, onChange }: { lieu: LieuId; onChange: (l: LieuId) => void }) {
  return (
    <View style={styles.ltabs} accessibilityRole="tablist">
      {(Object.entries(LIEUX) as [LieuId, string][]).map(([key, l]) => (
        <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: key === lieu }} onPress={() => onChange(key)} style={styles.ltab}>
          <Text weight="semibold" style={[styles.ltabTxt, key === lieu && styles.ltabOn]}>
            {l}
          </Text>
          {key === lieu && <View style={[styles.ltabBar, glow(colors.pink, 8)]} />}
        </Pressable>
      ))}
    </View>
  );
}

/** Filtre pilule (.filters button / .gchips button). */
export function Chip({ label, on, onPress, petit }: { label: string; on: boolean; onPress: () => void; petit?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={[petit ? styles.gchip : styles.filter, on && styles.chipOn]}>
      <Text style={[petit ? styles.gchipTxt : styles.filterTxt, on && styles.chipTxtOn]}>{label}</Text>
    </Pressable>
  );
}

/** Champ de recherche (.srch). */
export function Recherche({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <View style={styles.srch}>
      <Icon name="search" color={colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        style={styles.srchInput}
        accessibilityLabel="Rechercher"
        returnKeyType="search"
        autoCorrect={false}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Effacer" onPress={() => onChange('')} hitSlop={8}>
          <Icon name="x" size={16} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** En-tête d'une page de la bibliothèque : retour + titre. */
export function EnTetePage({ titre, sous, retour }: { titre: string; sous?: string; retour?: Href }) {
  return (
    <View style={styles.head}>
      <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => (retour ? router.navigate(retour) : router.canGoBack() ? router.back() : router.navigate('/programme'))} style={styles.back}>
        <Icon name="left" />
      </Pressable>
      <View style={styles.flex}>
        <Text style={styles.h1} accessibilityRole="header">
          {titre}
        </Text>
        {sous ? <Text style={styles.sous}>{sous}</Text> : null}
      </View>
    </View>
  );
}

export const catalogueStyles = StyleSheet.create({
  note: { fontSize: 12, lineHeight: 17, color: colors.textSecondary },
  noteVide: { paddingVertical: 12, paddingHorizontal: 4 },
  wsep: { borderBottomWidth: 1, borderBottomColor: colors.border },
  gchips: { gap: 6, paddingTop: 2, paddingBottom: 8 },
  filters: { gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
});

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  wrow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 4 },
  wmain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 },
  wh5: { fontSize: 14.5, lineHeight: 19 },
  wp: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary, marginTop: 3 },
  wadd: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: ui.toast,
    borderWidth: 1,
    borderColor: colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ltabs: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 },
  ltab: { paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center' },
  ltabTxt: { fontSize: 14, lineHeight: 18, color: colors.textSecondary },
  ltabOn: { color: colors.text },
  ltabBar: { position: 'absolute', bottom: 2, left: '30%', right: '30%', height: 3, borderRadius: 3, backgroundColor: colors.pink },
  gchip: { height: 30, paddingHorizontal: 12, borderRadius: 999, backgroundColor: ui.dark, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  gchipTxt: { fontSize: 12, lineHeight: 15, color: ui.text3 },
  filter: { height: 32, paddingHorizontal: 14, borderRadius: 999, backgroundColor: ui.chipBg, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  filterTxt: { fontSize: 12.5, lineHeight: 16, color: ui.text3 },
  chipOn: { borderColor: colors.pink, backgroundColor: 'rgba(255,107,26,0.14)' },
  chipTxtOn: { color: colors.text },
  srch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  srchInput: { flex: 1, color: colors.text, ...fonts.regular, fontSize: 14.5 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 6, paddingHorizontal: 12, paddingBottom: 10 },
  back: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  h1: { ...fonts.semibold, fontSize: 28, lineHeight: 34, letterSpacing: -0.3 },
  sous: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
});
