import type { ViewStyle } from 'react-native';

import { colors } from './colors';

/**
 * Effet « glow » rose : ombre colorée sans décalage.
 * `boxShadow` est pris en charge par React Native (nouvelle architecture) sur iOS et Android.
 */
export function glow(color: string = colors.pink, blur = 18, spread = 0): ViewStyle {
  return { boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: blur, spreadDistance: spread, color }] };
}
