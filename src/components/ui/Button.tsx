import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, glow, gradients, radius, sizes, spacing, ui } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Props = {
  label: string;
  onPress?: () => void;
  /** primary : dégradé (.btn) ; dark : sombre bordé (.btn.dark) ; secondary : alias de dark. */
  variant?: 'primary' | 'dark' | 'secondary';
  disabled?: boolean;
  /** Flèche après le libellé, comme les boutons « Continuer » du prototype. */
  arrow?: boolean;
  /** Icône avant le libellé (Modifier, Planifier, Débloquer…). */
  icon?: IconName;
  /** Icône après le libellé (« Lancer la séance ▶ »). */
  iconAfter?: IconName;
  /** Petit libellé (.btn.sm). */
  small?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Bouton pilule, hauteur 52 (.btn du prototype). */
export function Button({ label, onPress, variant = 'primary', disabled = false, arrow = false, icon, iconAfter, small = false, style }: Props) {
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
        style,
      ]}
    >
      {primary ? (
        <LinearGradient
          colors={gradients.primary}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.fill, small && styles.smallGap]}
        >
          <Label label={label} color={fg} arrow={arrow} icon={icon} iconAfter={iconAfter} small={small} />
        </LinearGradient>
      ) : (
        <View style={[styles.fill, styles.dark, small && styles.smallGap]}>
          <Label label={label} color={fg} arrow={arrow} icon={icon} iconAfter={iconAfter} small={small} />
        </View>
      )}
    </Pressable>
  );
}

function Label({
  label,
  color,
  arrow,
  icon,
  iconAfter,
  small,
}: {
  label: string;
  color: string;
  arrow: boolean;
  icon?: IconName;
  iconAfter?: IconName;
  small: boolean;
}) {
  const t = small ? 16 : 18;
  return (
    <>
      {icon && <Icon name={icon} size={t} strokeWidth={2.2} color={color} />}
      <Text style={[styles.label, small && styles.small, { color }]} numberOfLines={1}>
        {label}
      </Text>
      {arrow && <Icon name="arrow" size={t} strokeWidth={2.2} color={color} />}
      {iconAfter && <Icon name={iconAfter} size={t} strokeWidth={2.2} color={color} />}
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
  small: { fontSize: 13.5 },
  smallGap: { gap: 6, paddingHorizontal: spacing.md },
});
