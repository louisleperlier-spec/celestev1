import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Segment = { value: number; color: string };

type Props = {
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
};

export function DonutChart({ segments, size = 120, strokeWidth = 18 }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let offsetAccum = 0;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((s, i) => {
      const fraction = total > 0 ? s.value / total : 0;
      const dash = circumference * fraction;
      const dashArray = `${dash} ${circumference - dash}`;
      const dashOffset = -offsetAccum;
      offsetAccum += dash;
      return { ...s, dashArray, dashOffset, key: i };
    });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#00000010"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {total === 0
          ? null
          : arcs.map((a) => (
              <Circle
                key={a.key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={a.color}
                strokeWidth={strokeWidth}
                strokeDasharray={a.dashArray}
                strokeDashoffset={a.dashOffset}
                fill="none"
                rotation={-90}
                origin={`${size / 2}, ${size / 2}`}
              />
            ))}
      </Svg>
    </View>
  );
}
