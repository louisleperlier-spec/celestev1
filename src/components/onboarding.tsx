import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PillButton } from '@/components/pill-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CATEGORIES } from '@/constants/categories';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Onboarding({ onDone }: { onDone: () => void }) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.logo, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="rocket" size={40} color={theme.primary} />
        </View>

        <ThemedText type="title" style={styles.title}>
          SelfMax
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          On parle beaucoup de lookmaxing. Ici, on maxe ce qui compte vraiment : toi.
        </ThemedText>

        <View style={styles.list}>
          {CATEGORIES.map((c) => (
            <View key={c.id} style={styles.listRow}>
              <View style={[styles.dot, { backgroundColor: c.colorLight }]}>
                <Ionicons name={c.icon} size={16} color={c.color} />
              </View>
              <ThemedText type="small">{c.label}</ThemedText>
            </View>
          ))}
        </View>

        <ThemedText themeColor="textSecondary" style={styles.explain}>
          Chaque jour, log tes actions dans ces 5 domaines. On calcule ton Self Score /100,
          on te coache sur ton point faible, et on suit tes progrès.
        </ThemedText>

        <PillButton title="Commencer" onPress={onDone} style={styles.cta} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  listRow: {
    alignItems: 'center',
    gap: 6,
    width: 72,
  },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  explain: {
    textAlign: 'center',
    marginTop: Spacing.three,
    lineHeight: 20,
  },
  cta: {
    marginTop: Spacing.four,
    alignSelf: 'stretch',
  },
});
