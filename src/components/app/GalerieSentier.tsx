import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text } from '@/components/ui';
import type { PhotoSentier } from '@/data/randosImages';
import { colors, ui } from '@/theme';

const L = 232;
const H = 150;

/** Galerie d'un sentier : photos en ligne (crédit sur chaque photo), plein écran en touchant, à faire glisser. */
export function GalerieSentier({ photos }: { photos: readonly PhotoSentier[] }) {
  const [ouverte, setOuverte] = useState<number | null>(null);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  if (!photos.length) return null;
  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.defile} contentContainerStyle={styles.rangee}>
        {photos.map((p, i) => (
          <Pressable key={i} onPress={() => setOuverte(i)} accessibilityRole="imagebutton" accessibilityLabel={`Photo ${i + 1} sur ${photos.length}`}>
            <View style={styles.tuile}>
              <Image source={p.img} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
              {p.credit && (
                <View style={styles.credit}>
                  <Text numberOfLines={1} style={styles.creditTxt}>
                    © {p.credit}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <Modal visible={ouverte != null} transparent animationType="fade" onRequestClose={() => setOuverte(null)}>
        <View style={styles.voile}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentOffset={{ x: (ouverte ?? 0) * width, y: 0 }}>
            {photos.map((p, i) => (
              <View key={i} style={{ width, height, justifyContent: 'center' }}>
                <Image source={p.img} style={{ width, height: height * 0.62 }} contentFit="contain" />
                <Text style={styles.legende}>
                  {i + 1} / {photos.length}
                  {p.credit ? ` · Photo ${p.credit} · Wikimedia Commons, teintée par NÉA` : ''}
                </Text>
              </View>
            ))}
          </ScrollView>
          <Pressable onPress={() => setOuverte(null)} style={[styles.fermer, { top: insets.top + 8 }]} accessibilityRole="button" accessibilityLabel="Fermer">
            <Icon name="x" size={22} />
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  defile: { marginHorizontal: -20, marginTop: 10 },
  rangee: { gap: 10, paddingHorizontal: 20 },
  tuile: { width: L, height: H, borderRadius: 16, overflow: 'hidden', backgroundColor: ui.carte, justifyContent: 'flex-end' },
  credit: { margin: 6, alignSelf: 'flex-start', maxWidth: L - 12, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: ui.voileCredit },
  creditTxt: { fontSize: 10, lineHeight: 13, color: colors.text },
  voile: { flex: 1, backgroundColor: ui.voileVisionneuse },
  legende: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 24, marginTop: 14 },
  fermer: { position: 'absolute', right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: ui.voileCredit, alignItems: 'center', justifyContent: 'center' },
});
