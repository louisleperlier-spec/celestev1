import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Elevation } from '@/constants/theme';
import { useAnimatedNumber } from '@/hooks/use-animated-number';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
};

export function ScoreRing({ value, size = 220, strokeWidth = 16 }: Props) {
  const theme = useTheme();
  const animatedValue = useAnimatedNumber(value);
  const arcWidth = strokeWidth + 2;
  const radius = (size - arcWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, animatedValue));
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <View style={[{ width: size, height: size }, value > 0 && Elevation.glow]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="scoreRingGradient" x1="0" y1="0" x2={size} y2={size}>
            <Stop offset="0" stopColor={theme.gradientStart} />
            <Stop offset="1" stopColor={theme.gradientEnd} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.surface2}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#scoreRingGradient)"
          strokeWidth={arcWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <ThemedText type="display" style={[{ color: theme.text }, styles.number]}>
          {Math.round(animatedValue)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.suffix}>
          / 100
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  suffix: {
    marginTop: 2,
  },
  number: {
    fontFamily: Platform.select({ ios: 'ui-rounded', default: undefined }),
    fontVariant: ['tabular-nums'],
  },
});
