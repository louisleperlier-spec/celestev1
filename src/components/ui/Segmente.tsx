import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { alpha, colors, ui } from '@/theme';

import { Text } from './Text';

type Props<T extends string> = {
  options: readonly (T | readonly [T, string])[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
};

/** Contrôle segmenté (Semaine / Mois / Année, Amis / Équipes…) : rail sombre, segment actif en pilule orange (direction « nuit »). */
export function Segmente<T extends string>({ options, value, onChange, style }: Props<T>) {
  return (
    <View style={[styles.rail, style]} accessibilityRole="tablist">
      {options.map((o) => {
        const [k, l] = typeof o === 'string' ? [o, o] : o;
        const on = k === value;
        return (
          <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(k)} style={[styles.seg, on && styles.on]}>
            <Text weight={on ? 'semibold' : 'medium'} style={[styles.txt, on && styles.txtOn]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {l}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { flexDirection: 'row', padding: 4, borderRadius: 20, backgroundColor: ui.segBg, gap: 2, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  seg: { flex: 1, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  on: { backgroundColor: colors.pink, boxShadow: `0 2px 12px ${alpha(colors.pink, 0.35)}` },
  txt: { fontSize: 13.5, lineHeight: 18, color: ui.segTxt },
  txtOn: { color: colors.text },
});
