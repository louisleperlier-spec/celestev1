import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { IconeSport } from '@/components/app/IconeSport';
import { Sheet } from '@/components/app/Sheet';
import { Text } from '@/components/ui';
import type { Posture } from '@/data/yoga';
import { YOGA_IMAGES } from '@/data/yogaImages';
import { NIVEAUX_YOGA } from '@/lib/yoga';
import { colors, fonts, ui } from '@/theme';

/** Illustration d'une posture, ou une silhouette de lotus en attendant l'image. */
export function ImagePosture({ posture, taille, style }: { posture: Posture; taille: number; style?: StyleProp<ViewStyle> }) {
  const src = YOGA_IMAGES[posture.id];
  return (
    <View style={[styles.cadre, { width: taille, height: taille, borderRadius: Math.round(taille * 0.18) }, style]}>
      {src ? (
        <Image source={src} style={StyleSheet.absoluteFill} contentFit="contain" accessibilityLabel={posture.nom} />
      ) : (
        <IconeSport glyphe="lotus" size={Math.round(taille * 0.5)} strokeWidth={1.4} />
      )}
    </View>
  );
}

/** Fiche d'une posture : image, zones, consignes, souffle, précaution. */
export function PostureSheet({ posture, onClose }: { posture: Posture | null; onClose: () => void }) {
  return (
    <Sheet visible={!!posture} onClose={onClose} title={posture?.nom}>
      {posture && (
        <View>
          <Text style={styles.sanskrit}>
            {posture.sanskrit} · {NIVEAUX_YOGA[posture.niveau]}
            {posture.cotes ? ' · des deux côtés' : ''}
          </Text>
          <ImagePosture posture={posture} taille={200} style={styles.centre} />
          <Text style={styles.zones}>{posture.zones}</Text>
          {posture.consignes.map((c, i) => (
            <View key={c} style={styles.etape}>
              <Text weight="bold" style={styles.num}>
                {i + 1}
              </Text>
              <Text style={styles.consigne}>{c}</Text>
            </View>
          ))}
          <Text weight="semibold" style={styles.titre}>
            Souffle
          </Text>
          <Text style={styles.p}>{posture.souffle}</Text>
          <Text weight="semibold" style={styles.titre}>
            Plus doux
          </Text>
          <Text style={styles.p}>{posture.attention}</Text>
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  cadre: { backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  centre: { alignSelf: 'center', marginVertical: 14 },
  sanskrit: { fontSize: 14, lineHeight: 19, color: colors.textSecondary, fontStyle: 'italic' },
  zones: { ...fonts.semibold, fontSize: 15, lineHeight: 20, color: colors.pink, marginBottom: 10 },
  etape: { flexDirection: 'row', gap: 10, marginTop: 8 },
  num: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.pink, color: colors.onPrimary, textAlign: 'center', fontSize: 13, lineHeight: 22, overflow: 'hidden' },
  consigne: { flex: 1, fontSize: 15, lineHeight: 21 },
  titre: { fontSize: 15, lineHeight: 20, marginTop: 16 },
  p: { fontSize: 15, lineHeight: 21, color: colors.textSecondary, marginTop: 2 },
});
