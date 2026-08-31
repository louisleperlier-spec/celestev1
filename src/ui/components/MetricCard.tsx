import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { Grade } from '@/features/hydration/types';

import { GradeBadge } from './GradeBadge';

const GRADE_FILL: Record<Grade, string> = {
  A: Colors.gradeA,
  B: Colors.gradeB,
  C: Colors.gradeC,
  D: Colors.gradeD,
};

interface MetricCardProps {
  label: string;
  score: number;
  grade: Grade;
}

export function MetricCard({ label, score, grade }: MetricCardProps) {
  const width = `${Math.max(4, Math.min(100, score))}%` as const;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <GradeBadge grade={grade} size="sm" />
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width, backgroundColor: GRADE_FILL[grade] }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: FontSize.footnote,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  track: {
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
});
