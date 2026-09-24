import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, gradients, radius, sizes, spacing } from '@/theme';

import { Text } from './Text';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

/**
 * Bouton pilule, hauteur 52.
 * - primary : dégradé #FFFFFF → #FFD6EA → #F7A9CF, texte #0A0A0C
 * - secondary : surface sombre bordée
 */
export function Button({ label, onPress, variant = 'primary', disabled = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.base, (pressed || disabled) && { opacity: disabled ? 0.4 : 0.85 }]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fill}
        >
          <Text style={[styles.label, { color: colors.onPrimary }]}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.fill, styles.secondary]}>
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: sizes.buttonHeight, borderRadius: radius.pill, overflow: 'hidden' },
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
  },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  label: { fontFamily: fonts.extrabold, fontSize: 16 },
});
