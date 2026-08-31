import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Point = { label: string; value: number | null };

type Props = {
  points: Point[];
  color: string;
  height?: number;
};

const PADDING_X = 20;
const PADDING_TOP = 28;
const PADDING_BOTTOM = 28;

export function TrendLineChart({ points, color, height = 200 }: Props) {
  const theme = useTheme();
  const width = Math.max(280, points.length * 44);
  const chartH = height - PADDING_TOP - PADDING_BOTTOM;
  const chartW = width - PADDING_X * 2;
  const step = points.length > 1 ? chartW / (points.length - 1) : 0;

  const values = points.map((p) => p.value).filter((v): v is number => v !== null);
  const rawMin = values.length ? Math.min(...values) : 0;
  const rawMax = values.length ? Math.max(...values) : 100;
  const margin = Math.max(4, (rawMax - rawMin) * 0.15);
  const min = Math.max(0, rawMin - margin);
  const max = Math.min(100, rawMax + margin);
  const span = max - min || 1;

  const yFor = (v: number) => PADDING_TOP + chartH * (1 - (v - min) / span);

  const coords = points.map((p, i) => {
    const x = PADDING_X + step * i;
    const v = p.value ?? min;
    return { x, y: yFor(v), value: p.value };
  });

  const validCoords = coords.filter((c) => c.value !== null);
  const linePath = validCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath =
    validCoords.length > 0
      ? `${linePath} L ${validCoords[validCoords.length - 1].x} ${PADDING_TOP + chartH} L ${validCoords[0].x} ${PADDING_TOP + chartH} Z`
      : '';

  const gridLines = [0, 0.5, 1];
  const last = validCoords[validCoords.length - 1];

  return (
    <View style={{ height: height + Spacing.lg }}>
      <Svg width={width} height={height + Spacing.lg}>
        <Defs>
          <LinearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.28} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {gridLines.map((g) => {
          const y = PADDING_TOP + chartH * (1 - g);
          return (
            <Line
              key={g}
              x1={PADDING_X}
              x2={width - PADDING_X}
              y1={y}
              y2={y}
              stroke={theme.chartGrid}
              strokeWidth={1}
            />
          );
        })}

        {areaPath ? <Path d={areaPath} fill="url(#trendAreaGradient)" /> : null}
        {linePath ? <Path d={linePath} stroke={color} strokeWidth={3} strokeLinecap="round" fill="none" /> : null}

        {coords.map(
          (c, i) =>
            c.value !== null && (
              <Circle
                key={i}
                cx={c.x}
                cy={c.y}
                r={i === coords.length - 1 ? 5.5 : 3.5}
                fill={i === coords.length - 1 ? color : theme.bg}
                stroke={color}
                strokeWidth={2}
              />
            )
        )}

        {last && (
          <SvgText
            x={last.x}
            y={Math.max(14, last.y - 14)}
            fontSize={13}
            fontWeight="700"
            fill={theme.text}
            textAnchor="middle">
            {last.value}
          </SvgText>
        )}

        {points.map((p, i) => (
          <SvgText
            key={i}
            x={PADDING_X + step * i}
            y={height + Spacing.md}
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

export function TrendLineChartEmpty({ height = 200 }: { height?: number }) {
  return (
    <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
      <ThemedText themeColor="textTertiary" type="small">
        Pas encore assez de données
      </ThemedText>
    </View>
  );
}
