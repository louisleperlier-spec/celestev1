import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text } from '@/components/ui';
import { EXERCICE_IMAGES, GROUPES, MATERIEL } from '@/data';
import type { ExerciceId } from '@/data/types';
import { dec, loadFor, rj } from '@/lib/charges';
import { coachById, exercice, exKcal, lvlN, mkItem, type PlanItem } from '@/lib/plan';
import { taille, useLecture } from '@/store/lecture';
import { selectProfil, useProfil } from '@/store/profil';
import { alpha, colors, ui } from '@/theme';

import { DemoSheet } from './DemoSheet';
import { ZoneBar } from './ZoneBar';
import { ZoomExercice } from './ZoomExercice';

/**
 * Fiche exercice en plein écran, en pages comme une story (maquette de l'utilisateur, nov. 2026, style « De quoi ton corps est fait ») :
 * illustration en haut qui se fond dans le noir (toucher = zoom `ZoomExercice`), traits de progression, petit titre orange en capitales,
 * titre, sous-titre gris, lignes en cartes (titre + pastille + précision, valeur orange à droite), retour rond + « Suivant » en bas.
 * Pages : Pour toi (plan du coach, charge), Le mouvement (3 étapes), À savoir (muscles, erreur à éviter) ; la dernière mène à la démo guidée.
 * « Aa » = grands caractères (`useLecture`). `it` : l'exercice tel qu'il est prévu dans la séance.
 */
export function ExerciceSheet({ id, it, onClose }: { id: ExerciceId | null; it?: PlanItem; onClose: () => void }) {
  const [demo, setDemo] = useState<ExerciceId | null>(null);
  const [zoom, setZoom] = useState(false);
  return (
    <>
      <Modal visible={!!id && !demo && !zoom} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose} statusBarTranslucent>
        {id && <Contenu key={id} id={id} it={it} onClose={onClose} onZoom={() => setZoom(true)} onDemo={() => setDemo(id)} />}
      </Modal>
      <DemoSheet id={demo} onClose={() => setDemo(null)} />
      <ZoomExercice id={zoom ? id : null} ligne={it ? `${it.sets} séries • ${it.sec ? it.sec + ' s' : rj(it.reps!) + ' reps'}` : undefined} onClose={() => setZoom(false)} />
    </>
  );
}

type Ligne = { titre: string; pastille?: string; alerte?: boolean; texte?: string; valeur?: string };
type Page = { label: string; titre: string; sous: string; lignes: Ligne[]; bas?: ReactNode };

function Contenu({ id, it: it0, onClose, onZoom, onDemo }: { id: ExerciceId; it?: PlanItem; onClose: () => void; onZoom: () => void; onDemo: () => void }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { grand, basculer } = useLecture();
  const profil = useProfil();
  const p = selectProfil(profil);
  const e = exercice(id);
  const c = coachById(p.coach);
  const it = it0 ?? mkItem(id, c, lvlN(p.level) - 1);
  const ld = loadFor(it, p);
  const kcal = exKcal(it, p.weight);
  const duree = it.sec ? (it.sec >= 120 ? Math.round(it.sec / 60) + ' min' : it.sec + ' s') : rj(it.reps!);
  const muscles = e.muscles
    .split(/,| et /)
    .map((m) => m.trim())
    .filter(Boolean);
  const [page, setPage] = useState(0);

  const pages: Page[] = [
    {
      label: 'Pour toi',
      titre: e.nom,
      sous: `${GROUPES[e.groupe]} • ${MATERIEL[e.materiel]} • ${['Facile', 'Moyen', 'Avancé'][e.niveau - 1]}. Ton plan avec ${c.nom}.`,
      lignes: [
        { titre: 'Séries', pastille: 'Ton plan', texte: 'Le nombre de fois où tu enchaînes l’exercice.', valeur: String(it.sets) },
        { titre: it.sec ? 'Durée' : 'Répétitions', texte: it.sec ? 'Le temps à tenir à chaque série.' : 'Les mouvements à faire à chaque série.', valeur: duree },
        { titre: 'Repos', texte: 'La pause entre deux séries.', valeur: it.rest + ' s' },
        { titre: 'Charge conseillée', pastille: `Tempo ${it.tempo || c.tempo}`, texte: ld.sub, valeur: ld.txt },
      ],
      bas: (
        <View style={styles.zone}>
          <ZoneBar it={it} />
          <Text style={[styles.note, taille(grand, 12, 17)]}>
            ≈ {kcal} kcal pour l&apos;exercice ({it.sets} séries, repos compris, à {dec(p.weight)} kg).
          </Text>
        </View>
      ),
    },
    {
      label: 'Le mouvement',
      titre: 'Comment le faire',
      sous: 'Trois étapes, dans l’ordre. Touche l’image pour la voir en grand.',
      lignes: e.etapes.map((t, i) => ({ titre: `Étape ${i + 1}`, texte: t, valeur: String(i + 1) })),
    },
    {
      label: 'À savoir',
      titre: 'Ce que ça travaille',
      sous: 'Les muscles sollicités, et l’erreur la plus courante.',
      lignes: [
        ...muscles.map((m) => ({ titre: m.charAt(0).toUpperCase() + m.slice(1), pastille: 'Travaillé' })),
        { titre: 'Erreur à éviter', pastille: 'Attention', alerte: true, texte: e.erreur },
      ],
      bas: (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            onClose();
            router.push({ pathname: '/ajouter', params: { exo: id } });
          }}
          style={({ pressed }) => [styles.ligne, styles.noter, pressed && styles.presse]}
        >
          <Icon name="edit" size={18} />
          <Text weight="semibold" style={[styles.flex, taille(grand, 15, 20)]}>
            Noter mes séries
          </Text>
          <Icon name="right" size={16} color={colors.textSecondary} />
        </Pressable>
      ),
    },
  ];
  const pg = pages[page];
  const derniere = page === pages.length - 1;

  return (
    <View style={styles.root}>
      {/* Illustration en haut, fondue dans le noir ; toucher = image agrandie. */}
      <View style={[styles.heros, { height: Math.min(380, height * 0.4) + insets.top }]}>
        <Pressable accessibilityRole="imagebutton" accessibilityLabel={`${e.nom}, agrandir l'image`} onPress={onZoom} style={[styles.herosTouche, { paddingTop: insets.top + 30 }]}>
          <Image source={EXERCICE_IMAGES[id]} style={styles.herosImg} contentFit="contain" />
        </Pressable>
        <LinearGradient pointerEvents="none" colors={['transparent', alpha(colors.bg, 0.6), colors.bg]} locations={[0.55, 0.82, 1]} style={StyleSheet.absoluteFill} />
        <View style={[styles.boutonsHaut, { top: insets.top + 8 }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onClose} style={styles.rond}>
            <Icon name="x" size={18} />
          </Pressable>
          <View style={styles.flex} />
          <Pressable accessibilityRole="button" accessibilityLabel="Agrandir l'image" onPress={onZoom} style={styles.rond}>
            <Icon name="zoom" size={19} />
          </Pressable>
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="Grands caractères"
            accessibilityState={{ checked: grand }}
            onPress={basculer}
            style={[styles.rond, grand && styles.rondOn]}
          >
            <Text weight="bold" style={[styles.aa, grand && { color: colors.bg }]}>
              Aa
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Traits de progression : un par page, touchables. */}
      <View style={styles.traits}>
        {pages.map((x, i) => (
          <Pressable
            key={x.label}
            accessibilityRole="button"
            accessibilityLabel={`Page ${i + 1} sur ${pages.length} : ${x.label}`}
            accessibilityState={{ selected: i === page }}
            onPress={() => setPage(i)}
            hitSlop={{ top: 12, bottom: 12 }}
            style={styles.traitTouche}
          >
            <View style={[styles.trait, i <= page && styles.traitOn]} />
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.corps} showsVerticalScrollIndicator={false}>
        <Animated.View key={page} entering={FadeIn.duration(220)}>
          <Text weight="bold" style={[styles.label, taille(grand, 12, 16)]}>
            {pg.label.toUpperCase()}
          </Text>
          <Text weight="bold" style={[styles.titre, taille(grand, 24, 30)]} accessibilityRole="header">
            {pg.titre}
          </Text>
          <Text style={[styles.sous, taille(grand, 14, 19)]}>{pg.sous}</Text>
          <View style={styles.lignes}>
            {pg.lignes.map((l) => (
              <View key={l.titre} style={[styles.ligne, l.alerte && styles.ligneAlerte]}>
                <View style={styles.flex}>
                  <View style={styles.ligneHaut}>
                    <Text weight="bold" style={[styles.ligneTitre, taille(grand, 15, 20)]}>
                      {l.titre}
                    </Text>
                    {l.pastille ? (
                      <Text weight="bold" style={[styles.pastille, l.alerte && styles.pastilleAlerte, taille(grand, 11, 14)]}>
                        {l.pastille}
                      </Text>
                    ) : null}
                  </View>
                  {l.valeur && l.valeur.length > 8 ? (
                    <Text weight="bold" style={[styles.valeur, styles.valeurDessous, taille(grand, 19, 24)]}>
                      {l.valeur}
                    </Text>
                  ) : null}
                  {l.texte ? <Text style={[styles.ligneTexte, l.alerte && { color: ui.warnText }, taille(grand, 13, 18)]}>{l.texte}</Text> : null}
                </View>
                {l.valeur && l.valeur.length <= 8 ? (
                  <Text weight="bold" style={[styles.valeur, taille(grand, 19, 24)]}>
                    {l.valeur}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
          {pg.bas}
        </Animated.View>
      </ScrollView>

      {/* Retour rond + Suivant (la dernière page mène à la démo guidée). */}
      <View style={[styles.pied, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Page précédente"
          accessibilityState={{ disabled: page === 0 }}
          disabled={page === 0}
          onPress={() => setPage(page - 1)}
          style={({ pressed }) => [styles.retour, page === 0 && styles.off, pressed && styles.presse]}
        >
          <Icon name="left" size={20} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => (derniere ? onDemo() : setPage(page + 1))}
          style={({ pressed }) => [styles.suivant, derniere && styles.suivantDemo, pressed && styles.presse]}
        >
          {derniere ? <Icon name="play" size={16} color={colors.bg} /> : null}
          <Text weight="semibold" style={[styles.suivantTxt, derniere && { color: colors.bg }, taille(grand, 16, 21)]}>
            {derniere ? 'Voir la démo guidée' : 'Suivant'}
          </Text>
          {derniere ? null : <Icon name="right" size={16} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  heros: { alignSelf: 'stretch', overflow: 'hidden' },
  herosTouche: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  herosImg: { width: '92%', height: '100%' },
  boutonsHaut: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', gap: 10 },
  rond: { width: 44, height: 44, borderRadius: 22, backgroundColor: alpha(colors.text, 0.12), alignItems: 'center', justifyContent: 'center' },
  rondOn: { backgroundColor: colors.pink },
  aa: { fontSize: 15, lineHeight: 19, color: colors.text },
  traits: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingTop: 4 },
  traitTouche: { flex: 1, paddingVertical: 4 },
  trait: { height: 3, borderRadius: 2, backgroundColor: alpha(colors.text, 0.18) },
  traitOn: { backgroundColor: colors.text },
  corps: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16 },
  label: { fontSize: 12, lineHeight: 16, letterSpacing: 1.4, color: colors.pink },
  titre: { fontSize: 24, lineHeight: 30, color: colors.text, marginTop: 6 },
  sous: { fontSize: 14, lineHeight: 19, color: colors.textSecondary, marginTop: 6 },
  lignes: { gap: 10, marginTop: 18 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, backgroundColor: colors.surface },
  ligneAlerte: { backgroundColor: ui.warnBg, borderWidth: 0.5, borderColor: ui.warnBorder },
  ligneHaut: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  ligneTitre: { fontSize: 15, lineHeight: 20, color: colors.text },
  pastille: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.pinkLight,
    backgroundColor: alpha(colors.pink, 0.16),
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  pastilleAlerte: { color: ui.warnText, backgroundColor: ui.warnBorder },
  ligneTexte: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, marginTop: 4 },
  valeur: { fontSize: 19, lineHeight: 24, color: colors.pinkLight, fontVariant: ['tabular-nums'], maxWidth: '45%', textAlign: 'right' },
  valeurDessous: { maxWidth: '100%', textAlign: 'left', marginTop: 4 },
  zone: { marginTop: 14, padding: 14, borderRadius: 16, backgroundColor: colors.surface },
  note: { fontSize: 12, lineHeight: 17, color: colors.textSecondary, marginTop: 8 },
  noter: { marginTop: 14 },
  pied: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 10 },
  retour: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  suivant: { flex: 1, height: 52, borderRadius: 26, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  suivantDemo: { backgroundColor: colors.text },
  suivantTxt: { fontSize: 16, lineHeight: 21, color: colors.text },
  off: { opacity: 0.35 },
  presse: { transform: [{ scale: 0.97 }] },
});
