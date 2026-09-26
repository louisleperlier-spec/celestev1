import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { lancerSortie } from '@/components/app/lancerSortie';
import { CoachFace } from '@/components/app/CoachFace';
import { DetailHead } from '@/components/app/Detail';
import { ExerciceSheet } from '@/components/app/ExerciceSheet';
import { Kcal } from '@/components/app/Kcal';
import { Row, RowText, rowStyles } from '@/components/app/Rows';
import { Thumb } from '@/components/app/Thumb';
import { Button, Card, Text, toast } from '@/components/ui';
import { dec, itemLine } from '@/lib/charges';
import { coachById, exercice, exKcal, type PlanItem } from '@/lib/plan';
import { JOURS, sessionForDay, weekDates, type SeanceJour } from '@/lib/semaine';
import { selectProfil, useProfil, useSemaine } from '@/store/profil';
import { colors, fonts } from '@/theme';

/** Détail d'une séance de la semaine (vSession du prototype). */
export default function SeanceDuJour() {
  const { jour } = useLocalSearchParams<{ jour: string }>();
  const profil = useProfil();
  const p = selectProfil(profil);
  const sem = useSemaine();
  const c = coachById(p.coach);
  const [exo, setExo] = useState<PlanItem | null>(null);
  const s: SeanceJour = sessionForDay(sem, Number(jour)) ?? sem.plan.sessions[0];
  const day = s.day ?? 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <DetailHead titre={`${JOURS[day]} ${weekDates()[day].getDate()}`} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.pad}>
          <Text style={styles.h1}>{s.titre.toUpperCase()}</Text>
          <Text style={styles.sub}>
            {s.min} min • {s.items.length} exercices • ≈ {s.kcal} kcal
          </Text>
        </View>
        <Card style={styles.phead}>
          <CoachFace id={c.id} size={52} borderColor={c.c} />
          <View style={styles.flex}>
            <Text weight="bold" style={styles.pheadH3}>
              Le mot de {c.nom}
            </Text>
            <Text style={styles.pheadP}>
              « {c.daily} » Charges calculées pour {dec(p.weight)} kg.
            </Text>
          </View>
        </Card>
        <View style={[rowStyles.list, styles.mt12]}>
          {s.items.map((it, i) => (
            <Row key={i} onPress={() => setExo(it)} accessibilityLabel={exercice(it.id).nom}>
              <Thumb id={it.id} />
              <RowText title={`${i + 1}. ${exercice(it.id).nom}`} sub={itemLine(it, p)} />
              <Kcal kcal={exKcal(it, p.weight)} />
            </Row>
          ))}
        </View>
        {s.cat && (
          <View style={[styles.pad, styles.mt6]}>
            <Button
              label="Retirer du calendrier"
              variant="dark"
              onPress={() => {
                profil.retirer(day);
                toast('Séance retirée');
                router.navigate({ pathname: '/programme', params: { vue: 'calendrier' } });
              }}
            />
          </View>
        )}
      </ScrollView>
      <View style={styles.foot}>
        <Button
          label="Lancer la séance"
          iconAfter="play"
          // Une sortie vélo se lance depuis l'onglet Vélo (étape 7).
          onPress={() => (s.ride ? lancerSortie(s.min, s.cat) : router.push({ pathname: '/seance-en-cours', params: { jour: String(day) } }))}
        />
      </View>
      <ExerciceSheet id={exo?.id ?? null} it={exo ?? undefined} onClose={() => setExo(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  pad: { paddingHorizontal: 20 },
  mt12: { marginTop: 12 },
  mt6: { marginTop: 6 },
  h1: { fontFamily: fonts.black, fontSize: 27, lineHeight: 30, letterSpacing: -0.27 },
  sub: { color: colors.textSecondary, fontSize: 14, lineHeight: 19.6, marginTop: 6 },
  phead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, marginTop: 12, marginHorizontal: 20 },
  pheadH3: { fontSize: 15, lineHeight: 19 },
  pheadP: { fontSize: 12.5, lineHeight: 17.5, color: colors.textSecondary, marginTop: 3 },
  foot: { paddingTop: 12, paddingHorizontal: 20, paddingBottom: 18 },
});
