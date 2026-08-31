import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { CategoryMeta } from '@/constants/categories';
import { Radius, Spacing } from '@/constants/theme';

type Props = {
  category: CategoryMeta;
  points: number;
  onPress: () => void;
};

export function QuickAddTile({ category, points, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: category.colorLight, opacity: pressed ? 0.8 : 1 },
      ]}>
      <Ionicons name={category.icon} size={22} color={category.color} />
      <ThemedText type="smallBold" style={{ color: category.color }}>
        {category.shortLabel}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {points}/20 aujourd’hui
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: '31%',
    flexGrow: 1,
    borderRadius: Radius.medium,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    gap: 4,
  },
});
