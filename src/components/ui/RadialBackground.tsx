import { useId } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

/**
 * Couche de dégradé radial, équivalent de
 * `radial-gradient(rx% ry% at cx% cy%, color, transparent stop%)` en CSS.
 */
export type RadialLayer = { rx: number; ry: number; cx: number; cy: number; color: string; stop?: number };

type Props = { layers: readonly RadialLayer[]; height?: number };

/** Fond d'écran fait de dégradés radiaux doux (fonds .wel et .ready du prototype). */
export function RadialBackground({ layers, height }: Props) {
  const { width, height: winH } = useWindowDimensions();
  const h = height ?? winH;
  const base = 'rb' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={h}>
        <Defs>
          {layers.map((l, i) => (
            <RadialGradient key={i} id={`${base}${i}`} cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0" stopColor={l.color} stopOpacity={1} />
              <Stop offset={l.stop ?? 0.7} stopColor={l.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {layers.map((l, i) => (
          <Ellipse
            key={i}
            cx={(l.cx / 100) * width}
            cy={(l.cy / 100) * h}
            rx={(l.rx / 100) * width}
            ry={(l.ry / 100) * h}
            fill={`url(#${base}${i})`}
          />
        ))}
      </Svg>
    </View>
  );
}
