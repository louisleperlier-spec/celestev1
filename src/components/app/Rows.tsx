import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Card, Text } from '@/components/ui';
import { colors, fonts, ui } from '@/theme';

/** Ligne de liste (.card.row). */
export function Row({
  children,
  onPress,
  style,
  disabled,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const inner = <Card style={[styles.row, style]}>{children}</Card>;
  if (!onPress) return inner;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} disabled={disabled} style={disabled && styles.disabled}>
      {inner}
    </Pressable>
  );
}

/** Pastille du jour (.dnum) : « Lun » + date. */
export function DayNum({ jour, date }: { jour: string; date?: number }) {
  return (
    <View style={styles.dnum}>
      <Text style={styles.dnumLbl}>{jour}</Text>
      {date != null && (
        <Text weight="bold" style={styles.dnumB}>
          {date}
        </Text>
      )}
    </View>
  );
}

/** Titre et sous-titre d'une ligne (.row h5 / p). */
export function RowText({ title, sub, lines = 2 }: { title: string; sub?: string; lines?: number }) {
  return (
    <View style={styles.text}>
      <Text weight="semibold" style={styles.h5} numberOfLines={lines}>
        {title}
      </Text>
      {sub ? (
        <Text style={styles.p} numberOfLines={3}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

export const rowStyles = StyleSheet.create({
  list: { paddingHorizontal: 20 },
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8 },
  disabled: { opacity: 0.35 },
  dnum: { width: 44, height: 44, borderRadius: 12, backgroundColor: ui.iconBg, alignItems: 'center', justifyContent: 'center' },
  dnumLbl: { fontSize: 10, lineHeight: 13, color: colors.textSecondary },
  dnumB: { fontSize: 15, lineHeight: 18 },
  text: { flex: 1, minWidth: 0 },
  h5: { fontSize: 14.5, lineHeight: 19, fontFamily: fonts.semibold },
  p: { fontSize: 12, lineHeight: 16, color: colors.textSecondary, marginTop: 2 },
});
