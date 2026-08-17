import React from 'react';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';

import { Colors } from '@/constants/theme';
import { DrinkType } from '@/features/hydration/types';

const DRINK_SYMBOL: Record<DrinkType, SFSymbol> = {
  water: 'drop.fill',
  tea: 'leaf.fill',
  coffee: 'cup.and.saucer.fill',
  juice: 'takeoutbag.and.cup.and.straw.fill',
  soda: 'bubbles.and.sparkles.fill',
  other: 'ellipsis.circle.fill',
};

interface DrinkIconProps {
  type: DrinkType;
  size?: number;
  color?: string;
}

export function DrinkIcon({ type, size = 18, color = Colors.accent }: DrinkIconProps) {
  return <SymbolView name={DRINK_SYMBOL[type]} size={size} tintColor={color} />;
}
