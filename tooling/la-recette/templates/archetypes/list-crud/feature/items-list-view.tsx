// Archétype list-crud — écran LISTE (le cœur de l'archétype).
// Corps réutilisable (pas une route) : monté par `app/(tabs)/items.tsx`.
// États gérés : chargement / erreur (avec retry) / vide / liste. Aucun écran blanc.
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';

import { type Item } from './types';
import { useItems, useUpdateItem } from './use-items';

export function ItemsListView() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { data: items, isLoading, isError, refetch } = useItems();
  const update = useUpdateItem();

  function renderRow({ item }: { item: Item }) {
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.5 }]}>
        {/* La coche « fait / pas fait » — exemple d'action rapide optimiste. ADAPTER
            ou retirer selon ton entité (une recette n'a pas de « done »). */}
        <Pressable
          hitSlop={10}
          onPress={() => {
            haptics.tap();
            update.mutate({ id: item.id, fields: { done: !item.done } });
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.done }}>
          <SymbolView
            name={item.done ? 'checkmark.circle.fill' : 'circle'}
            size={24}
            tintColor={item.done ? theme.accent : theme.textMuted}
          />
        </Pressable>
        <ThemedText
          type="smallBold"
          themeColor={item.done ? 'textMuted' : 'text'}
          style={styles.rowLabel}
          numberOfLines={1}>
          {item.title}
        </ThemedText>
        <SymbolView name="chevron.right" size={13} tintColor={theme.textMuted} />
      </Pressable>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <ThemedText type="title" numberOfLines={1} style={styles.flex}>
          {t('items.title')}
        </ThemedText>
        <Pressable
          hitSlop={10}
          onPress={() => router.push('/item/new')}
          accessibilityRole="button"
          accessibilityLabel={t('items.new')}>
          <SymbolView name="plus.circle.fill" size={30} tintColor={theme.accent} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : isError ? (
        <Pressable onPress={() => refetch()} style={styles.center} accessibilityRole="button">
          <ThemedText type="small" themeColor="danger">
            {t('common.loadError')}
          </ThemedText>
          <ThemedText type="smallBold" themeColor="accent">
            {t('common.retry')}
          </ThemedText>
        </Pressable>
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={(i) => i.id}
          renderItem={renderRow}
          ItemSeparatorComponent={() => (
            <View style={[styles.sep, { backgroundColor: theme.border }]} />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                {t('items.empty')}
              </ThemedText>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={12}
          windowSize={7}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    minHeight: 56,
  },
  rowLabel: { flex: 1 },
  sep: { height: StyleSheet.hairlineWidth },
  center: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.six,
  },
  empty: { textAlign: 'center', maxWidth: 260 },
  listContent: { paddingBottom: Spacing.six, flexGrow: 1 },
});
