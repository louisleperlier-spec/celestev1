import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CarteJeu } from '@/components/app/CarteJeu';
import { EnTetePage } from '@/components/app/Catalogue';
import { Sheet } from '@/components/app/Sheet';
import { Button, Card, Segmente, Text } from '@/components/ui';
import { CARTES, carte, possedees, RARETES, XP_DOUBLE, type CarteId } from '@/lib/jeu';
import { useProfil } from '@/store/profil';
import { colors, fonts, ui } from '@/theme';

type Filtre = 'tout' | '0' | '1' | '2' | '3';

/** Ma collection : les 54 cartes (exercices et coachs), trouvées ou à trouver, et les cartes à ouvrir. */
export default function Collection() {
  const { width } = useWindowDimensions();
  const jeu = useProfil((s) => s.jeu);
  const [filtre, setFiltre] = useState<Filtre>('tout');
  const [choisie, setChoisie] = useState<CarteId | null>(null);
  const total = CARTES.length;
  const n = possedees(jeu);
  const largeur = Math.floor((width - 40 - 2 * 10) / 3);
  const liste = CARTES.filter((c) => filtre === 'tout' || String(c.rarete) === filtre);
  const c = choisie ? carte(choisie) : null;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <EnTetePage titre="Ma collection" sous={`${n} / ${total} cartes trouvées`} retour="/progres" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.barre}>
          <View style={[styles.rempli, { width: `${(n / total) * 100}%` }]} />
        </View>
        {jeu.paquets.length > 0 && (
          <Card style={styles.aOuvrir}>
            <View style={styles.flex}>
              <Text weight="semibold" style={styles.h3}>
                🎁 {jeu.paquets.length === 1 ? '1 paquet à ouvrir' : `${jeu.paquets.length} paquets à ouvrir`}
              </Text>
              <Text style={styles.p}>{jeu.paquets.reduce((a, p) => a + p.cartes.length, 0)} cartes t’attendent</Text>
            </View>
            <Button label="Ouvrir" small onPress={() => router.push('/cartes/ouvrir')} />
          </Card>
        )}
        <Segmente
          options={[
            ['tout', 'Toutes'],
            ['0', 'Com.'],
            ['1', 'Rares'],
            ['2', 'Épiques'],
            ['3', 'Légend.'],
          ]}
          value={filtre}
          onChange={setFiltre}
          style={styles.seg}
        />
        <View style={styles.grille}>
          {liste.map((x) => {
            const nb = jeu.cartes[x.id] ?? 0;
            return (
              <Pressable key={x.id} onPress={() => nb > 0 && setChoisie(x.id)} accessibilityLabel={nb > 0 ? x.nom : 'Carte à trouver'}>
                <CarteJeu id={x.id} largeur={largeur} cachee={nb === 0} nombre={nb} />
              </Pressable>
            );
          })}
        </View>
        <Card style={styles.regles}>
          <Text weight="semibold" style={styles.h3}>
            Comment gagner des cartes
          </Text>
          {[
            '1 carte à chaque séance, sortie vélo ou course terminée.',
            '1 carte Rare ou mieux à chaque record battu.',
            'Un booster de 3 cartes à chaque niveau et à chaque défi de la semaine.',
            `Les doubles se recyclent en XP (${XP_DOUBLE.map((x, k) => `${RARETES[k]} +${x}`).join(', ')}).`,
            'Une Légendaire nouvelle te donne un Turbo x2.',
          ].map((t) => (
            <Text key={t} style={styles.p}>
              • {t}
            </Text>
          ))}
        </Card>
      </ScrollView>
      <Sheet visible={!!c} onClose={() => setChoisie(null)} title={c?.nom ?? ''}>
        {c && (
          <View style={styles.detail}>
            <CarteJeu id={c.id} largeur={200} nombre={jeu.cartes[c.id] ?? 0} />
            <Text weight="semibold" style={[styles.rarete, { color: ui.rarete[c.rarete] }]}>
              {RARETES[c.rarete]} · {c.sous}
            </Text>
            <Text style={styles.p}>
              {(jeu.cartes[c.id] ?? 0) > 1 ? `${jeu.cartes[c.id]} exemplaires. ` : ''}Un double rapporte {XP_DOUBLE[c.rarete]} XP.
            </Text>
          </View>
        )}
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  barre: { height: 8, borderRadius: 4, backgroundColor: colors.surface, marginTop: 12, overflow: 'hidden' },
  rempli: { height: 8, borderRadius: 4, backgroundColor: colors.pink },
  aOuvrir: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginTop: 14, backgroundColor: ui.selFond },
  h3: { fontSize: 16, lineHeight: 21 },
  p: { fontSize: 13.5, lineHeight: 19, color: colors.textSecondary, marginTop: 4 },
  seg: { marginTop: 16 },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  regles: { padding: 16, marginTop: 20 },
  detail: { alignItems: 'center', gap: 8, paddingBottom: 16 },
  rarete: { fontSize: 15, lineHeight: 20, marginTop: 6, ...fonts.semibold },
});
