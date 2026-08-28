import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { usePremiumGate } from '@/features/premium/use-premium-gate';
import { useTheme } from '@/features/premium/theme-context';
import { Screen } from '@/ui/components/Screen';

import { loadBookmarks, toggleBookmark } from './bookmarks';
import { CATEGORY_TINT } from './coach-theme';
import { CATEGORY_LABEL_KEY, CATEGORY_TAGS, ContentCategory, ContentItem, ContentTag, contentForCategory } from './content';
import { PhotoCard } from './photo-card';

type Filter = 'all' | 'saved' | ContentTag;

interface CoachListViewProps {
  category: ContentCategory;
}

export function CoachListView({ category }: CoachListViewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { isPremium, guard } = usePremiumGate();

  const [filter, setFilter] = useState<Filter>('all');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  useEffect(() => {
    void loadBookmarks().then(setBookmarks);
  }, []);

  const allItems = useMemo(() => contentForCategory(category), [category]);
  const items = useMemo(() => {
    if (filter === 'all') return allItems;
    if (filter === 'saved') return allItems.filter((item) => bookmarks.includes(item.id));
    return allItems.filter((item) => item.tags.includes(filter));
  }, [allItems, filter, bookmarks]);

  const openContent = (item: ContentItem) => {
    if (item.premium && !isPremium) {
      guard(() => {});
      return;
    }
    router.push({ pathname: '/coach-content', params: { id: item.id } });
  };

  const handleToggleBookmark = (id: string) => {
    void toggleBookmark(id, bookmarks).then(setBookmarks);
  };

  const filters: Filter[] = ['all', ...CATEGORY_TAGS[category], 'saved'];

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <SymbolView name="chevron.left" size={16} tintColor={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>{t(CATEGORY_LABEL_KEY[category])}</Text>
        <View style={styles.backButton} />
      </View>

      {category === 'recovery' && (
        <Pressable onPress={() => guard(() => router.push('/sleep-dashboard'))} style={styles.sleepLink}>
          <SymbolView name="moon.zzz.fill" size={14} tintColor={CATEGORY_TINT.recovery} />
          <Text style={[styles.sleepLinkText, { color: CATEGORY_TINT.recovery }]}>{t('coach.sleep.entryTitle')}</Text>
          {isPremium ? (
            <SymbolView name="chevron.right" size={12} tintColor={CATEGORY_TINT.recovery} />
          ) : (
            <SymbolView name="lock.fill" size={12} tintColor={CATEGORY_TINT.recovery} />
          )}
        </Pressable>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {filters.map((f) => {
          const active = filter === f;
          const label = f === 'all' ? t('coach.filterAll') : f === 'saved' ? t('coach.filterSaved') : t(`coach.tags.${f}`);
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.chip, active && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
              <Text style={[styles.chipText, active && { color: theme.accentText }]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <Text style={styles.empty}>{t('coach.filterEmpty')}</Text>
        ) : (
          items.map((item) => (
            <PhotoCard
              key={item.id}
              item={item}
              variant="full"
              locked={item.premium && !isPremium}
              bookmarked={bookmarks.includes(item.id)}
              onPress={() => openContent(item)}
              onToggleBookmark={() => handleToggleBookmark(item.id)}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.title3,
    fontWeight: '700',
  },
  sleepLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.three,
    alignSelf: 'flex-start',
  },
  sleepLinkText: {
    fontSize: FontSize.footnote,
    fontWeight: '700',
  },
  filterRow: {
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    fontWeight: '600',
  },
  list: {
    gap: Spacing.two,
    paddingBottom: Spacing.six,
  },
  empty: {
    color: Colors.textMuted,
    fontSize: FontSize.footnote,
    textAlign: 'center',
    marginTop: Spacing.five,
  },
});
