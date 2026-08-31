import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { PillButton } from '@/components/pill-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDayLong } from '@/lib/date';
import { useCheckIns } from '@/lib/checkins-store';

function MetricTile({ value, label }: { value: string | null; label: string }) {
  const theme = useTheme();
  if (value === null) {
    return (
      <View style={[styles.metricTile, styles.metricTileEmpty, { borderColor: theme.borderStrong }]}>
        <ThemedText type="small" themeColor="textTertiary" style={styles.metricEmptyLabel}>
          Ajoute ta première mesure
        </ThemedText>
      </View>
    );
  }
  return (
    <Card style={styles.metricTile}>
      <ThemedText type="displayMedium" style={[styles.metricValue, { color: theme.primary }]}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </Card>
  );
}

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
          <ThemedText type="title">Scan</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Suivi manuel de tes mesures et photos de progression. L&apos;analyse automatique par
            IA arrive dans une prochaine version.
          </ThemedText>

          {latest?.photoUri ? (
            <Image source={{ uri: latest.photoUri }} style={styles.photo} resizeMode="cover" />
          ) : (
            <Pressable
              onPress={() => router.push('/add-scan')}
              style={[styles.photoPlaceholder, { borderColor: theme.borderStrong }]}>
              <Ionicons name="camera" size={32} color={theme.textTertiary} />
              <ThemedText themeColor="textSecondary" style={styles.photoPlaceholderText}>
                Aucune photo — lance ton premier suivi
              </ThemedText>
            </Pressable>
          )}

          <View style={styles.metricsRow}>
            <MetricTile value={leanMass != null ? String(leanMass) : null} label="Masse maigre (kg)" />
            <MetricTile
              value={latest?.bodyFatPct != null ? `${latest.bodyFatPct}%` : null}
              label="Masse grasse"
            />
            <MetricTile value={latest?.waistCm != null ? String(latest.waistCm) : null} label="Taille (cm)" />
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: BottomTabInset + Spacing.lg,
    gap: Spacing.base,
  },
  subtitle: { lineHeight: 20 },
  photo: {
    width: '100%',
    aspectRatio: 1.4,
    borderRadius: Radius.card,
  },
  photoPlaceholder: {
    width: '100%',
    aspectRatio: 1.4,
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  photoPlaceholderText: {
    paddingHorizontal: Spacing.xl,
    textAlign: 'center',
  },
  metricsRow: { flexDirection: 'row', gap: Spacing.sm },
  metricTile: { flex: 1, alignItems: 'center', gap: 4, minHeight: 86, justifyContent: 'center' },
  metricTileEmpty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.xs,
  },
  metricEmptyLabel: { textAlign: 'center' },
  metricValue: { fontSize: 22, lineHeight: 26 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cta: { marginTop: Spacing.sm },
});
