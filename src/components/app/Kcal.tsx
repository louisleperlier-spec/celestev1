import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { colors, fonts } from '@/theme';

/** Calories d'un exercice (.kb) : petit texte gris, sans pastille colorée (refonte sobre). */
export function Kcal({ kcal }: { kcal: number }) {
  return (
    <View style={styles.kb}>
      <Icon name="flame" size={12} color={colors.textTertiary} />
      <Text style={styles.text}>{kcal} kcal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: colors.surface2,
  },
  text: { ...fonts.medium, fontSize: 11.5, lineHeight: 15, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
});
