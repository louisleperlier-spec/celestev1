import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, fonts } from '@/theme';

/** En-tête de section (.sechead) : titre + lien ou précision à droite. */
export function SectionHead({
  title,
  action,
  onAction,
  note,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  note?: string;
  style?: object;
}) {
  return (
    <View style={[styles.head, style]}>
      <Text style={styles.h4}>{title}</Text>
      {action ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : note ? (
        <Text style={styles.note}>{note}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 12, marginHorizontal: 20 },
  h4: { ...fonts.semibold, fontSize: 19, lineHeight: 24 },
  action: { fontSize: 14, lineHeight: 18, color: colors.pinkLight },
  note: { fontSize: 13, lineHeight: 17, color: colors.textSecondary },
});
