import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Colors } from '@/constants/theme';

const ICONS: Record<string, SFSymbol> = {
  index: 'house.fill',
  journal: 'book.fill',
  trends: 'chart.line.uptrend.xyaxis',
  scan: 'camera.fill',
};

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
        },
        tabBarIcon: ({ color, size }) => <SymbolView name={ICONS[route.name]} size={size} tintColor={color} />,
      })}>
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="journal" options={{ title: t('tabs.journal') }} />
      <Tabs.Screen name="trends" options={{ title: t('tabs.trends') }} />
      <Tabs.Screen name="scan" options={{ title: t('tabs.scan') }} />
    </Tabs>
  );
}
