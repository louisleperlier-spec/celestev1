import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { Warn } from '@/components/onboarding/Choices';
import { Button, Card, Icon, Text } from '@/components/ui';
import { EXERCICE_IMAGES, GROUPES, MATERIEL } from '@/data';
import type { ExerciceId } from '@/data/types';
import { dec, loadFor, rj } from '@/lib/charges';
import { coachById, exercice, exKcal, lvlN, mkItem, type PlanItem } from '@/lib/plan';
import { selectProfil, useProfil } from '@/store/profil';
import { colors, fonts, ui } from '@/theme';

import { bientot } from './bientot';
import { Sheet } from './Sheet';
import { ZoneBar } from './ZoneBar';

/** Fiche exercice (exoSheet du prototype). `it` : l'exercice tel qu'il est prévu dans la séance. */
export function ExerciceSheet({ id, it, onClose }: { id: ExerciceId | null; it?: PlanItem; onClose: () => void }) {
  return (
    <Sheet visible={!!id} onClose={onClose}>
      {id && <Contenu id={id} it={it} onClose={onClose} />}
    </Sheet>
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

  return (
    <View accessibilityLabel={e.nom}>
      <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onClose} style={styles.close}>
        <Icon name="x" size={18} />
      </Pressable>
      {/* .big : illustration sur halo rose */}
      <View style={styles.big}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <RadialGradient id="exhalo" cx="50%" cy="55%" rx="50%" ry="50%">
              <Stop offset="0" stopColor={colors.pink} stopOpacity={0.16} />
              <Stop offset="0.7" stopColor={colors.pink} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx="50%" cy="55%" rx="60%" ry="60%" fill="url(#exhalo)" />
        </Svg>
        <Image source={EXERCICE_IMAGES[id]} style={styles.bigImg} contentFit="contain" accessibilityLabel={e.nom} />
      </View>
      <Text weight="extrabold" style={styles.h2}>
        {e.nom}
      </Text>
      <View style={styles.tags}>
        {[GROUPES[e.groupe], MATERIEL[e.materiel], ['Facile', 'Moyen', 'Avancé'][e.niveau - 1]].map((t) => (
          <Text key={t} style={styles.tag}>
            {t}
          </Text>
        ))}
      </View>
      <Text style={styles.sub}>{e.muscles}</Text>
      <Button label="Voir la démo guidée" variant="dark" icon="play" onPress={() => bientot('demo')} style={styles.demo} />

      <Text weight="bold" style={styles.h4}>
        Comment faire le mouvement
      </Text>
      {e.etapes.map((t, i) => (
        <View key={i} style={styles.step}>
          <View style={styles.stepN}>
            <Text weight="bold" style={styles.stepNTxt}>
              {i + 1}
            </Text>
          </View>
          <Text style={styles.stepTxt}>{t}</Text>
        </View>
      ))}
      <Warn>
        <Text style={styles.warnTxt}>
          <Text weight="bold" style={styles.warnTxt}>
            Erreur à éviter :
          </Text>{' '}
          {e.erreur}
        </Text>
      </Warn>

      <Text weight="bold" style={styles.h4}>
        Pour toi avec {c.nom}
      </Text>
      <View style={styles.cplan}>
        {[
          ['Séries', String(it.sets)],
          [it.sec ? 'Durée' : 'Reps', it.sec ? (it.sec >= 120 ? Math.round(it.sec / 60) + ' min' : it.sec + ' s') : rj(it.reps!)],
          ['Repos', it.rest + ' s'],
        ].map(([k, v]) => (
          <View key={k} style={styles.cplanCell}>
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
      <View style={{ height: 8 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  close: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#222228',
    alignItems: 'center',
    justifyContent: 'center',
  },
  big: { alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  bigImg: { width: '100%', height: 230 },
  h2: { fontSize: 20, lineHeight: 25, marginTop: 6 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: {
    fontSize: 11.5,
    lineHeight: 15,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: ui.iconBg,
    color: ui.text3,
  },
  sub: { color: colors.textSecondary, fontSize: 14, lineHeight: 19.6, marginTop: 6 },
  demo: { marginTop: 14 },
  h4: { fontSize: 14, lineHeight: 18, marginTop: 18, marginBottom: 8 },
  step: { flexDirection: 'row', gap: 10, marginBottom: 9 },
  stepN: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,79,163,0.18)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNTxt: { fontSize: 12, lineHeight: 15, color: colors.pinkLight },
  stepTxt: { flex: 1, fontSize: 14, lineHeight: 20.3, color: ui.text4 },
  warnTxt: { fontSize: 13.5, lineHeight: 19, color: ui.warnText },
  cplan: { flexDirection: 'row', gap: 8 },
  cplanCell: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: ui.dark, alignItems: 'center' },
  cplanSmall: { fontSize: 10.5, lineHeight: 14, color: colors.textSecondary },
  cplanB: { fontSize: 14, lineHeight: 18 },
  load: { marginTop: 10, paddingVertical: 12, paddingHorizontal: 14 },
  lh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  lhB: { fontSize: 17, lineHeight: 22, fontFamily: fonts.extrabold },
  lhSmall: { fontSize: 11.5, lineHeight: 15, color: colors.textSecondary },
  note: { fontSize: 11.5, lineHeight: 16, color: colors.textSecondary, paddingTop: 8 },
});
