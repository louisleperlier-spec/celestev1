import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { MascotteVide } from '@/components/app/Mascotte';
import { EnTetePage } from '@/components/app/Catalogue';
import { IconeNote } from '@/components/app/IconeNote';
import { Button, Card, Text } from '@/components/ui';
import { TAGS_SOIR } from '@/lib/reveil';
import { baseHrv, sleepScore } from '@/lib/sommeil';
import { useProfil } from '@/store/profil';
import { colors, ui } from '@/theme';

const jourLong = (iso: string) => new Date(iso).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' });

/** Journal du sommeil : les notes du soir, avec le score de la nuit qui a suivi (pour voir ce qui aide à bien dormir). */
export default function JournalSommeil() {
  const p = useProfil(useShallow((s) => ({ notes: s.notesSoir, nights: s.nights, checks: s.hrvChecks })));
  const base = baseHrv(p.nights, p.checks);
  const nuitApres = (d: string) => {
    const lendemain = new Date(new Date(d).getTime() + 864e5).toISOString().slice(0, 10);
    return p.nights.find((n) => n.d.slice(0, 10) === lendemain) ?? null;
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <EnTetePage titre="Journal du sommeil" sous="Ce qui a marqué tes soirées, et la nuit qui a suivi" retour="/sommeil" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Button label="Ajouter mes notes du soir" icon="edit" onPress={() => router.push('/notes-soir')} />
        {!p.notes.length && <MascotteVide texte="Pas encore de notes. Ce soir, note ce qui a marqué ta journée : café tardif, stress, lecture…" />}
        {p.notes.map((n) => {
          const nuit = nuitApres(n.d);
          const sc = sleepScore(nuit, base);
          return (
            <Card key={n.d} style={styles.carte}>
              <View style={styles.ligne}>
                <Text weight="bold" style={styles.date}>
                  {jourLong(n.d)}
                </Text>
                {sc != null && (
                  <Text weight="semibold" style={styles.score}>
                    Nuit {sc}/100
                  </Text>
                )}
              </View>
              <View style={styles.tags}>
                {n.tags.map((id) => (
                  <View key={id} style={styles.tag}>
                    <IconeNote id={id} size={16} color={colors.pink} />
                    <Text style={styles.tagTxt}>{TAGS_SOIR.find((t) => t.id === id)?.nom ?? id}</Text>
                  </View>
                ))}
              </View>
              {!!n.note && <Text style={styles.note}>{n.note}</Text>}
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30, gap: 12 },
  vide: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, textAlign: 'center', marginTop: 20 },
  carte: { padding: 16, gap: 10 },
  ligne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  date: { fontSize: 16, lineHeight: 21, textTransform: 'capitalize', flexShrink: 1 },
  score: { fontSize: 14, lineHeight: 18, color: colors.pink },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 30, borderRadius: 15, backgroundColor: ui.iconBg },
  tagTxt: { fontSize: 13, lineHeight: 17 },
  note: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
});
