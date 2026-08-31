import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  maxValue?: number;
  color: string;
}

/** Petite courbe de tendance (7 derniers jours) — pas de graphique interactif, juste un aperçu. */
export function Sparkline({ values, width = 100, height = 32, maxValue = 100, color }: SparklineProps) {
  if (values.length < 2) return <View style={{ width, height }} />;

  const safeMax = maxValue > 0 ? maxValue : 1;
  const stepX = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - (Math.max(0, Math.min(safeMax, v)) / safeMax) * height;
    return { x, y };
  });

  return (
    <Svg width={width} height={height}>
      <Polyline
        points={points.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={3} fill={color} />
    </Svg>
  );
}
