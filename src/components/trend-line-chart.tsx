import { View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

type Point = { label: string; value: number | null };

type Props = {
  points: Point[];
  color: string;
  height?: number;
};

const PADDING_X = 20;
const PADDING_TOP = 24;
const PADDING_BOTTOM = 28;

export function TrendLineChart({ points, color, height = 200 }: Props) {
  const theme = useTheme();
  const width = Math.max(280, points.length * 44);
  const chartH = height - PADDING_TOP - PADDING_BOTTOM;
  const chartW = width - PADDING_X * 2;
  const step = points.length > 1 ? chartW / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = PADDING_X + step * i;
    const v = p.value ?? 0;
    const y = PADDING_TOP + chartH * (1 - Math.max(0, Math.min(100, v)) / 100);
    return { x, y, value: p.value };
  });

  const linePath = coords
    .filter((c) => c.value !== null)
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`)
    .join(' ');

  const gridLines = [0, 25, 50, 75, 100];

  return (
    <View style={{ height }}>
      <Svg width={width} height={height}>
        {gridLines.map((g) => {
          const y = PADDING_TOP + chartH * (1 - g / 100);
          return (
            <Line
              key={g}
              x1={PADDING_X}
              x2={width - PADDING_X}
              y1={y}
              y2={y}
              stroke={theme.border}
              strokeWidth={1}
            />
          );
        })}
        {linePath ? <Path d={linePath} stroke={color} strokeWidth={3} fill="none" /> : null}
        {coords.map(
          (c, i) =>
            c.value !== null && (
              <Circle key={i} cx={c.x} cy={c.y} r={4} fill={color} />
            )
        )}
        {points.map((p, i) => (
          <SvgText
            key={i}
            x={PADDING_X + step * i}
            y={height - 8}
            fontSize={12}
            fill={theme.textSecondary}
            textAnchor="middle">
            {p.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}
