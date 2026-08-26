// Archétype list-crud — écran DÉTAIL / édition d'un item.
// Corps réutilisable : monté par `app/item/[id].tsx`. Édite les champs et enregistre
// (mise à jour optimiste), ou supprime (avec confirmation).
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { Button } from '@/ui/components/button';
import { TextField } from '@/ui/components/text-field';

import { useDeleteItem, useItem, useUpdateItem } from './use-items';

export function ItemDetailView({ id, onBack }: { id: string; onBack: () => void }) {
  const { t } = useTranslation();
  const { data: item, isLoading } = useItem(id);
  const update = useUpdateItem();
  const remove = useDeleteItem();

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setNote(item.note ?? '');
    }
  }, [item]);

  if (isLoading && !item) {
    return (
      <View style={styles.center}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('common.loading')}
        </ThemedText>
      </View>
    );
  }
  if (!item) {
    return (
      <View style={styles.center}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('items.notFound')}
        </ThemedText>
        <Button label={t('common.back')} variant="ghost" onPress={onBack} />
      </View>
    );
  }

  function save() {
    update.mutate({ id, fields: { title: title.trim(), note: note.trim() || null } });
    onBack();
  }

  function confirmDelete() {
    Alert.alert(t('items.deleteConfirm'), undefined, [
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
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <TextField
        label={t('items.fieldTitle')}
        value={title}
        onChangeText={setTitle}
        placeholder={t('items.fieldTitlePlaceholder')}
      />
      <TextField
        label={t('items.fieldNote')}
        value={note}
        onChangeText={setNote}
        placeholder={t('items.fieldNotePlaceholder')}
        multiline
      />
      <Button label={t('common.save')} onPress={save} disabled={!title.trim()} />
      <Button label={t('common.delete')} variant="ghost" onPress={confirmDelete} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.six },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
});
