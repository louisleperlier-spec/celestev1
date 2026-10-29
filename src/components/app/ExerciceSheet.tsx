import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Glow, Icon, Text, type IconName } from '@/components/ui';
import { EXERCICE_IMAGES, GROUPES, MATERIEL } from '@/data';
import type { ExerciceId } from '@/data/types';
import { dec, loadFor, rj } from '@/lib/charges';
import { coachById, exercice, exKcal, lvlN, mkItem, type PlanItem } from '@/lib/plan';
import { selectProfil, useProfil } from '@/store/profil';
import { alpha, colors, fonts, ui } from '@/theme';

import { DemoSheet } from './DemoSheet';
import { Sheet } from './Sheet';
import { ZoneBar } from './ZoneBar';

/**
 * Fiche exercice (exoSheet du prototype), mise en page du design 10K « Fiche exercice » (process-routine-exercise) :
 * illustration en grand (3:4) avec pastilles et titre, « Le mouvement » en étapes numérotées dans une carte, muscles travaillés
 * cochés, erreur à éviter, plan du coach, et la démo guidée en bouton collé en bas. `it` : l'exercice tel qu'il est prévu dans la séance.
 */
export function ExerciceSheet({ id, it, onClose }: { id: ExerciceId | null; it?: PlanItem; onClose: () => void }) {
  const [demo, setDemo] = useState<ExerciceId | null>(null);
  return (
    <>
      <Sheet
        visible={!!id && !demo}
        onClose={onClose}
        maxHeight="92%"
        pied={
          id ? (
            <View style={styles.pied}>
              <Pressable accessibilityRole="button" onPress={() => setDemo(id)} style={({ pressed }) => [styles.cta, pressed && styles.presse]}>
                <Icon name="play" size={16} color={colors.bg} />
                <Text weight="bold" style={styles.ctaTxt}>
                  Voir la démo guidée
                </Text>
              </Pressable>
            </View>
          ) : null
        }
      >
        {id && <Contenu id={id} it={it} onClose={onClose} />}
      </Sheet>
      <DemoSheet id={demo} onClose={() => setDemo(null)} />
    </>
  );
}

/** Titre de section : icône orange + titre en gras. */
function Titre({ icon, children }: { icon: IconName; children: string }) {
  return (
    <View style={styles.titre}>
      <Icon name={icon} size={17} color={colors.pink} />
      <Text weight="bold" style={styles.titreTxt}>
        {children}
      </Text>
    </View>
  );
}

function Contenu({ id, it: it0, onClose }: { id: ExerciceId; it?: PlanItem; onClose: () => void }) {
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

  return (
    <View accessibilityLabel={e.nom}>
      {/* Héros : l'illustration en 3:4, fondu sombre en bas, pastilles et nom de l'exercice. */}
      <View style={styles.heros}>
        <Glow width={320} height={320} intensity={0.22} />
        <Image source={EXERCICE_IMAGES[id]} style={styles.herosImg} contentFit="contain" accessibilityLabel={e.nom} />
        <LinearGradient pointerEvents="none" colors={['transparent', alpha(colors.bgAlt, 0.35), alpha(colors.bgAlt, 0.85)]} locations={[0.45, 0.7, 1]} style={StyleSheet.absoluteFill} />
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onClose} style={styles.close}>
          <Icon name="x" size={16} />
        </Pressable>
        <View style={styles.herosBas}>
          <View style={styles.pastilles}>
            <Text weight="bold" style={[styles.pastille, styles.pastilleClaire]}>
              {GROUPES[e.groupe]}
            </Text>
            <View style={[styles.pastilleLigne, styles.pastilleSombre]}>
              <Icon name="clock" size={12} color={ui.text2} />
              <Text weight="bold" style={styles.pastilleTxt}>
                {it.sets} × {duree}
              </Text>
            </View>
          </View>
          <Text weight="bold" style={styles.nom}>
            {e.nom}
          </Text>
          <Text style={styles.sousNom}>
            {MATERIEL[e.materiel]} • {['Facile', 'Moyen', 'Avancé'][e.niveau - 1]}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Titre icon="pulse">Le mouvement</Titre>
        <View style={styles.carte}>
          {e.etapes.map((t, i) => (
            <View key={i}>
              <View style={styles.etape}>
                <View style={styles.etapeN}>
                  <Text weight="bold" style={styles.etapeNTxt}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={styles.etapeTxt}>{t}</Text>
              </View>
              {i < e.etapes.length - 1 && <View style={styles.sep} />}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Titre icon="biceps">Muscles travaillés</Titre>
        <View style={styles.liste}>
          {muscles.map((m) => (
            <View key={m} style={[styles.carte, styles.ligne]}>
              <View style={styles.coche}>
                <Icon name="check" size={12} color={colors.bg} />
              </View>
              <Text style={styles.ligneTxt}>{m.charAt(0).toUpperCase() + m.slice(1)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Titre icon="info">Erreur à éviter</Titre>
        <View style={[styles.carte, styles.erreur]}>
          <Text style={styles.erreurTxt}>{e.erreur}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Titre icon="coach">{`Pour toi avec ${c.nom}`}</Titre>
        <View style={styles.cplan}>
          {[
            ['Séries', String(it.sets)],
            [it.sec ? 'Durée' : 'Reps', duree],
            ['Repos', it.rest + ' s'],
          ].map(([k, v]) => (
            <View key={k} style={[styles.carte, styles.cplanCell]}>
              <Text style={styles.cplanSmall}>{k}</Text>
              <Text weight="bold" style={styles.cplanB}>
                {v}
              </Text>
            </View>
          ))}
        </View>
        {/* .loadcard : charge conseillée + zone de reps + calories */}
        <Card style={styles.load}>
          <View style={styles.lh}>
            <Text weight="extrabold" style={styles.lhB}>
              {ld.txt}
            </Text>
            <Text style={styles.lhSmall}>{ld.sub}</Text>
          </View>
          <ZoneBar it={it} />
          <Text style={styles.note}>
            Tempo {it.tempo || c.tempo} • ≈ {Math.max(1, Math.round(kcal / it.sets))} kcal par série •{' '}
            <Text weight="bold" style={[styles.note, { color: colors.pinkLight }]}>
              ≈ {kcal} kcal pour l&apos;exercice
            </Text>{' '}
            ({it.sets} séries, repos compris, à {dec(p.weight)} kg)
          </Text>
        </Card>
      </View>

      {/* Musculation libre : noter des séries de cet exercice (ex. tractions) sans passer par une séance guidée. */}
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          onClose();
          router.push({ pathname: '/ajouter', params: { exo: id } });
        }}
        style={[styles.carte, styles.noter]}
      >
        <Icon name="edit" size={18} />
        <Text weight="semibold" style={styles.noterTxt}>
          Noter mes séries
        </Text>
        <Icon name="right" size={16} color={colors.textSecondary} />
      </Pressable>
      <View style={{ height: 8 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  heros: {
    aspectRatio: 3 / 4,
    maxHeight: 400,
    alignSelf: 'stretch',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: alpha(colors.text, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  herosImg: { width: '86%', height: '66%', marginBottom: '30%' },
  close: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: alpha(colors.text, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  herosBas: { position: 'absolute', left: 18, right: 18, bottom: 18, gap: 8 },
  pastilles: { flexDirection: 'row', gap: 8 },
  pastille: { fontSize: 12, lineHeight: 16, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: 'hidden', color: ui.text2 },
  pastilleClaire: { backgroundColor: alpha(colors.text, 0.18) },
  pastilleLigne: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  pastilleSombre: { backgroundColor: alpha(colors.bgAlt, 0.5) },
  pastilleTxt: { fontSize: 12, lineHeight: 16, color: ui.text2, fontVariant: ['tabular-nums'] },
  nom: { fontSize: 26, lineHeight: 32, color: colors.text },
  sousNom: { fontSize: 14, lineHeight: 19, color: ui.text3 },
  section: { marginTop: 26, gap: 12 },
  titre: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titreTxt: { fontSize: 17, lineHeight: 22 },
  carte: { borderRadius: 18, backgroundColor: alpha(colors.text, 0.06), borderWidth: 0.5, borderColor: colors.border },
  etape: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  etapeN: { width: 26, height: 26, borderRadius: 13, backgroundColor: alpha(colors.pink, 0.14), alignItems: 'center', justifyContent: 'center' },
  etapeNTxt: { fontSize: 12, lineHeight: 16, color: colors.pink },
  etapeTxt: { flex: 1, fontSize: 15, lineHeight: 21, color: colors.text, paddingTop: 3 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border2, marginLeft: 56 },
  liste: { gap: 10 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  coche: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center' },
  ligneTxt: { flex: 1, fontSize: 15, lineHeight: 20 },
  erreur: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: ui.warnBg, borderColor: ui.warnBorder },
  erreurTxt: { fontSize: 15, lineHeight: 21, color: ui.warnText },
  cplan: { flexDirection: 'row', gap: 8 },
  cplanCell: { flex: 1, padding: 10, alignItems: 'center' },
  cplanSmall: { fontSize: 11, lineHeight: 14, color: colors.textSecondary },
  cplanB: { fontSize: 15, lineHeight: 20 },
  load: { paddingVertical: 12, paddingHorizontal: 14 },
  lh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  lhB: { fontSize: 17, lineHeight: 22, ...fonts.extrabold },
  lhSmall: { fontSize: 11.5, lineHeight: 15, color: colors.textSecondary },
  note: { fontSize: 11.5, lineHeight: 16, color: colors.textSecondary, paddingTop: 8 },
  noter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, paddingHorizontal: 16, paddingVertical: 15 },
  noterTxt: { flex: 1, fontSize: 15, lineHeight: 20 },
  // Bouton collé en bas, au-dessus d'un fondu (sessionCTA du design) : pilule claire, texte sombre.
  pied: { paddingTop: 12 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 54, borderRadius: 27, backgroundColor: colors.text },
  ctaTxt: { fontSize: 17, lineHeight: 22, color: colors.bg },
  presse: { transform: [{ scale: 0.98 }] },
});
