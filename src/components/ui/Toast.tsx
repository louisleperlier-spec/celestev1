import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { create } from 'zustand';

import { colors, radius, ui } from '@/theme';

import { Text } from './Text';

const useToastStore = create<{ message: string | null; id: number }>(() => ({ message: null, id: 0 }));

/** Affiche un message bref en bas de l'écran (toast() du prototype, 2,2 s). */
export function toast(message: string) {
  useToastStore.setState((s) => ({ message, id: s.id + 1 }));
}

/** À placer une fois, dans le layout racine. */
export function ToastHost() {
  const { message, id } = useToastStore();
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => useToastStore.setState({ message: null }), 2200);
    return () => clearTimeout(t);
  }, [message, id]);
  if (!message) return null;
  return (
    // Un seul toast à la fois : le nouveau message remplace le texte, sans superposition.
    <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(250)} style={styles.toast} pointerEvents="none">
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    backgroundColor: ui.toast,
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 16,
    zIndex: 60,
  },
  text: { fontSize: 13, lineHeight: 17 },
});
