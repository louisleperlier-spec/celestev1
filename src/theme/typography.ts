import type { TextStyle } from 'react-native';

/**
 * Police système (SF Pro sur iOS, Roboto sur Android) : chaque graisse est un style `fontWeight`.
 * Graisses retenues avec retenue : les plus épaisses plafonnent à 700 (chiffres lisibles, pas écrasants).
 */
export const fonts = {
  light: { fontWeight: '300' },
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '600' },
  extrabold: { fontWeight: '700' },
  black: { fontWeight: '700' },
} as const satisfies Record<string, TextStyle>;

export type FontWeightName = keyof typeof fonts;
