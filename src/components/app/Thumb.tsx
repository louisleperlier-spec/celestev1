import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui';
import { EXERCICE_IMAGES } from '@/data';
import type { ExerciceId } from '@/data/types';

/** Vignette d'exercice (.thumb, .thumb.big), avec cadenas NÉA Plus (.lk). */
export function Thumb({ id, big = false, locked = false }: { id: ExerciceId; big?: boolean; locked?: boolean }) {
  const box = big ? 62 : 56;
  return (
    <View style={[styles.thumb, { width: box, height: box, borderRadius: big ? 16 : 12 }]}>
      <Image source={EXERCICE_IMAGES[id]} style={{ width: big ? 58 : 52, height: big ? 56 : 50 }} contentFit="contain" />
      {locked && (
        <View style={styles.lk}>
          <Icon name="lock" size={12} color="#FFC23D" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: { backgroundColor: '#0F0F12', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  lk: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
