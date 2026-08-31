import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PillButton } from '@/components/pill-button';
import { RadarChart } from '@/components/radar-chart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PILLARS } from '@/constants/piliers';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SHOWCASE_VALUES = [72, 60, 68, 82, 58];

const FEATURES = [
  { icon: 'flag' as const, title: 'Missions quotidiennes', body: 'Une action par pilier, chaque jour.' },
  { icon: 'speedometer' as const, title: 'Max Score intelligent', body: '5 piliers suivis en continu.' },
  { icon: 'analytics' as const, title: 'Progrès mesurés', body: 'Check-ins, courbes, vue radar.' },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const axes = PILLARS.map((p, i) => ({ label: p.label, value: SHOWCASE_VALUES[i] }));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <RadarChart axes={axes} color={theme.primary} size={200} />
        </View>

        <ThemedText type="title" style={styles.title}>
          SelfMax
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          On parle beaucoup de lookmaxing. Ici, on maxe ce qui compte vraiment : toi, en entier.
        </ThemedText>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name={f.icon} size={18} color={theme.primary} />
              </View>
              <View style={styles.featureText}>
                <ThemedText type="smallBold">{f.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {f.body}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        <PillButton title="Commencer" onPress={onDone} style={styles.cta} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  hero: {
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
    marginBottom: Spacing.two,
  },
  features: {
    alignSelf: 'stretch',
    gap: Spacing.three,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, gap: 2 },
  cta: {
    marginTop: Spacing.five,
    alignSelf: 'stretch',
  },
});
