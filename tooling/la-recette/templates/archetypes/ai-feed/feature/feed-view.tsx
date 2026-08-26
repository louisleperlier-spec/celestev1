// Archétype ai-feed — écran FEED : la galerie des créations gardées, avec un bouton +
// pour en composer une nouvelle. Corps réutilisable monté par `app/(tabs)/feed.tsx`.
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';

import { type Creation } from './types';
import { useCreations, useToggleFavorite } from './use-creations';

export function FeedView() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useCreations();
  const favorite = useToggleFavorite();

  function renderCard({ item }: { item: Creation }) {
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/creation/[id]', params: { id: item.id } })}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
          pressed && { opacity: 0.7 },
        ]}>
        <ThemedText type="caption" themeColor="textMuted" numberOfLines={1}>
          {item.prompt}
        </ThemedText>
        <ThemedText type="small" themeColor="text" numberOfLines={4} style={styles.result}>
          {item.result}
        </ThemedText>
        <View style={styles.cardFooter}>
          <Pressable
            hitSlop={10}
            onPress={() => {
              haptics.tap();
              favorite.mutate({ id: item.id, favorite: !item.favorite });
            }}
            accessibilityRole="button"
            accessibilityLabel={t('feed.favorite')}>
            <SymbolView
              name={item.favorite ? 'heart.fill' : 'heart'}
              size={18}
              tintColor={item.favorite ? theme.accent : theme.textMuted}
            />
          </Pressable>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <ThemedText type="title" numberOfLines={1} style={styles.flex}>
          {t('feed.title')}
        </ThemedText>
        <Pressable
          hitSlop={10}
          onPress={() => router.push('/creation/new')}
          accessibilityRole="button"
          accessibilityLabel={t('feed.new')}>
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
          data={data ?? []}
          keyExtractor={(c) => c.id}
          renderItem={renderCard}
          ListEmptyComponent={
            <View style={styles.center}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                {t('feed.empty')}
              </ThemedText>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={8}
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
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  result: { lineHeight: 21 },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: Spacing.one },
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
