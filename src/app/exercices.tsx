import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MascotteVide } from '@/components/app/Mascotte';
import { catalogueStyles as cs, Chip, EnTetePage, ExerciceLigne, FILTRES_GROUPES, filtrerGroupe, normaliser, Recherche, sousTitreExo, type FiltreGroupe } from '@/components/app/Catalogue';
import { ExerciceSheet } from '@/components/app/ExerciceSheet';
import { rowStyles } from '@/components/app/Rows';
import { EXERCICES, GROUPES, MATERIEL } from '@/data';
import type { ExerciceId } from '@/data/types';
import { colors } from '@/theme';

/** Bibliothèque des 50 exercices : recherche, groupe musculaire, fiche avec démo guidée. */
export default function Exercices() {
  const [f, setF] = useState<FiltreGroupe>('Tous');
  const [q, setQ] = useState('');
  const [exo, setExo] = useState<ExerciceId | null>(null);

  const k = normaliser(q.trim());
  const liste = EXERCICES.filter((e) => filtrerGroupe(f, e.groupe) && (!k || normaliser(e.nom + ' ' + e.muscles + ' ' + GROUPES[e.groupe]).includes(k)));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <EnTetePage titre="Exercices" sous={`${EXERCICES.length} exercices, avec démo guidée`} />
      <Recherche value={q} onChange={setQ} placeholder="Rechercher un exercice ou un muscle" />
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[cs.filters, styles.filtres]}>
          {FILTRES_GROUPES.map(([key, l]) => (
            <Chip key={key} label={l} on={f === key} onPress={() => setF(key)} />
          ))}
        </ScrollView>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <View style={rowStyles.list}>
          {liste.map((e) => (
            <ExerciceLigne key={e.id} e={e} sous={sousTitreExo(e, MATERIEL[e.materiel])} onPress={() => setExo(e.id)} />
          ))}
          {!liste.length && <MascotteVide texte="Aucun exercice trouvé. Essaie un autre mot !" expression="fatigue" />}
        </View>
      </ScrollView>
      <ExerciceSheet id={exo} onClose={() => setExo(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  filtres: { paddingTop: 12 },
  scroll: { paddingBottom: 30 },
});
