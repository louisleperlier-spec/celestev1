import { StyleSheet, Text, type TextProps } from 'react-native';

import { ThemeColor, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'subtitle' | 'small' | 'smallBold' | 'sectionLabel' | 'display' | 'displayMedium';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? (type === 'sectionLabel' ? 'textSecondary' : 'text')] },
        styles[type],
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: { ...Typography.body, lineHeight: 21 },
  small: { ...Typography.caption, lineHeight: 18 },
  smallBold: { ...Typography.bodyBold, lineHeight: 20 },
  sectionLabel: { ...Typography.sectionLabel, lineHeight: 16 },
  title: { ...Typography.title, lineHeight: 32 },
  subtitle: { ...Typography.subtitle, lineHeight: 26 },
  display: { ...Typography.display, lineHeight: 68 },
  displayMedium: { ...Typography.displayMedium, lineHeight: 44 },
});
