import React from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

/**
 * Mascotte Lume — une goutte souriante, couleur fixe (indépendante du thème d'accent choisi),
 * au même titre que les notes A/B/C. Poses volontairement simples (formes géométriques), pas
 * d'asset externe à charger.
 */

export type MascotPose = 'wave' | 'sit' | 'sleep';

interface MascotProps {
  pose?: MascotPose;
  size?: number;
}

export function Mascot({ pose = 'wave', size = 120 }: MascotProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {/* Corps */}
      <Path
        d="M60 8 C60 8 24 52 24 76 C24 98.6 40.1 112 60 112 C79.9 112 96 98.6 96 76 C96 52 60 8 60 8 Z"
        fill={Colors.mascot}
      />
      <Path
        d="M60 8 C60 8 24 52 24 76 C24 98.6 40.1 112 60 112 L60 8 Z"
        fill={Colors.mascotStrong}
        opacity={0.16}
      />

      {/* Joues */}
      <Circle cx={40} cy={82} r={6} fill="#FFFFFF" opacity={0.45} />
      <Circle cx={80} cy={82} r={6} fill="#FFFFFF" opacity={0.45} />

      {pose === 'sleep' ? (
        <>
          <Path d="M42 72 q6 -6 12 0" stroke="#1C2B26" strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M66 72 q6 -6 12 0" stroke="#1C2B26" strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M52 92 q8 5 16 0" stroke="#1C2B26" strokeWidth={3} strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <Circle cx={47} cy={72} r={4} fill="#1C2B26" />
          <Circle cx={73} cy={72} r={4} fill="#1C2B26" />
          <Path
            d="M48 90 q12 12 24 0"
            stroke="#1C2B26"
            strokeWidth={3.5}
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}

      {/* Bras */}
      {pose === 'wave' && (
        <>
          <Path d="M28 78 C16 74 10 60 14 50" stroke={Colors.mascot} strokeWidth={9} strokeLinecap="round" fill="none" />
          <Path d="M92 78 C104 70 106 58 100 50" stroke={Colors.mascot} strokeWidth={9} strokeLinecap="round" fill="none" />
        </>
      )}
      {pose === 'sit' && (
        <>
          <Path d="M30 84 C22 90 20 98 26 102" stroke={Colors.mascot} strokeWidth={9} strokeLinecap="round" fill="none" />
          <Path d="M90 84 C98 90 100 98 94 102" stroke={Colors.mascot} strokeWidth={9} strokeLinecap="round" fill="none" />
        </>
      )}
      {pose === 'sleep' && (
        <Path d="M40 96 C50 104 70 104 80 96" stroke={Colors.mascot} strokeWidth={9} strokeLinecap="round" fill="none" />
      )}

      {/* Reflet brillant */}
      <Ellipse cx={44} cy={38} rx={7} ry={11} fill="#FFFFFF" opacity={0.55} />
    </Svg>
  );
}
