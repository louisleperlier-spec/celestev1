// Archétype ai-feed — écran de COMPOSITION : l'utilisateur écrit une demande, l'IA génère,
// le résultat est gardé et on revient au feed. C'est le « moment magique » de l'archétype.
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { Button } from '@/ui/components/button';
import { TextField } from '@/ui/components/text-field';

import { useGenerate } from './use-generate';

export function GenerateView() {
  const { t } = useTranslation();
  const router = useRouter();
  const { run, loading, error } = useGenerate();
  const [prompt, setPrompt] = useState('');

  async function submit() {
    if (prompt.trim().length < 3) return;
    const language = i18n.language === 'fr' ? 'fr' : 'en';
    const ok = await run({ prompt: prompt.trim(), language });
    if (ok) router.back();
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <ThemedText type="subtitle">{t('feed.composeTitle')}</ThemedText>
      <TextField
        value={prompt}
        onChangeText={setPrompt}
        placeholder={t('feed.promptPlaceholder')}
        multiline
        autoFocus
        style={styles.input}
      />
      {error ? (
        <ThemedText type="small" themeColor="danger">
          {t('feed.errorGeneric')}
        </ThemedText>
      ) : null}
      <Button
        label={t('feed.generate')}
        onPress={submit}
        loading={loading}
        disabled={prompt.trim().length < 3}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.six },
  input: { minHeight: 120, textAlignVertical: 'top' },
});
