import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

interface CardProps extends ViewProps {
  elevated?: boolean;
}

export function Card({ children, style, elevated, ...rest }: CardProps) {
  return (
    <View style={[styles.card, elevated && styles.elevated, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
  },
  elevated: {
    backgroundColor: Colors.surfaceElevated,
  },
});
