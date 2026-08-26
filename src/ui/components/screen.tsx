import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = ScrollViewProps & {
  /** Écran "signature" (Accueil, Paywall…) posé sur le NightSkyBackdrop → fond transparent. */
  transparent?: boolean;
};

/** Le conteneur d'écran unique — fond, padding et largeur max cohérents partout. */
export function Screen({ transparent, contentContainerStyle, style, ...rest }: ScreenProps) {
  const theme = useTheme();
  return (
    <View style={[styles.fill, !transparent && { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <ScrollView
          style={[styles.fill, style]}
          contentContainerStyle={[styles.content, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          {...rest}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
