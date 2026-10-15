import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { colors, fonts, ui } from '@/theme';

/** Feuille qui monte du bas (.sheet) ; toucher le fond la ferme. */
export function Sheet({
  visible,
  onClose,
  title,
  children,
  maxHeight = '88%',
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxHeight?: `${number}%`;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      {/* Le clavier remonte la feuille au lieu de cacher les champs. */}
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer" />
        <View style={[styles.panel, { maxHeight, paddingBottom: 20 + insets.bottom }]}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {title ? <Text style={styles.h3}>{title}</Text> : null}
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  panel: {
    backgroundColor: ui.sheet,
    borderTopWidth: 1,
    borderColor: colors.border2,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
  },
  h3: { ...fonts.bold, fontSize: 17, lineHeight: 22, marginBottom: 12 },
});
