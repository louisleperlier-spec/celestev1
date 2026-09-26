import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text } from '@/components/ui';
import { ouvrirNotif, useBanniere } from '@/store/notifs';
import { colors, ui } from '@/theme';

/** Bannière de notification en haut de l'écran, 7 s, touchable (.nbanner). */
export function NotifBanniere() {
  const n = useBanniere((s) => s.n);
  const insets = useSafeAreaInsets();
  const y = useSharedValue(-160);
  useEffect(() => {
    y.value = withTiming(n ? 0 : -160, { duration: 400 });
  }, [n, y]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  if (!n) return null;
  return (
    <Animated.View style={[styles.wrap, { top: insets.top + 8 }, anim]}>
      <Pressable accessibilityRole="button" onPress={() => ouvrirNotif(n.act, n.id)} style={styles.banner}>
        <View style={[styles.nic, { backgroundColor: n.col }]}>
          <Icon name={n.icon} color={colors.text} />
        </View>
        <View style={styles.flex}>
          <Text weight="bold" style={styles.b}>
            {n.title}
          </Text>
          <Text style={styles.small}>{n.body}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 70 },
  banner: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(28,28,34,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  },
  nic: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  b: { fontSize: 14, lineHeight: 18 },
  small: { fontSize: 12.5, lineHeight: 17, color: ui.bannerTxt, marginTop: 2 },
});
