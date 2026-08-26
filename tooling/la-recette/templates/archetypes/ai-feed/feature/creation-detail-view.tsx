// Archétype ai-feed — écran DÉTAIL d'une création : demande + résultat complet, favori,
// suppression. Corps réutilisable monté par `app/creation/[id].tsx`.
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { Button } from '@/ui/components/button';

import { useCreation, useDeleteCreation, useToggleFavorite } from './use-creations';

export function CreationDetailView({ id, onBack }: { id: string; onBack: () => void }) {
  const { t } = useTranslation();
  const { data: creation, isLoading } = useCreation(id);
  const favorite = useToggleFavorite();
  const remove = useDeleteCreation();

  if (isLoading && !creation) {
    return (
      <ThemedText type="small" themeColor="textSecondary" style={styles.pad}>
        {t('common.loading')}
      </ThemedText>
    );
  }
  if (!creation) {
    return (
      <ThemedText type="small" themeColor="textSecondary" style={styles.pad}>
        {t('feed.notFound')}
      </ThemedText>
    );
  }

  function confirmDelete() {
    Alert.alert(t('feed.deleteConfirm'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          remove.mutate(id);
          onBack();
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ThemedText type="caption" themeColor="textMuted">
        {creation.prompt}
      </ThemedText>
      <ThemedText type="default" themeColor="text" style={styles.result}>
        {creation.result}
      </ThemedText>
      <Button
        label={creation.favorite ? t('feed.unfavorite') : t('feed.favorite')}
        variant="secondary"
        onPress={() => favorite.mutate({ id, favorite: !creation.favorite })}
      />
      <Button label={t('common.delete')} variant="ghost" onPress={confirmDelete} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.six },
  result: { lineHeight: 26 },
  pad: { padding: Spacing.four },
});
