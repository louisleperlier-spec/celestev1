import { router } from 'expo-router';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { colors, ui } from '@/theme';

/** Carte d'entrée vers les Territoires (onglets Sorties et Progrès). */
export function EntreeTerritoires({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/territoires')} style={[styles.carte, style]}>
      <View style={styles.ico}>
        <Icon name="hexa" color={colors.pink} />
      </View>
      <View style={styles.flex}>
        <Text weight="semibold" style={styles.titre}>
          Territoires
        </Text>
        <Text style={styles.p}>Chaque case traversée dehors devient à toi. Vole celles des autres !</Text>
      </View>
      <Icon name="right" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, marginHorizontal: 20, padding: 12, borderRadius: 20, backgroundColor: colors.surface },
  ico: { width: 40, height: 40, borderRadius: 12, backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  titre: { fontSize: 14, lineHeight: 18 },
  p: { fontSize: 12, lineHeight: 16, color: colors.textSecondary, marginTop: 2 },
});
