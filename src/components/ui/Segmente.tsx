import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, ui } from '@/theme';

import { Text } from './Text';

type Props<T extends string> = {
  options: readonly (T | readonly [T, string])[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
};

/** Contrôle segmenté (Semaine / Mois / Année…) : rail gris, segment actif gris clair et texte blanc, comme iOS (refonte sobre). */
export function Segmente<T extends string>({ options, value, onChange, style }: Props<T>) {
  return (
    <View style={[styles.rail, style]} accessibilityRole="tablist">
      {options.map((o) => {
        const [k, l] = typeof o === 'string' ? [o, o] : o;
        const on = k === value;
        return (
          <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(k)} style={[styles.seg, on && styles.on]}>
            <Text weight={on ? 'semibold' : 'medium'} style={[styles.txt, on && styles.txtOn]} numberOfLines={1}>
              {l}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { flexDirection: 'row', padding: 3, borderRadius: 12, backgroundColor: ui.segBg, gap: 2 },
  seg: { flex: 1, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  on: { backgroundColor: ui.segOn },
  txt: { fontSize: 13.5, lineHeight: 18, color: ui.segTxt },
  txtOn: { color: colors.text },
});
