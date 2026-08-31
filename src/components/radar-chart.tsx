import { View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

type Axis = { label: string; value: number }; // value 0-100

type Props = {
  axes: Axis[];
  size?: number;
  color: string;
};

function pointAt(cx: number, cy: number, radius: number, index: number, count: number, fraction: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
  return {
    x: cx + radius * fraction * Math.cos(angle),
    y: cy + radius * fraction * Math.sin(angle),
  };
}

export function RadarChart({ axes, size = 220, color }: Props) {
  const theme = useTheme();
  const labelPad = 34;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - labelPad;
  const count = axes.length;

  const rings = [0.25, 0.5, 0.75, 1];
  const dataPoints = axes.map((a, i) => pointAt(cx, cy, radius, i, count, Math.max(0, Math.min(100, a.value)) / 100));
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {rings.map((f) => {
          const ringPoints = axes
            .map((_, i) => pointAt(cx, cy, radius, i, count, f))
            .map((p) => `${p.x},${p.y}`)
            .join(' ');
          return (
            <Polygon key={f} points={ringPoints} stroke={theme.chartGrid} strokeWidth={1} fill="none" />
          );
        })}

        {axes.map((_, i) => {
          const p = pointAt(cx, cy, radius, i, count, 1);
          return <Line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={theme.chartGrid} strokeWidth={1} />;
        })}

        <Polygon points={dataPolygon} fill={`${color}33`} stroke={color} strokeWidth={2} />
        {dataPoints.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={color} stroke={theme.bg} strokeWidth={1.5} />
        ))}

        {axes.map((a, i) => {
          const p = pointAt(cx, cy, radius, i, count, 1.24);
          return (
            <SvgText
              key={i}
              x={p.x}
              y={p.y}
              fontSize={11}
              fontWeight="600"
              fill={theme.textSecondary}
              textAnchor="middle">
              {a.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
