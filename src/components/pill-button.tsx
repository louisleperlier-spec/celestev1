import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export function PillButton({ title, onPress, variant = 'primary', icon, style, disabled }: Props) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';

  const bg = disabled ? theme.surface2 : isPrimary ? theme.primary : theme.surface2;
  const textColor = disabled ? theme.textTertiary : isPrimary ? theme.onPrimary : theme.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, opacity: pressed && !disabled ? 0.88 : 1 },
        !isPrimary && { borderWidth: 1, borderColor: theme.border },
        style,
      ]}>
      {icon && <Ionicons name={icon} size={18} color={textColor} style={styles.icon} />}
      <ThemedText type="smallBold" style={[styles.label, { color: textColor }]}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: Radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  label: {
    fontSize: 16,
  },
});
