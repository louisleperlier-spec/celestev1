import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MascotteVide } from '@/components/app/Mascotte';
import { catalogueStyles as cs, Chip, EnTetePage, lieuDuProfil, normaliser, OngletsLieux, Recherche, SeanceLigne } from '@/components/app/Catalogue';
import { PlanifierSheet } from '@/components/app/PlanifierSheet';
import { Card } from '@/components/ui';
import { GOALF, LIEUX, SEANCES } from '@/data';
import type { GoalFiltre, LieuId, SeanceId } from '@/data/types';
import { useProfil } from '@/store/profil';
import { colors } from '@/theme';

/** Toutes les séances prêtes (« Tout voir » de l'onglet Programme) : recherche, lieu, objectif. */
export default function Seances() {
  const params = useLocalSearchParams<{ lieu?: LieuId }>();
  const gear = useProfil((s) => s.gear);
  const [lieu, setLieu] = useState<LieuId>(params.lieu && params.lieu in LIEUX ? params.lieu : lieuDuProfil(gear));
  const [goalf, setGoalf] = useState<GoalFiltre>('Tous');
  const [q, setQ] = useState('');
  const [aPlanifier, setAPlanifier] = useState<SeanceId | null>(null);

  const k = normaliser(q.trim());
  const liste = k
    ? SEANCES.filter((w) => normaliser(w.t + ' ' + w.goal + ' ' + LIEUX[w.lieu] + ' ' + w.desc).includes(k))
    : SEANCES.filter((w) => w.lieu === lieu && (goalf === 'Tous' || w.goal === goalf));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <EnTetePage titre="Séances prêtes" sous={`${SEANCES.length} séances guidées, lance et suis`} />
      <Recherche value={q} onChange={setQ} placeholder="Rechercher une séance" />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <Card style={styles.carte}>
          {!k && (
            <>
              <OngletsLieux lieu={lieu} onChange={setLieu} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={cs.gchips}>
                {GOALF.map((g) => (
                  <Chip key={g} label={g} on={goalf === g} onPress={() => setGoalf(g)} petit />
                ))}
              </ScrollView>
            </>
          )}
          {liste.length ? (
            liste.map((w, i) => (
              <View key={w.id} style={i < liste.length - 1 && cs.wsep}>
                <SeanceLigne w={w} onPlanifier={setAPlanifier} />
              </View>
            ))
          ) : (
            <MascotteVide texte={k ? 'Aucune séance trouvée.' : 'Aucune séance pour cet objectif ici : essaie un autre lieu.'} />
          )}
        </Card>
      </ScrollView>
      <PlanifierSheet id={aPlanifier} onClose={() => setAPlanifier(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingTop: 12, paddingBottom: 30 },
  carte: { marginHorizontal: 20, paddingTop: 6, paddingHorizontal: 12, paddingBottom: 8 },
});
