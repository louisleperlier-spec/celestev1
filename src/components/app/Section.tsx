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
        <Text style={styles.action}>{note}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10, marginHorizontal: 20 },
  h4: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 19 },
  action: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
});
