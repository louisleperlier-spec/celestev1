import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/ui/components/card';
import { IconSymbol } from '@/ui/components/icon-symbol';
import { Screen } from '@/ui/components/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BREATHING_TECHNIQUES } from '@/lib/breathing';

export function MeditateView() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Screen>
      <ThemedText type="heading" style={{ marginTop: Spacing.three }}>
        Méditer
      </ThemedText>
      <ThemedText themeColor="textSecondary">
        Des respirations guidées, pas à pas — aucun casque nécessaire.
      </ThemedText>

      {BREATHING_TECHNIQUES.map((technique) => (
        <Pressable key={technique.id} onPress={() => router.push(`/meditation/${technique.id}`)}>
          <Card style={styles.row}>
            <IconSymbol name="wind" size={26} color={theme.accent} />
            <View style={{ flex: 1, marginLeft: Spacing.three }}>
              <ThemedText type="heading">{technique.title}</ThemedText>
              <ThemedText themeColor="textSecondary" style={{ marginTop: 2 }}>
                {technique.subtitle} · {technique.durationLabel}
              </ThemedText>
            </View>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  subtitle: { marginTop: -Spacing.two, marginBottom: Spacing.one, marginLeft: Spacing.one },
});
