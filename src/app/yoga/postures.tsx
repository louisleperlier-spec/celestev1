import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ImagePosture, PostureSheet } from '@/components/app/Yoga';
import { Appui, Icon, Text } from '@/components/ui';
import { POSTURES, type Posture } from '@/data/yoga';
import { NIVEAUX_YOGA } from '@/lib/yoga';
import { colors, fonts, ui } from '@/theme';

/** Les postures de yoga, par niveau ; fiche au toucher. */
export default function PosturesYoga() {
  const [fiche, setFiche] = useState<Posture | null>(null);
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} style={styles.retour} hitSlop={10}>
          <Icon name="left" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.h1} accessibilityRole="header">
          Les postures
        </Text>
        {([1, 2, 3] as const).map((n) => (
          <View key={n}>
            <Text style={styles.h2}>{NIVEAUX_YOGA[n]}</Text>
            <View style={styles.grille}>
              {POSTURES.filter((p) => p.niveau === n).map((p) => (
                <Appui key={p.id} onPress={() => setFiche(p)} style={styles.carte} accessibilityRole="button" accessibilityLabel={p.nom}>
                  <ImagePosture posture={p} taille={120} />
                  <Text weight="semibold" style={styles.nom} numberOfLines={1}>
                    {p.nom}
                  </Text>
                  <Text style={styles.zone} numberOfLines={1}>
                    {p.zones}
                  </Text>
                </Appui>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <PostureSheet posture={fiche} onClose={() => setFiche(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  retour: { width: 40, height: 40, borderRadius: 20, backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  h1: { ...fonts.bold, fontSize: 32, lineHeight: 38, marginTop: 14 },
  h2: { ...fonts.bold, fontSize: 20, lineHeight: 26, marginTop: 22, marginBottom: 10 },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  carte: { width: '47%', padding: 10, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center' },
  nom: { fontSize: 15, lineHeight: 20, marginTop: 8 },
  zone: { fontSize: 12, lineHeight: 16, color: colors.textSecondary, marginTop: 2 },
});
