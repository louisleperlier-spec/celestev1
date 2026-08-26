// Archétype list-crud — écran CRÉATION d'un item.
// Corps réutilisable : monté par `app/item/new.tsx` (présenté en modal). Sur succès,
// revient à la liste — le nouvel item y apparaît (invalidation du cache dans le hook).
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { Button } from '@/ui/components/button';
import { TextField } from '@/ui/components/text-field';

import { useCreateItem } from './use-items';

export function ItemFormView() {
  const { t } = useTranslation();
  const router = useRouter();
  const create = useCreateItem();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  async function submit() {
    if (!title.trim()) return;
    await create.mutateAsync({ title: title.trim(), note: note.trim() || null });
    router.back();
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
        autoFocus
      />
      <TextField
        label={t('items.fieldNote')}
        value={note}
        onChangeText={setNote}
        placeholder={t('items.fieldNotePlaceholder')}
        multiline
      />
      <Button
        label={t('items.create')}
        onPress={submit}
        loading={create.isPending}
        disabled={!title.trim()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.six },
});
