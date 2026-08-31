import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Colors, FontSize, Fonts } from '@/constants/theme';
import { Grade } from '@/features/hydration/types';

const GRADE_STROKE: Record<Grade, string> = {
  A: Colors.gradeA,
  B: Colors.gradeB,
  C: Colors.gradeC,
  D: Colors.gradeD,
};

interface ScoreRingProps {
  score: number;
  grade: Grade;
  size?: number;
  strokeWidth?: number;
}

export function ScoreRing({ score, grade, size = 208, strokeWidth = 16 }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score)) / 100;
  const dashOffset = circumference * (1 - progress);
  const stroke = GRADE_STROKE[grade];
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke={Colors.surfaceElevated} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.center}>
          <Text style={styles.score}>{Math.round(score)}</Text>
          <Text style={styles.suffix}>/100</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.hero,
    fontWeight: '700',
    color: Colors.text,
  },
  suffix: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.footnote,
    color: Colors.textMuted,
    marginTop: -4,
  },
});
