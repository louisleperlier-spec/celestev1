import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Fonts, Radius, Spacing } from '@/constants/theme';
import { Grade } from '@/features/hydration/types';

const GRADE_COLORS: Record<Grade, { fg: string; bg: string }> = {
  A: { fg: Colors.gradeA, bg: Colors.gradeASoft },
  B: { fg: Colors.gradeB, bg: Colors.gradeBSoft },
  C: { fg: Colors.gradeC, bg: Colors.gradeCSoft },
  D: { fg: Colors.gradeD, bg: Colors.gradeDSoft },
};

interface GradeBadgeProps {
  grade: Grade;
  size?: 'sm' | 'md' | 'lg';
}

export function GradeBadge({ grade, size = 'md' }: GradeBadgeProps) {
  const colors = GRADE_COLORS[grade];
  const dims = SIZES[size];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg, width: dims.box, height: dims.box, borderRadius: dims.radius },
      ]}>
      <Text style={[styles.text, { color: colors.fg, fontSize: dims.font }]}>{grade}</Text>
    </View>
  );
}

const SIZES = {
  sm: { box: 24, font: FontSize.footnote, radius: Radius.sm },
  md: { box: 32, font: FontSize.callout, radius: Radius.md },
  lg: { box: 44, font: FontSize.title3, radius: Radius.lg },
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: Fonts.mono,
    fontWeight: '700',
  },
});
