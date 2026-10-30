import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ImagePosture, PostureSheet } from '@/components/app/Yoga';
import { Appui, Button, Icon, Text } from '@/components/ui';
import { OBJECTIFS_YOGA, SEANCES_YOGA, type Posture } from '@/data/yoga';
import { dureeMin, mmss, NIVEAUX_YOGA, posture } from '@/lib/yoga';
import { colors, fonts, ui } from '@/theme';

/** Fiche d'une séance de yoga : infos, déroulé posture par posture (fiche au toucher), Commencer. */
export default function SeanceYogaDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = SEANCES_YOGA.find((x) => x.id === id);
  const [fiche, setFiche] = useState<Posture | null>(null);
  if (!s) return null;
  const tags = [`${dureeMin(s)} min`, NIVEAUX_YOGA[s.niveau], s.style, OBJECTIFS_YOGA[s.objectif]];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} style={styles.retour} hitSlop={10}>
          <Icon name="left" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.sur}>Yoga</Text>
        <Text style={styles.h1} accessibilityRole="header">
          {s.titre}
        </Text>
        <View style={styles.tags}>
          {tags.map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagTxt}>{t}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.desc}>{s.desc}</Text>

        <Text style={styles.h2}>Déroulé</Text>
        <View style={styles.liste}>
          {s.etapes.map(([pid, sec], i) => {
            const p = posture(pid);
            return (
              <Appui key={`${pid}-${i}`} onPress={() => setFiche(p)} style={styles.ligne} accessibilityRole="button" accessibilityLabel={p.nom}>
                <ImagePosture posture={p} taille={52} />
                <View style={styles.flex}>
                  <Text weight="semibold" style={styles.h5} numberOfLines={1}>
                    {p.nom}
                  </Text>
                  <Text style={styles.p}>{p.cotes ? `${mmss(sec)} de chaque côté` : mmss(sec)}</Text>
                </View>
                <Icon name="info" size={18} color={colors.textSecondary} />
              </Appui>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.bas}>
        <Button label="Commencer" icon="play" onPress={() => router.push({ pathname: '/yoga/en-cours', params: { id: s.id } })} />
      </View>
      <PostureSheet posture={fiche} onClose={() => setFiche(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  scroll: { paddingHorizontal: 20, paddingBottom: 30 },
  retour: { width: 40, height: 40, borderRadius: 20, backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  sur: { ...fonts.semibold, fontSize: 14, lineHeight: 18, color: colors.pink, marginTop: 16 },
  h1: { ...fonts.bold, fontSize: 32, lineHeight: 38, letterSpacing: -0.6, marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tag: { borderRadius: 100, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 6 },
  tagTxt: { fontSize: 13, lineHeight: 17 },
  desc: { fontSize: 16, lineHeight: 23, color: colors.textSecondary, marginTop: 14 },
  h2: { ...fonts.bold, fontSize: 22, lineHeight: 28, marginTop: 24, marginBottom: 8 },
  liste: { gap: 8 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 18, backgroundColor: colors.surface },
  h5: { fontSize: 16, lineHeight: 21 },
  p: { fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  bas: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 },
});
