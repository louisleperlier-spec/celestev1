import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Colors, FontSize, Fonts, Radius, Spacing } from '@/constants/theme';
import { HydrationEntry } from '@/features/hydration/types';

import { DrinkIcon } from './DrinkIcon';

interface EntryRowProps {
  entry: HydrationEntry;
  onDelete?: () => void;
}

export function EntryRow({ entry, onDelete }: EntryRowProps) {
  const { t } = useTranslation();
  const time = new Date(entry.loggedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const fromHealth = entry.source === 'healthkit';

  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <DrinkIcon type={entry.drinkType} />
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>{t(`drink.${entry.drinkType}`)}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{time}</Text>
          {fromHealth && (
            <View style={styles.healthTag}>
              <SymbolView name="heart.fill" size={10} tintColor={Colors.accent} />
              <Text style={styles.healthTagText}>{t('journal.fromHealth')}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.volume}>{entry.volumeMl} ml</Text>
      {!fromHealth && onDelete && (
        <Pressable onPress={onDelete} hitSlop={12} style={styles.deleteButton}>
          <SymbolView name="trash" size={16} tintColor={Colors.textMuted} />
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
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  meta: {
    color: Colors.textMuted,
    fontSize: FontSize.footnote,
    fontFamily: Fonts.mono,
  },
  healthTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  healthTagText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  volume: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  deleteButton: {
    padding: Spacing.one,
  },
});
