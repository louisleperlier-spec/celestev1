import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { colors, fonts } from '@/theme';

/** Badge calories orange (.kb). */
export function Kcal({ kcal }: { kcal: number }) {
  return (
    <View style={styles.kb}>
      <Icon name="flame" size={12} color={colors.kcal} />
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
    borderRadius: 999,
    backgroundColor: 'rgba(255,138,31,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,138,31,0.3)',
  },
  text: { fontFamily: fonts.semibold, fontSize: 11.5, lineHeight: 15, color: '#FFB27A' },
});
