import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'ghost' | 'frost';
};

/** LE bouton de l'app — un seul style d'action, décliné en 3 variantes. Jamais de bouton "maison". */
export function Button({ label, variant = 'primary', style, disabled, ...rest }: ButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      disabled={disabled}
      style={(state) => [
        styles.base,
        variant === 'primary' && { backgroundColor: theme.accent },
        variant === 'ghost' && {
          backgroundColor: 'transparent',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.border,
        },
        variant === 'frost' && {
          backgroundColor: 'rgba(255,255,255,0.16)',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: 'rgba(255,255,255,0.5)',
        },
        disabled && { opacity: 0.4 },
        state.pressed && !disabled && { opacity: 0.85 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      <Text
        style={[
          styles.label,
          { color: variant === 'ghost' ? theme.text : '#FFFFFF' },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: FontSize.body,
    fontWeight: '600',
  },
});
