/**
 * Accueil (maquette de l'utilisateur, oct. 2026) : « Ton bilan du jour » utile même sans Apple Watch.
 * Énergie (check-in), Activité (séances du journal), Sommeil / Courbatures (check-in), message du coach,
 * prochaine séance et cartes à découvrir.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { Sheet } from '@/components/app/Sheet';
import { Appui, Button, Card, Icon, Text, type IconName } from '@/components/ui';
import { COACH_IMAGES, DECO_IMAGES, EXERCICES } from '@/data';
import type { GroupeId } from '@/data/types';
import {
  activite,
  COURBATURES,
  ENERGIE,
  heureCourte,
  jourLocal,
  messageCoach,
  phraseActivite,
  ressentiDuJour,
  SOMMEIL,
  type Ressenti,
} from '@/lib/bilan';
import { CARTES, possedees } from '@/lib/jeu';
import { motivationDuJour } from '@/lib/motivation';
import { coachById } from '@/lib/plan';
import type { SeanceJour } from '@/lib/semaine';
import { useProfil } from '@/store/profil';
import { alpha, colors, fonts, ui } from '@/theme';

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;
const JOURS_LONGS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;

/** Ressenti du jour, relu à chaque rendu (minuit passé, il redevient vide). */
function useRessenti() {
  return useProfil((s) => ressentiDuJour(s.ressentis));
}

/* ───────────── Check-in ───────────── */

function Choix({ libelles, valeur, debut, onChoix, nom }: { libelles: readonly string[]; valeur: number | null; debut: number; onChoix: (v: number) => void; nom: string }) {
  return (
    <View style={styles.choix} accessibilityRole="radiogroup" accessibilityLabel={nom}>
      {libelles.slice(debut).map((l, i) => {
        const v = i + debut;
        const on = valeur === v;
        return (
          <Pressable
            key={l}
            onPress={() => onChoix(v)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={[styles.pastille, on && styles.pastilleOn]}
          >
            <Text weight={on ? 'semibold' : 'regular'} style={[styles.pastilleTxt, on && styles.pastilleTxtOn]}>
              {l}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Feuille « Comment tu te sens ? » : énergie, sommeil, courbatures (3 touchers). */
export function RessentiSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const actuel = useRessenti();
  const noter = useProfil((s) => s.noterRessenti);
  const [energie, setEnergie] = useState<number | null>(actuel?.energie ?? null);
  const [sommeil, setSommeil] = useState<number | null>(actuel?.sommeil ?? null);
  const [courb, setCourb] = useState<number | null>(actuel?.courbatures ?? null);
  const pret = energie != null && sommeil != null && courb != null;
  const enregistrer = () => {
    if (!pret) return;
    const now = new Date();
    const r: Ressenti = { d: jourLocal(now), t: now.getTime(), energie, sommeil, courbatures: courb };
    noter(r);
    onClose();
  };
  return (
    <Sheet visible={visible} onClose={onClose} title="Comment tu te sens ?">
      <Text style={styles.sheetSous}>Trois réponses rapides pour ton bilan du jour.</Text>
      <Text weight="semibold" style={styles.question}>
        Ton énergie
      </Text>
      <Choix nom="Ton énergie" libelles={ENERGIE} debut={1} valeur={energie} onChoix={setEnergie} />
      <Text weight="semibold" style={styles.question}>
        Ta nuit
      </Text>
      <Choix nom="Ta nuit" libelles={SOMMEIL} debut={1} valeur={sommeil} onChoix={setSommeil} />
      <Text weight="semibold" style={styles.question}>
        Tes courbatures
      </Text>
      <Choix nom="Tes courbatures" libelles={COURBATURES} debut={0} valeur={courb} onChoix={setCourb} />
      <Button label="Enregistrer" onPress={enregistrer} disabled={!pret} style={styles.enregistrer} />
    </Sheet>
  );
}

/* ───────────── Bilan du jour ───────────── */

function CarteEnergie({ onRessenti }: { onRessenti: () => void }) {
  const r = useRessenti();
  return (
    <Appui
      accessibilityRole="button"
      accessibilityLabel={r ? `Énergie : ${ENERGIE[r.energie]}. Modifier mon ressenti` : 'Énergie : donner mon ressenti'}
      onPress={onRessenti}
      style={styles.flex}
    >
      <Card style={styles.demi}>
        <View style={styles.enTete}>
          <Icon name="sun" size={24} color={colors.pink} />
          <Text weight="semibold" style={styles.enTeteTxt}>
            Énergie
          </Text>
        </View>
        <Text weight="bold" style={styles.valeurMot} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {r ? ENERGIE[r.energie] : 'À noter'}
        </Text>
        <Text style={styles.petit} numberOfLines={1}>
          {r ? `Ton ressenti · ${heureCourte(r.t)}` : 'Comment tu te sens ?'}
        </Text>
        <View style={styles.segments}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.segment, r && i <= r.energie && styles.segmentOn]} />
          ))}
        </View>
        <View style={styles.flex} />
        <View style={styles.lien}>
          <Text weight="semibold" style={styles.lienTxt} numberOfLines={2}>
            {r ? 'Modifier mon ressenti' : 'Donner mon ressenti'}
          </Text>
          <Icon name="diag" size={16} color={colors.pink} strokeWidth={2} />
        </View>
      </Card>
    </Appui>
  );
}

function CarteActivite() {
  const logs = useProfil((s) => s.logs);
  const now = new Date();
  const a = activite(logs, now);
  const auj = jourLocal(now);
  const types = logs.filter((l) => jourLocal(new Date(l.d)) === auj).map((l) => l.type);
  const max = Math.max(30, ...a.semaine);
  return (
    <Appui accessibilityRole="button" accessibilityLabel={`Activité : ${a.min} minutes aujourd’hui, ${phraseActivite(a, types)}`} onPress={() => router.navigate('/progres')} style={styles.flex}>
      <Card style={styles.demi}>
        <View style={styles.enTete}>
          <Icon name="run" size={24} color={colors.pink} />
          <Text weight="semibold" style={styles.enTeteTxt}>
            Activité
          </Text>
        </View>
        <View style={styles.minutes}>
          <Text weight="bold" style={styles.gros}>
            {a.min}
          </Text>
          <Text style={styles.unite}>min</Text>
        </View>
        <Text style={styles.petitClair} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {phraseActivite(a, types)}
        </Text>
        <View style={styles.barres} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {a.semaine.map((m, i) => (
            <View key={i} style={styles.barreCol}>
              <View style={styles.barreZone}>
                <View style={[styles.barre, m > 0 ? { height: `${Math.max(28, (m / max) * 100)}%`, backgroundColor: colors.pink } : null, i === a.auj && !m && styles.barreAuj]} />
              </View>
              <Text style={[styles.jour, i === a.auj && styles.jourAuj]}>{JOURS[i]}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.source} numberOfLines={1}>
          {a.montre ? 'Avec ton Apple Watch' : 'Enregistrée dans NÉA'}
        </Text>
      </Card>
    </Appui>
  );
}

function LigneReponses({ onRessenti }: { onRessenti: () => void }) {
  const r = useRessenti();
  return (
    <Appui accessibilityRole="button" accessibilityLabel={r ? `Sommeil : ${SOMMEIL[r.sommeil]}. Courbatures : ${COURBATURES[r.courbatures]}` : 'Noter mon sommeil et mes courbatures'} onPress={onRessenti}>
      <Card style={styles.ligne}>
        <View style={styles.ligneHaut}>
          <View style={styles.ligneMoitie}>
            <Icon name="moon" size={22} color={ui.tuileSommeil} fill={ui.tuileSommeil} />
            <Text weight="semibold" style={styles.ligneTxt} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              Sommeil : {r ? SOMMEIL[r.sommeil].toLowerCase() : '—'}
            </Text>
          </View>
          <View style={styles.separateur} />
          <View style={styles.ligneMoitie}>
            <Icon name="biceps" size={22} color={colors.pink} />
            <Text weight="semibold" style={styles.ligneTxt} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              Courbatures : {r ? COURBATURES[r.courbatures].toLowerCase() : '—'}
            </Text>
          </View>
        </View>
        <Text style={styles.ligneBas}>{r ? 'Tes réponses du matin' : 'Touche pour répondre'}</Text>
      </Card>
    </Appui>
  );
}

/** Énergie + Activité côte à côte, puis la ligne Sommeil / Courbatures. */
export function BilanDuJour({ onRessenti }: { onRessenti: () => void }) {
  return (
    <View style={styles.bilan}>
      <View style={styles.rangee}>
        <CarteEnergie onRessenti={onRessenti} />
        <CarteActivite />
      </View>
      <LigneReponses onRessenti={onRessenti} />
    </View>
  );
}

/* ───────────── Coach ───────────── */

/** Message du coach selon le bilan ; ouvre le check-in s'il manque, sinon la conversation. */
export function CarteMessageCoach({ onRessenti }: { onRessenti: () => void }) {
  const { coach, progStart, name, logs } = useProfil(useShallow((s) => ({ coach: s.coach, progStart: s.progStart, name: s.name, logs: s.logs })));
  const r = useRessenti();
  const auj = jourLocal();
  const seanceFaite = logs.some((l) => jourLocal(new Date(l.d)) === auj);
  const m = messageCoach({ ressenti: r, seanceFaite, motDuJour: motivationDuJour(progStart, name) });
  const c = coachById(coach);
  return (
    <Appui accessibilityRole="button" accessibilityLabel={m.titre} onPress={() => (m.checkin ? onRessenti() : router.navigate('/coach'))}>
      <Card style={styles.coach}>
        <View style={styles.tete}>
          <Image source={COACH_IMAGES[c.id].tete} style={styles.remplir} contentFit="cover" />
        </View>
        <View style={styles.flex}>
          <Text weight="bold" style={styles.coachTitre}>
            {m.titre}
          </Text>
          <Text style={styles.coachTxt} numberOfLines={3}>
            {m.sous}
          </Text>
        </View>
        <Icon name="right" size={20} color={colors.textSecondary} />
      </Card>
    </Appui>
  );
}

/* ───────────── Prochaine séance ───────────── */

const GROUPE_COURT: Record<GroupeId, string> = {
  pecs: 'pecs',
  dos: 'dos',
  epaules: 'épaules',
  biceps: 'biceps',
  triceps: 'triceps',
  quads: 'cuisses',
  ischios: 'ischios',
  fessiers: 'fessiers',
  mollets: 'mollets',
  abdos: 'abdos',
  cardio: 'cardio',
};

/** « Pecs, épaules, triceps » : les 3 premiers groupes musculaires de la séance. */
function groupes(s: SeanceJour): string {
  const g: string[] = [];
  for (const it of s.items) {
    const e = EXERCICES.find((x) => x.id === it.id);
    const nom = e ? GROUPE_COURT[e.groupe] : null;
    if (nom && !g.includes(nom)) g.push(nom);
    if (g.length === 3) break;
  }
  const t = g.join(', ');
  return t ? t[0].toUpperCase() + t.slice(1) : '';
}

/** Libellé de la pastille : Aujourd'hui, Demain ou le jour. */
export function quandSeance(offset: number, now: Date = new Date()): string {
  if (offset === 0) return 'Aujourd’hui';
  if (offset === 1) return 'Demain';
  return JOURS_LONGS[(((now.getDay() + 6) % 7) + offset) % 7];
}

/** Titre de section avec la pastille du jour de la séance. */
export function TeteSeance({ offset }: { offset: number }) {
  return (
    <View style={styles.teteSeance}>
      <Text weight="bold" style={styles.h2} accessibilityRole="header">
        Ta prochaine séance
      </Text>
      <View style={styles.quand}>
        <Icon name="cal" size={16} color={colors.text} />
        <Text style={styles.quandTxt}>{quandSeance(offset)}</Text>
      </View>
    </View>
  );
}

/** Prochaine séance : titre, groupes musculaires, durée · exercices, Voir la séance ; Axel à droite. */
export function CarteProchaineSeance({ s, offset, onLancer }: { s: SeanceJour; offset: number; onLancer: () => void }) {
  const voir = () => (s.ride ? onLancer() : s.day != null ? router.push(`/seance/${s.day}`) : router.navigate('/programme'));
  // « Push : pecs, épaules, triceps » → titre « Push », sous-titre « Pecs, épaules, triceps ».
  const [titre, apres] = s.titre.split(' : ');
  const sous = apres ? apres[0].toUpperCase() + apres.slice(1) : s.ride ? 'Sortie vélo' : groupes(s);
  return (
    <Appui accessibilityRole="button" accessibilityLabel={`${s.titre}, ${Math.round(s.min)} minutes. Voir la séance`} onPress={voir}>
      <Card style={styles.seance}>
        <Image source={offset === 0 ? DECO_IMAGES.salle : DECO_IMAGES.etirement} style={styles.seanceImg} contentFit="cover" />
        <LinearGradient
          colors={[colors.surface, alpha(colors.surface, 0.85), alpha(colors.surface, 0)]}
          locations={[0.3, 0.5, 0.8]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.seanceTxt}>
          <Text weight="bold" style={styles.seanceTitre} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75}>
            {titre}
          </Text>
          {!!sous && (
            <Text style={styles.seanceSous} numberOfLines={2}>
              {sous}
            </Text>
          )}
          <Text style={styles.meta}>
            {Math.round(s.min)} min{s.ride ? '' : ` · ${s.items.length} exercice${s.items.length > 1 ? 's' : ''}`}
          </Text>
          <Appui accessibilityRole="button" accessibilityLabel={s.ride ? 'Lancer la sortie' : 'Voir la séance'} onPress={voir} style={styles.voir}>
            <Text weight="semibold" style={styles.voirTxt}>
              {s.ride ? 'Lancer' : 'Voir la séance'}
            </Text>
            <Icon name="arrow" size={18} color={colors.onPrimary} strokeWidth={2.2} />
          </Appui>
        </View>
      </Card>
    </Appui>
  );
}

/* ───────────── Cartes à collectionner ───────────── */

/** Cartes à ouvrir, sinon cartes encore à découvrir dans la collection. */
export function CarteCollection() {
  const jeu = useProfil((s) => s.jeu);
  const aOuvrir = jeu.paquets.reduce((a, p) => a + p.cartes.length, 0);
  const reste = CARTES.length - possedees(jeu);
  const [titre, sous, lien]: [string, string, '/cartes/ouvrir' | '/cartes'] = aOuvrir
    ? [aOuvrir === 1 ? '1 carte à ouvrir' : `${aOuvrir} cartes à ouvrir`, 'Touche pour les découvrir.', '/cartes/ouvrir']
    : reste > 0
      ? [reste === 1 ? '1 carte à découvrir' : `${reste} cartes à découvrir`, 'Continue ta progression.', '/cartes']
      : ['Collection complète !', 'Tu as toutes les cartes.', '/cartes'];
  const icone: IconName = 'cadeau';
  return (
    <Appui accessibilityRole="button" accessibilityLabel={`${titre}. ${sous}`} onPress={() => router.push(lien)}>
      <Card style={styles.collection}>
        <Icon name={icone} size={34} color={colors.pink} strokeWidth={1.6} />
        <View style={styles.flex}>
          <Text weight="semibold" style={styles.collectionTitre}>
            {titre}
          </Text>
          <Text style={styles.petit}>{sous}</Text>
        </View>
        <Icon name="right" size={20} color={colors.textSecondary} />
      </Card>
    </Appui>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  remplir: { width: '100%', height: '100%' },
  bilan: { gap: 12 },
  rangee: { flexDirection: 'row', gap: 12 },
  demi: { flex: 1, padding: 16, gap: 6, minHeight: 210 },
  enTete: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  enTeteTxt: { fontSize: 16, lineHeight: 21 },
  valeurMot: { fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  minutes: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  gros: { fontSize: 40, lineHeight: 46, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  unite: { fontSize: 18, lineHeight: 24, color: colors.textSecondary },
  petit: { fontSize: 13.5, lineHeight: 18, color: colors.textSecondary },
  petitClair: { fontSize: 14, lineHeight: 19, color: colors.text },
  segments: { flexDirection: 'row', gap: 5, marginTop: 14 },
  segment: { flex: 1, height: 9, borderRadius: 5, backgroundColor: ui.dark },
  segmentOn: { backgroundColor: colors.pink },
  lien: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 14 },
  lienTxt: { flexShrink: 1, fontSize: 14, lineHeight: 19, color: colors.pink },
  barres: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  barreCol: { alignItems: 'center', gap: 4, flex: 1 },
  barreZone: { height: 34, justifyContent: 'flex-end' },
  barre: { width: 9, height: '100%', borderRadius: 5, backgroundColor: ui.dark },
  barreAuj: { borderWidth: 1, borderColor: alpha(colors.pink, 0.6) },
  jour: { fontSize: 11, lineHeight: 14, color: colors.textSecondary },
  jourAuj: { color: colors.text, ...fonts.semibold },
  source: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary, marginTop: 6 },
  ligne: { paddingVertical: 14, paddingHorizontal: 10, gap: 8 },
  ligneHaut: { flexDirection: 'row', alignItems: 'center' },
  ligneMoitie: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 0 },
  ligneTxt: { flexShrink: 1, fontSize: 14.5, lineHeight: 19 },
  separateur: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: colors.border, marginHorizontal: 8 },
  ligneBas: { fontSize: 13, lineHeight: 17, color: colors.textSecondary, textAlign: 'center' },
  coach: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  tete: { width: 58, height: 58, borderRadius: 29, overflow: 'hidden', backgroundColor: ui.iconBg },
  coachTitre: { fontSize: 17, lineHeight: 22 },
  coachTxt: { fontSize: 14, lineHeight: 19, color: colors.textSecondary, marginTop: 2 },
  teteSeance: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  h2: { flexShrink: 1, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  quand: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: colors.border },
  quandTxt: { fontSize: 14, lineHeight: 18 },
  seance: { padding: 0, overflow: 'hidden', minHeight: 196 },
  seanceImg: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '60%' },
  seanceTxt: { padding: 18, gap: 4, width: '66%' },
  seanceTitre: { fontSize: 32, lineHeight: 38, letterSpacing: -0.8 },
  seanceSous: { fontSize: 17, lineHeight: 22, color: colors.text },
  meta: { fontSize: 15, lineHeight: 20, color: colors.textSecondary },
  voir: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.pink,
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
  },
  voirTxt: { ...fonts.semibold, fontSize: 16, lineHeight: 20, color: colors.onPrimary },
  collection: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16 },
  collectionTitre: { fontSize: 17, lineHeight: 22 },
  sheetSous: { fontSize: 14, lineHeight: 19, color: colors.textSecondary, marginTop: -6, marginBottom: 6 },
  question: { fontSize: 15, lineHeight: 20, marginTop: 14, marginBottom: 8 },
  choix: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pastille: { borderRadius: 100, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 9 },
  pastilleOn: { backgroundColor: colors.pink, borderColor: colors.pink },
  pastilleTxt: { fontSize: 14, lineHeight: 18 },
  pastilleTxtOn: { color: colors.onPrimary },
  enregistrer: { marginTop: 22 },
});
