import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { Icon, Text } from '@/components/ui';
import { colors, heartZones, ui } from '@/theme';

const ZC = [heartZones.z1, heartZones.z2, heartZones.z3, heartZones.z4, heartZones.z5];

/** FC, zone, VFC (et calories) en direct (livePills du prototype). */
/** `centre` : dans l'écran de repos, la ligne est centrée (pas de source poussée à droite). */
export function LivePills({ bpm, zone, hrv, kcal, centre }: { bpm: number; zone: number; hrv: number; kcal?: number; centre?: boolean }) {
  return (
    <View style={[styles.live, centre && styles.centre]}>
      <View style={styles.pill}>
        <Battement />
        <Text weight="bold" style={styles.b}>
          {Math.round(bpm)}
        </Text>
        <Text style={styles.small}>bpm</Text>
        <View style={[styles.zone, { backgroundColor: ZC[zone - 1] }]} />
      </View>
      <View style={styles.pill}>
        <Icon name="wave" size={15} />
        <Text style={styles.small}>VFC</Text>
        <Text weight="bold" style={styles.b}>
          {hrv || '--'}
        </Text>
        <Text style={styles.small}>ms</Text>
      </View>
      {kcal != null && (
        <View style={styles.pill}>
          <Icon name="flame" size={15} />
          <Text weight="bold" style={styles.b}>
            {Math.round(kcal)}
          </Text>
          <Text style={styles.small}>kcal</Text>
        </View>
      )}
      <Text style={[styles.src, centre && styles.srcCentre]}>Simulation</Text>
    </View>
  );
}

/** Cœur qui bat (animation beat : ×1,25 à 15 %, retour à 30 %, 1 s). */
function Battement() {
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = withRepeat(withSequence(withTiming(1.25, { duration: 150 }), withTiming(1, { duration: 150 }), withTiming(1, { duration: 700 })), -1);
  }, [s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={style}>
      <Icon name="heart" size={15} color={ui.heart} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  live: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingTop: 8, paddingHorizontal: 20 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: '#141418',
    borderWidth: 1,
    borderColor: colors.border2,
  },
  b: { fontSize: 12.5, lineHeight: 16, fontVariant: ['tabular-nums'] },
  small: { fontSize: 11, lineHeight: 14, color: colors.textSecondary },
  zone: { width: 8, height: 8, borderRadius: 4 },
  centre: { justifyContent: 'center', paddingHorizontal: 0 },
  srcCentre: { marginLeft: 0 },
  src: { marginLeft: 'auto', fontSize: 10.5, lineHeight: 13, color: colors.textSecondary },
});
