import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/ui/components/button';
import { Card } from '@/ui/components/card';
import { IconSymbol } from '@/ui/components/icon-symbol';
import { Screen } from '@/ui/components/screen';
import { SectionLabel } from '@/ui/components/section-label';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addJournalEntry, addPoints, deleteJournalEntry, getJournalEntries, type JournalEntry } from '@/lib/storage';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

export function JournalView() {
  const theme = useTheme();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [joy, setJoy] = useState('');
  const [intention, setIntention] = useState('');

  const reload = useCallback(() => {
    getJournalEntries().then(setEntries);
  }, []);

  useFocusEffect(reload);

  async function save() {
    if (!joy.trim() && !intention.trim()) return;
    const updated = await addJournalEntry({ joy: joy.trim(), intention: intention.trim() });
    setEntries(updated);
    setJoy('');
    setIntention('');
    addPoints(1);
  }

  async function remove(id: string) {
    setEntries(await deleteJournalEntry(id));
  }

  return (
    <Screen>
      <ThemedText type="heading" style={{ marginTop: Spacing.three }}>
        Journal
      </ThemedText>
      <ThemedText themeColor="textSecondary">Note tes petites joies et tes intentions du jour.</ThemedText>

      <Card style={{ gap: Spacing.two }}>
        <SectionLabel>Quelle petite joie as-tu attrapée aujourd'hui ?</SectionLabel>
        <TextInput
          value={joy}
          onChangeText={setJoy}
          placeholder="Écris ici…"
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          multiline
        />
        <SectionLabel>Une intention pour demain ?</SectionLabel>
        <TextInput
          value={intention}
          onChangeText={setIntention}
          placeholder="Écris ici… (optionnel)"
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          multiline
        />
        <Button label="Enregistrer" onPress={save} disabled={!joy.trim() && !intention.trim()} />
      </Card>

      {entries.length > 0 && <SectionLabel>Tes entrées</SectionLabel>}
      <View style={{ gap: Spacing.two }}>
        {entries.map((entry) => (
          <Card key={entry.id}>
            <View style={styles.entryHeader}>
              <ThemedText type="smallBold" themeColor="textMuted">
                {formatDate(entry.date)}
              </ThemedText>
              <Pressable onPress={() => remove(entry.id)} hitSlop={8}>
                <IconSymbol name="trash" size={16} color={theme.textMuted} />
              </Pressable>
            </View>
            {!!entry.joy && <ThemedText style={{ marginTop: Spacing.one }}>✦ {entry.joy}</ThemedText>}
            {!!entry.intention && (
              <ThemedText themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
                ➳ {entry.intention}
              </ThemedText>
            )}
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    padding: Spacing.two,
    minHeight: 44,
    fontSize: 16,
  },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
