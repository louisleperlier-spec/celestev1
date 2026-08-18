import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { Screen } from '@/ui/components/Screen';

import { CATEGORY_LABEL_KEY, ContentItem } from './content';
import { CATEGORY_IMAGE } from './coach-theme';

interface CoachContentViewProps {
  item: ContentItem;
}

export function CoachContentView({ item }: CoachContentViewProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <SymbolView name="chevron.left" size={16} tintColor={Colors.textSecondary} />
          <Text style={styles.backLabel}>{t('coach.detailBack')}</Text>
        </Pressable>

        <Image source={CATEGORY_IMAGE[item.category]} style={styles.banner} resizeMode="cover" />

        <Text style={styles.category}>{t(CATEGORY_LABEL_KEY[item.category])}</Text>
        <Text style={styles.title}>{t(`coach.content.${item.id}.title`)}</Text>
        <Text style={styles.subtitle}>{t(`coach.content.${item.id}.subtitle`)}</Text>
        <Text style={styles.duration}>{t('coach.detailDuration', { minutes: item.durationMinutes })}</Text>

        <Text style={styles.body}>{t(`coach.content.${item.id}.body`)}</Text>

        <Text style={styles.disclaimer}>{t('coach.disclaimer')}</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.six,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  backLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.footnote,
    fontWeight: '600',
  },
  banner: {
    width: '100%',
    height: 160,
    borderRadius: Radius.lg,
    marginBottom: Spacing.three,
  },
  category: {
    color: Colors.textMuted,
    fontSize: FontSize.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.title2,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
  },
  duration: {
    color: Colors.textMuted,
    fontSize: FontSize.footnote,
    marginTop: Spacing.one,
  },
  body: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    lineHeight: 24,
    marginTop: Spacing.four,
  },
  disclaimer: {
    color: Colors.textMuted,
    fontSize: FontSize.caption,
    marginTop: Spacing.five,
  },
});
