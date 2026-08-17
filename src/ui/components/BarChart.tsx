import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Fonts, Radius, Spacing } from '@/constants/theme';

export interface BarChartDatum {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: BarChartDatum[];
  maxValue: number;
  height?: number;
  referenceValue?: number;
  referenceLabel?: string;
}

export function BarChart({ data, maxValue, height = 140, referenceValue, referenceLabel }: BarChartProps) {
  const safeMax = maxValue > 0 ? maxValue : 1;
  const referenceTop = referenceValue != null ? (1 - Math.min(1, referenceValue / safeMax)) * height : null;

  return (
    <View>
      <View style={[styles.plot, { height }]}>
        {referenceTop != null && (
          <View style={[styles.referenceLine, { top: referenceTop }]}>
            {referenceLabel && <Text style={styles.referenceLabel}>{referenceLabel}</Text>}
          </View>
        )}
        <View style={styles.bars}>
          {data.map((d) => {
            const barHeight = Math.max(3, (Math.min(d.value, safeMax) / safeMax) * height);
            return (
              <View key={d.key} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { height: barHeight, backgroundColor: d.color }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <Text key={d.key} style={styles.labelText} numberOfLines={1}>
            {shouldShowLabel(i, data.length) ? d.label : ''}
          </Text>
        ))}
      </View>
    </View>
  );
}

function shouldShowLabel(index: number, total: number): boolean {
  if (total <= 8) return true;
  const step = Math.ceil(total / 6);
  return index % step === 0 || index === total - 1;
}

const styles = StyleSheet.create({
  plot: {
    position: 'relative',
    justifyContent: 'flex-end',
  },
  referenceLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.borderStrong,
    alignItems: 'flex-end',
  },
  referenceLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontFamily: Fonts.mono,
    marginTop: -14,
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    height: '100%',
    justifyContent: 'flex-end',
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: Radius.sm,
  },
  labels: {
    flexDirection: 'row',
    marginTop: Spacing.one,
  },
  labelText: {
    flex: 1,
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 10,
    fontFamily: Fonts.mono,
  },
});
