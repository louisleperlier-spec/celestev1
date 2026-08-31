import { StyleSheet, View, type ViewProps } from 'react-native';

import { Elevation, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = ViewProps & {
  /** Niveau d'élévation (surface + hairline + ombre douce). 2 = plus détachée du fond. */
  level?: 1 | 2;
};

export function Card({ style, level = 1, ...rest }: Props) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        level === 2 ? Elevation.level2 : Elevation.level1,
        { backgroundColor: theme.surface, borderColor: theme.border },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.base,
  },
});
