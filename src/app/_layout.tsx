import '@/lib/i18n';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '@/constants/theme';
import { HydrationProvider } from '@/features/hydration/hydration-context';
import { PremiumProvider } from '@/features/premium/premium-context';
import { ThemeProvider } from '@/features/premium/theme-context';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ThemeProvider>
        <PremiumProvider>
          <HydrationProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="add-entry" options={{ presentation: 'modal' }} />
              <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
              <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
              <Stack.Screen name="coach-content" options={{ presentation: 'modal' }} />
              <Stack.Screen name="coach-list" options={{ presentation: 'modal' }} />
              <Stack.Screen name="score-info" options={{ presentation: 'modal' }} />
            </Stack>
          </HydrationProvider>
        </PremiumProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
