// Archétype browse-catalog — écran DÉTAIL d'une fiche : titre, catégorie, tags, description,
// et le bouton favori. Corps réutilisable monté par `app/catalog/[id].tsx`.
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/ui/components/button';

import { useCatalogItem } from './use-catalog';
import { useFavorites, useToggleFavorite } from './use-favorites';

export function CatalogDetailView({ id }: { id: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: item, isLoading } = useCatalogItem(id);
  const { ids } = useFavorites();
  const toggle = useToggleFavorite();

  if (isLoading && !item) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }
  if (!item) {
    return (
      <View style={styles.center}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('catalog.notFound')}
        </ThemedText>
      </View>
    );
  }

  const fav = ids.has(item.id);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ThemedText type="title" numberOfLines={3}>
        {item.title}
      </ThemedText>
      {item.subtitle ? (
        <ThemedText type="small" themeColor="textSecondary">
          {item.subtitle}
        </ThemedText>
      ) : null}

      {item.tags.length > 0 ? (
        <View style={styles.tags}>
          {item.tags.map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: theme.accentSoft }]}>
              <ThemedText type="caption" themeColor="accent">
                {tag}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : null}

      {item.description ? (
        <ThemedText type="default" themeColor="text" style={styles.description}>
          {item.description}
        </ThemedText>
      ) : null}

      <Button
        label={fav ? t('catalog.unfavorite') : t('catalog.favorite')}
        variant={fav ? 'secondary' : 'primary'}
        onPress={() => toggle.mutate({ itemId: item.id, favorite: !fav })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.three, paddingTop: Spacing.four, paddingBottom: Spacing.six },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
  tag: { borderRadius: Radius.full, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
  description: { lineHeight: 24, marginTop: Spacing.two },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
});
