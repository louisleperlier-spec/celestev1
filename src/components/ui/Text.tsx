import { Text as RNText, StyleSheet, type TextProps as RNTextProps } from 'react-native';

import { colors, fonts, type FontWeightName } from '@/theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'caption';

export type TextProps = RNTextProps & {
  variant?: Variant;
  weight?: FontWeightName;
  color?: string;
};

/** Texte de l'app : Inter, titres en gras très épais. */
export function Text({ variant = 'body', weight, color, style, ...rest }: TextProps) {
  const v = variants[variant];
  return (
    <RNText
      style={[v, weight && { fontFamily: fonts[weight] }, color !== undefined && { color }, style]}
      {...rest}
    />
  );
}

const variants = StyleSheet.create({
  display: { fontFamily: fonts.black, fontSize: 40, lineHeight: 44, color: colors.text, letterSpacing: -1 },
  title: { fontFamily: fonts.black, fontSize: 28, lineHeight: 32, color: colors.text, letterSpacing: -0.5 },
  heading: { fontFamily: fonts.extrabold, fontSize: 18, lineHeight: 22, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.text },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
});
