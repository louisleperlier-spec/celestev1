import { Text as RNText, StyleSheet, type TextProps as RNTextProps } from 'react-native';

import { colors, fonts, type FontWeightName } from '@/theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'caption';

export type TextProps = RNTextProps & {
  variant?: Variant;
  weight?: FontWeightName;
  color?: string;
};

/** Texte de l'app : police système, titres semi-gras, peu de majuscules. */
export function Text({ variant = 'body', weight, color, style, ...rest }: TextProps) {
  const v = variants[variant];
  return (
    <RNText
      style={[v, weight && fonts[weight], color !== undefined && { color }, style]}
      {...rest}
    />
  );
}

const variants = StyleSheet.create({
  display: { ...fonts.bold, fontSize: 34, lineHeight: 41, color: colors.text, letterSpacing: -0.4 },
  title: { ...fonts.semibold, fontSize: 30, lineHeight: 36, color: colors.text, letterSpacing: -0.3 },
  heading: { ...fonts.semibold, fontSize: 19, lineHeight: 24, color: colors.text },
  body: { ...fonts.regular, fontSize: 16, lineHeight: 22, color: colors.text },
  caption: { ...fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
});
