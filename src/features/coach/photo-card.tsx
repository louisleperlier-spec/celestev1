import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

import { CATEGORY_LABEL_KEY, ContentItem } from './content';
import { CATEGORY_GRADIENT, CATEGORY_TINT } from './coach-theme';

interface PhotoCardProps {
  item: ContentItem;
  locked: boolean;
  bookmarked: boolean;
  onPress: () => void;
  onToggleBookmark: () => void;
  variant?: 'row' | 'full';
}

export function PhotoCard({ item, locked, bookmarked, onPress, onToggleBookmark, variant = 'row' }: PhotoCardProps) {
  const { t } = useTranslation();
  const tint = CATEGORY_TINT[item.category];
  const isFull = variant === 'full';

  return (
    <Pressable onPress={onPress} style={[styles.card, isFull && styles.cardFull]}>
      <LinearGradient
        colors={CATEGORY_GRADIENT[item.category]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.photo, isFull && styles.photoFull]}>
        <View style={styles.photoTopRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{t(CATEGORY_LABEL_KEY[item.category])}</Text>
          </View>
          <Pressable onPress={onToggleBookmark} hitSlop={10} style={styles.bookmarkButton}>
            <SymbolView name={bookmarked ? 'bookmark.fill' : 'bookmark'} size={14} tintColor="#FFFFFF" />
          </Pressable>
        </View>
        <SymbolView name={item.icon} size={isFull ? 40 : 30} tintColor="rgba(255,255,255,0.55)" style={styles.photoIcon} />
        {locked && (
          <View style={styles.lockOverlay}>
            <SymbolView name="lock.fill" size={18} tintColor="#FFFFFF" />
          </View>
        )}
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={isFull ? 1 : 2}>
          {t(`coach.content.${item.id}.title`)}
        </Text>
        {isFull && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {t(`coach.content.${item.id}.subtitle`)}
          </Text>
        )}
        <View style={styles.footer}>
          <Text style={styles.duration}>{t('coach.detailDuration', { minutes: item.durationMinutes })}</Text>
          <View style={[styles.arrowButton, { backgroundColor: tint }]}>
            <SymbolView name="chevron.right" size={12} tintColor="#0A0A0A" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardFull: {
    width: '100%',
    flexDirection: 'row',
    height: 96,
  },
  photo: {
    height: 84,
    padding: Spacing.two,
    justifyContent: 'space-between',
  },
  photoFull: {
    height: '100%',
    width: 110,
  },
  photoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  categoryPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  bookmarkButton: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIcon: {
    alignSelf: 'center',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    padding: Spacing.two,
    gap: 2,
    justifyContent: 'center',
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.footnote,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.caption,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  duration: {
    color: Colors.textMuted,
    fontSize: FontSize.caption,
  },
  arrowButton: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
