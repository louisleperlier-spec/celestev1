import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Fonts, Radius, Spacing } from '@/constants/theme';
import { Grade, MetricId } from '@/features/hydration/types';

import { GradeBadge } from './GradeBadge';

const GRADE_FILL: Record<Grade, string> = {
  A: Colors.gradeA,
  B: Colors.gradeB,
  C: Colors.gradeC,
  D: Colors.gradeD,
};

const METRIC_ICON: Record<MetricId, SFSymbol> = {
  volume: 'drop.fill',
  regularity: 'calendar',
  timing: 'clock.fill',
  quality: 'star.fill',
};

interface MetricCardProps {
  metricId: MetricId;
  label: string;
  score: number;
  grade: Grade;
}

export function MetricCard({ metricId, label, score, grade }: MetricCardProps) {
  const width = `${Math.max(4, Math.min(100, score))}%` as const;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <SymbolView name={METRIC_ICON[metricId]} size={13} tintColor={Colors.textMuted} />
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </View>
        <GradeBadge grade={grade} size="sm" />
      </View>
      <Text style={styles.scoreText}>{Math.round(score)}/100</Text>
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
  labelRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: Spacing.one,
  },
  label: {
    flexShrink: 1,
    fontSize: FontSize.footnote,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  scoreText: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
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
