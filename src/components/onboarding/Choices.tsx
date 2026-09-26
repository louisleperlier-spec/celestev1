import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, SelectableCard, Text, type IconName } from '@/components/ui';
import { colors, fonts, glow, ui } from '@/theme';

/** Objectif à cocher (.goal) : icône, libellé, pastille cochée. */
export function GoalRow({ icon, label, on, onPress }: { icon: IconName; label: string; on: boolean; onPress: () => void }) {
  return (
    <SelectableCard multi selected={on} onPress={onPress} style={s.goal} accessibilityLabel={label}>
      <Icon name={icon} color={on ? colors.pink : ui.icon} />
      <Text style={s.goalLabel}>{label}</Text>
      <View style={[s.ck, on && s.ckOn]}>{on && <Icon name="check" size={13} strokeWidth={3} color={colors.onPrimary} />}</View>
    </SelectableCard>
  );
}

/** Grand choix unique (.big2) : pastille d'icône, titre, description, bouton radio. */
export function BigChoice({
  icon,
  title,
  desc,
  on,
  onPress,
}: {
  icon: IconName;
  title: string;
  desc: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <SelectableCard selected={on} onPress={onPress} style={s.big2} accessibilityLabel={title}>
      <View style={[s.gi, on && s.giOn]}>
        <Icon name={icon} color={on ? colors.pink : colors.text} />
      </View>
      <View style={s.big2Text}>
        <Text weight="bold" style={s.big2Title}>
          {title}
        </Text>
        <Text style={s.big2Desc}>{desc}</Text>
      </View>
      <View style={[s.radio, on && s.radioOn]} />
    </SelectableCard>
  );
}

/** Pastille de nombre (.chip). */
export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <SelectableCard selected={on} onPress={onPress} style={s.chip} accessibilityLabel={label}>
      <Text weight="semibold" style={s.chipText}>
        {label}
      </Text>
    </SelectableCard>
  );
}

/** Option en grille (.grid2b .opt) : libellé en gras et précision. */
export function Option({ label, small, on, onPress }: { label: string; small: string; on: boolean; onPress: () => void }) {
  return (
    <SelectableCard selected={on} onPress={onPress} style={s.opt} accessibilityLabel={`${label}, ${small}`}>
      <Text weight="bold" style={s.optLabel}>
        {label}
      </Text>
      <Text style={s.optSmall}>{small}</Text>
    </SelectableCard>
  );
}

/** Case à cocher (.cbx). */
export function CheckBox({ on }: { on: boolean }) {
  return <View style={[s.cbx, on && s.cbxOn]}>{on && <Icon name="check" size={13} strokeWidth={3} color={colors.onPrimary} />}</View>;
}

/** Question santé à cocher (.card.sel.hq). */
export function CheckCard({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <SelectableCard multi selected={on} onPress={onPress} style={s.hq} accessibilityLabel={label}>
      <CheckBox on={on} />
      <Text style={s.hqText}>{label}</Text>
    </SelectableCard>
  );
}

/** Confirmation à cocher, sans carte (.ackb). */
export function AckRow({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={onPress} style={s.ack}>
      <CheckBox on={on} />
      <Text style={s.ackText}>{label}</Text>
    </Pressable>
  );
}

/** Encadré d'avertissement (.warn). */
export function Warn({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[s.warn, style]}>{typeof children === 'string' ? <Text style={s.warnText}>{children}</Text> : children}</View>;
}

export const warnText = () => s.warnText;

const s = StyleSheet.create({
  goal: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 10 },
  goalLabel: { flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 18 },
  ck: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  ckOn: { backgroundColor: colors.pinkLight },
  big2: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginBottom: 10 },
  gi: { width: 44, height: 44, borderRadius: 14, backgroundColor: ui.iconBg, alignItems: 'center', justifyContent: 'center' },
  giOn: { backgroundColor: 'rgba(255,79,163,0.18)' },
  big2Text: { flex: 1 },
  big2Title: { fontSize: 16, lineHeight: 20 },
  big2Desc: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary, marginTop: 3 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border2 },
  radioOn: { borderWidth: 6, borderColor: colors.pink, ...glow(colors.pink, 8) },
  chip: { flex: 1, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 14, lineHeight: 18 },
  opt: { flex: 1, height: 72, alignItems: 'center', justifyContent: 'center', gap: 2 },
  optLabel: { fontSize: 16, lineHeight: 20 },
  optSmall: { fontSize: 11.5, lineHeight: 15, color: colors.textSecondary },
  cbx: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  cbxOn: { backgroundColor: colors.pink, borderColor: colors.pink },
  hq: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 13, paddingHorizontal: 14, marginBottom: 8 },
  hqText: { flex: 1, fontSize: 13.5, lineHeight: 19 },
  ack: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 14 },
  ackText: { flex: 1, fontSize: 13, lineHeight: 18, color: ui.text3 },
  warn: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: ui.warnBg, borderWidth: 1, borderColor: ui.warnBorder },
  warnText: { fontSize: 13.5, lineHeight: 19, color: ui.warnText },
});
