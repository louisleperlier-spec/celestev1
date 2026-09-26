import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ouvrirPlus } from '@/components/app/ouvrirPlus';
import { lancerSortie } from '@/components/app/lancerSortie';
import { DetailHead, detail, Hero, KStat, ParCoach, Tags } from '@/components/app/Detail';
import { ExerciceSheet } from '@/components/app/ExerciceSheet';
import { Kcal } from '@/components/app/Kcal';
import { PlanifierSheet } from '@/components/app/PlanifierSheet';
import { Row, RowText, rowStyles } from '@/components/app/Rows';
import { SectionHead } from '@/components/app/Section';
import { Sheet } from '@/components/app/Sheet';
import { Thumb } from '@/components/app/Thumb';
import { ob } from '@/components/onboarding/ObScaffold';
import { Button, Card, Icon, SelectableCard, Text, type IconName } from '@/components/ui';
import { EXERCICE_IMAGES, LIEUX } from '@/data';
import type { MaterielId, SeanceId } from '@/data/types';
import { dec, itemLine } from '@/lib/charges';
import { coachById, exercice, exKcal, LVLN, type PlanItem } from '@/lib/plan';
import { wkLocked } from '@/lib/premium';
import { catSession, seanceById, type Intensite } from '@/lib/semaine';
import { selectProfil, useProfil } from '@/store/profil';
import { colors, glow, ui } from '@/theme';

/** Icône et libellé du matériel (EQI du prototype). */
const EQI: Record<MaterielId, [IconName, string]> = {
  pdc: ['user', 'Poids du corps'],
  hal: ['dumb', 'Haltères'],
  bar: ['barre', 'Barre'],
  mac: ['machine', 'Machine'],
  pou: ['poulie', 'Poulie'],
  velo: ['bike', 'Vélo'],
};

const INTENSITES: readonly [Intensite, string, string][] = [
  [-1, 'Plus facile', '−1 série, repos +15 s'],
  [0, 'Normal', 'Comme prévu'],
  [1, 'Plus dur', '+1 série, repos −10 s'],
];

/** Détail d'une séance prête du catalogue (vWk du prototype). */
export default function SeanceCatalogue() {
  const { id } = useLocalSearchParams<{ id: SeanceId }>();
  const profil = useProfil();
  const p = selectProfil(profil);
  const insets = useSafeAreaInsets();
  const [exo, setExo] = useState<PlanItem | null>(null);
  const [planifier, setPlanifier] = useState(false);
  const [intensite, setIntensite] = useState(false);
  const [toutVoir, setToutVoir] = useState(false);

  const w = seanceById(id);
  const c = coachById(w.coach);
  const mod = profil.wkMod[w.id] ?? 0;
  const s = catSession(w, null, p.weight, mod);
  const eqs = [...new Set(s.items.map((i) => exercice(i.id).materiel))];
  const mus = [...new Set(s.items.flatMap((i) => exercice(i.id).muscles.split(', ')))].slice(0, 6);
  const lk = wkLocked(w.id);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <DetailHead titre={LIEUX[w.lieu]} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Hero source={EXERCICE_IMAGES[s.items[0].id]} color={c.c} exercice />
        <View style={detail.pad}>
          <ParCoach id={c.id} nom={c.nom} />
          <Text style={detail.h1}>{w.t}</Text>
          <Tags items={[LVLN[w.lvl - 1], LIEUX[w.lieu], w.goal]} rose={mod ? (mod > 0 ? 'Plus dur' : 'Plus facile') : undefined} />
          <KStat
            items={[
              ['dumb', w.ride ? 'Sortie vélo' : `${s.items.length} exercices`],
              ['flame', `≈ ${s.kcal} kcal`],
              ['clock', `${s.min} min`],
            ]}
          />
          <Text style={detail.sub} numberOfLines={toutVoir ? undefined : 2}>
            {w.desc}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => setToutVoir(!toutVoir)}>
            <Text style={styles.more}>{toutVoir ? 'Réduire' : 'Tout voir'}</Text>
          </Pressable>

          <Text style={ob.lbl}>Matériel</Text>
          <View style={styles.eqs}>
            {eqs.map((e) => (
              <View key={e} style={styles.eq}>
                <View style={styles.eqIcon}>
                  <Icon name={EQI[e][0]} size={24} color={colors.pinkLight} />
                </View>
                <Text style={styles.eqTxt}>{EQI[e][1]}</Text>
              </View>
            ))}
          </View>
          <Card style={styles.apercu}>
            <Text weight="bold" style={styles.apercuH4}>
              Aperçu
            </Text>
            <View style={styles.mus}>
              <View style={[styles.musDot, glow(colors.pink, 8)]} />
              <View style={styles.flex}>
                <Text weight="bold" style={styles.musB}>
                  Muscles principaux
                </Text>
                <Text style={styles.musP}>{mus.join(', ')}</Text>
              </View>
            </View>
          </Card>
        </View>

        <SectionHead title={w.ride ? 'Déroulé' : 'Les exercices'} note={`Charges pour ${dec(p.weight)} kg`} />
        <View style={rowStyles.list}>
          {s.items.map((it, i) => (
            <Row key={i} onPress={() => setExo(it)} accessibilityLabel={exercice(it.id).nom}>
              <Thumb id={it.id} />
              <RowText title={w.ride ? 'Vélo extérieur' : `${i + 1}. ${exercice(it.id).nom}`} sub={w.ride ? w.desc : itemLine(it, p)} />
              <Kcal kcal={w.ride ? s.kcal : exKcal(it, p.weight)} />
            </Row>
          ))}
        </View>
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* .floatf : pied flottant en dégradé */}
      <LinearGradient
        colors={['rgba(7,7,8,0)', colors.bg, colors.bg]}
        locations={[0, 0.35, 1]}
        style={[styles.floatf, { paddingBottom: 18 + insets.bottom }]}
        pointerEvents="box-none"
      >
        {lk ? (
          <Button label="Débloquer avec l'essai gratuit" icon="lock" onPress={() => ouvrirPlus()} />
        ) : (
          <View style={styles.two}>
            <Button label="Modifier" variant="dark" small icon="sliders" onPress={() => setIntensite(true)} style={styles.flex} />
            <Button label="Planifier" variant="dark" small icon="cal" onPress={() => setPlanifier(true)} style={styles.flex} />
            <Button
              label="Commencer"
              small
              onPress={() => (w.ride ? lancerSortie(w.ride, w.id) : router.push({ pathname: '/seance-en-cours', params: { cat: w.id } }))}
              style={styles.flex}
            />
          </View>
        )}
      </LinearGradient>

      <ExerciceSheet id={exo?.id ?? null} it={exo ?? undefined} onClose={() => setExo(null)} />
      <PlanifierSheet id={planifier ? w.id : null} onClose={() => setPlanifier(false)} />
      {/* wkModSheet */}
      <Sheet visible={intensite} onClose={() => setIntensite(false)} title="Intensité de la séance">
        <Text style={styles.sheetSub}>Les exercices restent les mêmes, seules les séries et les repos changent.</Text>
        <View style={styles.grid3}>
          {INTENSITES.map(([v, l, d]) => (
            <SelectableCard
              key={v}
              selected={mod === v}
              onPress={() => {
                profil.setIntensite(w.id, v);
                setIntensite(false);
              }}
              style={styles.opt}
              accessibilityLabel={`${l}, ${d}`}
            >
              <Text weight="bold" style={styles.optB}>
                {l}
              </Text>
              <Text style={styles.optSmall}>{d}</Text>
            </SelectableCard>
          ))}
        </View>
        <View style={{ height: 6 }} />
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  more: { color: colors.pinkLight, fontSize: 13.5, lineHeight: 18, marginTop: 4 },
  eqs: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  eq: { width: 66, alignItems: 'center', gap: 6 },
  eqIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: ui.chipBg,
    borderWidth: 1,
    borderColor: colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eqTxt: { fontSize: 11.5, lineHeight: 15, color: ui.text3, textAlign: 'center' },
  apercu: { marginTop: 18, paddingVertical: 14, paddingHorizontal: 16 },
  apercuH4: { fontSize: 14, lineHeight: 18, color: colors.textSecondary, marginBottom: 10 },
  mus: { flexDirection: 'row', gap: 10 },
  musDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.pink, marginTop: 4 },
  musB: { fontSize: 14, lineHeight: 18 },
  musP: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, marginTop: 3 },
  floatf: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 28, paddingHorizontal: 20 },
  two: { flexDirection: 'row', gap: 10 },
  sheetSub: { color: colors.textSecondary, fontSize: 14, lineHeight: 19.6, marginBottom: 14 },
  grid3: { flexDirection: 'row', gap: 10 },
  opt: { flex: 1, height: 88, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 4 },
  optB: { fontSize: 13.5, lineHeight: 17 },
  optSmall: { fontSize: 10.5, lineHeight: 13, color: colors.textSecondary, textAlign: 'center' },
});
