import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PillButton } from '@/components/pill-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMission } from '@/constants/missions';
import { MaxContentWidth, Radius, Spacing, withAlpha } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';
import { useCheckIns } from '@/lib/checkins-store';
import type { CheckInStatus } from '@/lib/types';

const OPTIONS: { status: CheckInStatus; label: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap }[] = [
  { status: 'missed', label: 'Manquée', icon: 'close' },
  { status: 'partial', label: 'Partielle', icon: 'remove' },
  { status: 'done', label: 'Terminée', icon: 'checkmark' },
];

export default function CheckInScreen() {
  const theme = useTheme();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { addCheckIn } = useCheckIns();
  const params = useLocalSearchParams<{ missionId: string }>();
  const mission = getMission(params.missionId);

  const [status, setStatus] = useState<CheckInStatus | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [pulse] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!status || reducedMotion) return;
    pulse.setValue(0.82);
    Animated.spring(pulse, { toValue: 1, useNativeDriver: true, friction: 5, tension: 140 }).start();
  }, [status, reducedMotion, pulse]);

  const statusColor = (s: CheckInStatus) =>
    s === 'done' ? theme.success : s === 'partial' ? theme.warning : theme.danger;

  const handleValidate = async () => {
    if (!status || saving) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await addCheckIn({ missionId: mission.id, pillar: mission.pillar, status, note: note.trim() || undefined });
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <Ionicons name="close" size={26} color={theme.text} />
          </Pressable>
          <ThemedText type="smallBold">Check-in</ThemedText>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.body}>
          <ThemedText style={styles.question}>Comment s&apos;est passée ta mission ?</ThemedText>

          <View style={styles.missionBlock}>
            <View style={[styles.missionIcon, { backgroundColor: withAlpha(theme.primary, 0.12) }]}>
              <Ionicons name={mission.icon} size={36} color={theme.primary} />
            </View>
            <ThemedText type="subtitle">{mission.title}</ThemedText>
            <ThemedText themeColor="textSecondary">{mission.subtitle}</ThemedText>
          </View>

          <View style={styles.options}>
            {OPTIONS.map((o) => {
              const active = status === o.status;
              const color = statusColor(o.status);
              return (
                <Pressable
                  key={o.status}
                  onPress={() => setStatus(o.status)}
                  style={[
                    styles.optionBtn,
                    { borderColor: theme.border },
                    active && { borderColor: color, backgroundColor: withAlpha(color, 0.14) },
                  ]}>
                  <Animated.View style={active ? { transform: [{ scale: pulse }] } : undefined}>
                    <Ionicons name={o.icon} size={22} color={active ? color : theme.textSecondary} />
                  </Animated.View>
                  <ThemedText
                    type="small"
                    style={active ? { color, fontWeight: '700' } : undefined}
                    themeColor={active ? undefined : 'textSecondary'}>
                    {o.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.notesBlock}>
            <ThemedText type="sectionLabel">Notes (optionnel)</ThemedText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Écris quelque chose…"
              placeholderTextColor={theme.textTertiary}
              multiline
              style={[
                styles.notesInput,
                { backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border },
              ]}
            />
          </View>

          <PillButton
            title="Valider"
            onPress={handleValidate}
            disabled={!status || saving}
            style={styles.cta}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  body: { alignItems: 'center', gap: Spacing.lg, paddingTop: Spacing.base },
  question: { fontSize: 18, textAlign: 'center' },
  missionBlock: { alignItems: 'center', gap: Spacing.xs },
  missionIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  options: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignSelf: 'stretch',
  },
  optionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: Radius.button,
    paddingVertical: Spacing.base,
  },
  notesBlock: { alignSelf: 'stretch', gap: Spacing.sm },
  notesInput: {
    borderWidth: 1,
    borderRadius: Radius.button,
    padding: Spacing.base,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  cta: { alignSelf: 'stretch' },
});
