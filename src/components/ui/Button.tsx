import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, glow, gradients, radius, sizes, spacing, ui } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

type Props = {
  label: string;
  onPress?: () => void;
  /** primary : dégradé (.btn) ; dark : sombre bordé (.btn.dark) ; secondary : alias de dark. */
  variant?: 'primary' | 'dark' | 'secondary';
  disabled?: boolean;
  /** Flèche après le libellé, comme les boutons « Continuer » du prototype. */
  arrow?: boolean;
};

/** Bouton pilule, hauteur 52 (.btn du prototype). */
export function Button({ label, onPress, variant = 'primary', disabled = false, arrow = false }: Props) {
  const primary = variant === 'primary';
  const fg = primary ? colors.onPrimary : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        primary && !disabled && glow('rgba(255,79,163,0.35)', 24),
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {primary ? (
        <LinearGradient
          colors={gradients.primary}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.fill}
        >
          <Label label={label} color={fg} arrow={arrow} />
        </LinearGradient>
      ) : (
        <View style={[styles.fill, styles.dark]}>
          <Label label={label} color={fg} arrow={arrow} />
        </View>
      )}
    </Pressable>
  );
}

function Label({ label, color, arrow }: { label: string; color: string; arrow: boolean }) {
  return (
    <>
      <Text style={[styles.label, { color }]}>{label}</Text>
      {arrow && <Icon name="arrow" size={18} strokeWidth={2.2} color={color} />}
    </>
  );
}

const styles = StyleSheet.create({
  base: { height: sizes.buttonHeight, borderRadius: radius.pill },
  disabled: { opacity: 0.35 },
  pressed: { transform: [{ scale: 0.98 }] },
  fill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  dark: { backgroundColor: ui.dark, borderWidth: 1, borderColor: colors.border2 },
  label: { fontFamily: fonts.bold, fontSize: 15 },
});
