import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PillButton } from '@/components/pill-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CATEGORIES, getCategory } from '@/constants/categories';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { todayKey } from '@/lib/date';
import { useEntries } from '@/lib/entries-store';
import type { CategoryId } from '@/lib/types';

export default function AddEntryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { addEntry } = useEntries();
  const params = useLocalSearchParams<{ category?: CategoryId; dateKey?: string }>();

  const [categoryId, setCategoryId] = useState<CategoryId>(params.category ?? 'sleep');
  const [presetId, setPresetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const category = getCategory(categoryId);
  const selectedPreset = category.presets.find((p) => p.id === presetId) ?? null;

  const handleSave = async () => {
    if (!selectedPreset || saving) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await addEntry({
      category: categoryId,
      presetId: selectedPreset.id,
      label: selectedPreset.label,
      points: selectedPreset.points,
      dateKey: params.dateKey ?? todayKey(),
    });
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <Ionicons name="close" size={26} color={theme.text} />
          </Pressable>
          <ThemedText type="smallBold">Ajoute une action</ThemedText>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((c) => {
              const active = c.id === categoryId;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    setCategoryId(c.id);
                    setPresetId(null);
                  }}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: active ? c.color : c.colorLight },
                  ]}>
                  <Ionicons name={c.icon} size={16} color={active ? '#FFFFFF' : c.color} />
                  <ThemedText
                    type="small"
                    style={active ? styles.categoryChipTextActive : { color: c.color }}>
                    {c.shortLabel}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.hero, { backgroundColor: category.colorLight }]}>
            <View style={[styles.heroIcon, { backgroundColor: '#FFFFFFAA' }]}>
              <Ionicons name={category.icon} size={36} color={category.color} />
            </View>
            <ThemedText type="subtitle" style={[styles.heroQuestion, { color: category.color }]}>
              {category.question}
            </ThemedText>
          </View>

          <View style={styles.presets}>
            {category.presets.map((p) => {
              const active = p.id === presetId;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setPresetId(p.id)}
                  style={[
                    styles.presetRow,
                    { borderColor: theme.border },
                    active && { borderColor: category.color, backgroundColor: category.colorLight },
                  ]}>
                  <ThemedText type="smallBold">{p.label}</ThemedText>
                  <View
                    style={[
                      styles.presetPoints,
                      { backgroundColor: active ? category.color : theme.backgroundElement },
                    ]}>
                    <ThemedText
                      type="small"
                      style={active ? styles.categoryChipTextActive : undefined}
                      themeColor={active ? undefined : 'textSecondary'}>
                      +{p.points} pts
                    </ThemedText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <PillButton
          title={selectedPreset ? `Ajouter · +${selectedPreset.points} pts` : 'Choisis une option'}
          onPress={handleSave}
          disabled={!selectedPreset || saving}
          style={styles.cta}
        />
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
    paddingHorizontal: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  content: { gap: Spacing.four, paddingBottom: Spacing.four },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  categoryChipTextActive: { color: '#FFFFFF' },
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
    borderRadius: Radius.large,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroQuestion: {
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
  presets: { gap: Spacing.two },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  presetPoints: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  cta: { marginBottom: Spacing.three },
});
