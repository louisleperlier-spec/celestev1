import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { PillButton } from '@/components/pill-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDayLong } from '@/lib/date';
import { useCheckIns } from '@/lib/checkins-store';

export default function ScanScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { scans } = useCheckIns();

  const latest = useMemo(
    () => [...scans].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0],
    [scans]
  );
  const leanMass =
    latest?.weightKg != null && latest?.bodyFatPct != null
      ? Math.round(latest.weightKg * (1 - latest.bodyFatPct / 100) * 10) / 10
      : null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="title" style={styles.title}>
            Scan
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Suivi manuel de tes mesures et photos de progression. L&apos;analyse automatique par
            IA arrive dans une prochaine version.
          </ThemedText>

          {latest?.photoUri ? (
            <Image source={{ uri: latest.photoUri }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="body" size={48} color={theme.textSecondary} />
              <ThemedText themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
                Aucune photo pour l&apos;instant
              </ThemedText>
            </View>
          )}

          <View style={styles.metricsRow}>
            <Card style={styles.metricTile}>
              <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 22 }}>
                {leanMass ?? '—'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Masse maigre (kg)
              </ThemedText>
            </Card>
            <Card style={styles.metricTile}>
              <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 22 }}>
                {latest?.bodyFatPct ?? '—'}
                {latest?.bodyFatPct != null ? '%' : ''}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Masse grasse
              </ThemedText>
            </Card>
            <Card style={styles.metricTile}>
              <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 22 }}>
                {latest?.waistCm ?? '—'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Taille (cm)
              </ThemedText>
            </Card>
          </View>

          <Card style={styles.infoRow}>
            <Ionicons name="time" size={18} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              {latest ? `Dernier scan : ${formatDayLong(new Date(latest.createdAt))}` : 'Aucun scan enregistré'}
            </ThemedText>
          </Card>

          <PillButton
            title="Lancer un scan"
            onPress={() => router.push('/add-scan')}
            style={styles.cta}
          />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  title: { fontSize: 28, lineHeight: 32 },
  subtitle: { lineHeight: 20 },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.large,
  },
  photoPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: { flexDirection: 'row', gap: Spacing.two },
  metricTile: { flex: 1, alignItems: 'center', gap: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  cta: { marginTop: Spacing.two },
});
