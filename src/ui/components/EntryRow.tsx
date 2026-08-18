import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { FontSize, Fonts, Radius, Spacing } from '@/constants/theme';
import { HydrationEntry } from '@/features/hydration/types';
import { useTheme } from '@/features/premium/theme-context';

import { DrinkIcon } from './DrinkIcon';

interface EntryRowProps {
  entry: HydrationEntry;
  onDelete?: () => void;
}

export function EntryRow({ entry, onDelete }: EntryRowProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const time = new Date(entry.loggedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const fromHealth = entry.source === 'healthkit';
  const label = entry.drinkType === 'custom' ? entry.customDrinkName ?? t('drink.other') : t(`drink.${entry.drinkType}`);

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: theme.accentSoft }]}>
        <DrinkIcon type={entry.drinkType} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: theme.textMuted }]}>{time}</Text>
          {fromHealth && (
            <View style={styles.healthTag}>
              <SymbolView name="heart.fill" size={10} tintColor={theme.accent} />
              <Text style={[styles.healthTagText, { color: theme.textMuted }]}>{t('journal.fromHealth')}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={[styles.volume, { color: theme.text }]}>{entry.volumeMl} ml</Text>
      {!fromHealth && onDelete && (
        <Pressable onPress={onDelete} hitSlop={12} style={styles.deleteButton}>
          <SymbolView name="trash" size={16} tintColor={theme.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    gap: Spacing.three,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  meta: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.mono,
  },
  healthTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  healthTagText: {
    fontSize: 11,
  },
  volume: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  deleteButton: {
    padding: Spacing.one,
  },
});
