// Archétype browse-catalog — écran CATALOGUE : recherche + filtres par catégorie + favoris.
// C'est le « moment magique » : je parcours, je cherche, je filtre, et je marque mes favoris
// d'un cœur qui répond au doigt. Corps réutilisable monté par `app/(tabs)/catalog.tsx`.
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { TextField } from '@/ui/components/text-field';

import { CATEGORIES } from './catalog';
import { type CatalogItem } from './types';
import { useCatalog } from './use-catalog';
import { useFavorites, useToggleFavorite } from './use-favorites';

// Valeur spéciale du filtre « Favoris » (n'est pas une catégorie serveur).
const FAV_FILTER = '__fav__';

export function CatalogView() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const [rawSearch, setRawSearch] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null); // catégorie ou FAV_FILTER

  // Débounce de la recherche : on ne requête pas à chaque frappe (300 ms de calme).
  useEffect(() => {
    const id = setTimeout(() => setSearch(rawSearch), 300);
    return () => clearTimeout(id);
  }, [rawSearch]);

  const favoritesOnly = selected === FAV_FILTER;
  const category = favoritesOnly ? null : selected;
  const { data, isLoading, isError, refetch } = useCatalog({ search, category });
  const { ids: favoriteIds } = useFavorites();
  const toggle = useToggleFavorite();

  // Le filtre « Favoris » se fait côté client (intersection avec mes ids favoris).
  const items = useMemo(() => {
    const list = data ?? [];
    return favoritesOnly ? list.filter((i) => favoriteIds.has(i.id)) : list;
  }, [data, favoritesOnly, favoriteIds]);

  const chips = [
    { id: null as string | null, label: t('catalog.cat.all') },
    ...CATEGORIES.map((c) => ({ id: c.id, label: t(c.labelKey) })),
    { id: FAV_FILTER, label: t('catalog.cat.favorites') },
  ];

  function renderCard({ item }: { item: CatalogItem }) {
    const fav = favoriteIds.has(item.id);
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/catalog/[id]', params: { id: item.id } })}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
          pressed && { opacity: 0.7 },
        ]}>
        <View style={styles.cardText}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {item.title}
          </ThemedText>
          {item.subtitle ? (
            <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
              {item.subtitle}
            </ThemedText>
          ) : null}
        </View>
        <Pressable
          hitSlop={10}
          onPress={() => {
            haptics.tap();
            toggle.mutate({ itemId: item.id, favorite: !fav });
          }}
          accessibilityRole="button"
          accessibilityLabel={t(fav ? 'catalog.unfavorite' : 'catalog.favorite')}>
          <SymbolView name={fav ? 'heart.fill' : 'heart'} size={22} tintColor={fav ? theme.accent : theme.textMuted} />
        </Pressable>
      </Pressable>
    );
  }

  return (
    <View style={styles.flex}>
      <ThemedText type="title" style={styles.title}>
        {t('catalog.title')}
      </ThemedText>

      <TextField
        value={rawSearch}
        onChangeText={setRawSearch}
        placeholder={t('catalog.searchPlaceholder')}
        autoCapitalize="none"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipsRow}>
        {chips.map((chip) => {
          const active = selected === chip.id;
          return (
            <Pressable
              key={chip.id ?? 'all'}
              onPress={() => setSelected(active ? null : chip.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.accent : theme.surface,
                  borderColor: active ? theme.accent : theme.border,
                },
              ]}>
              <ThemedText type="caption" themeColor="text" style={active && styles.chipActiveText}>
                {chip.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

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
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderCard}
          ListEmptyComponent={
            <View style={styles.center}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                {favoritesOnly ? t('catalog.emptyFavorites') : t('catalog.empty')}
              </ThemedText>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={10}
          windowSize={7}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { marginTop: Spacing.three, marginBottom: Spacing.three },
  chipsRow: { flexGrow: 0, marginTop: Spacing.three, marginBottom: Spacing.two },
  chips: { gap: Spacing.two, paddingRight: Spacing.four },
  chip: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  chipActiveText: { color: '#fff' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    minHeight: 64,
  },
  cardText: { flex: 1, gap: 2 },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingTop: Spacing.six },
  empty: { textAlign: 'center', maxWidth: 260 },
  listContent: { paddingBottom: Spacing.six, flexGrow: 1 },
});
