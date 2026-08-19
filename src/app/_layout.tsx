import '@/lib/i18n';

import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '@/constants/theme';
import { HydrationProvider } from '@/features/hydration/hydration-context';
import { shouldShowOnboarding } from '@/features/onboarding/onboarding-storage';
import { PremiumProvider } from '@/features/premium/premium-context';
import { ThemeProvider } from '@/features/premium/theme-context';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const router = useRouter();
  const [bootReady, setBootReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    (async () => {
      setNeedsOnboarding(await shouldShowOnboarding());
      setBootReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!bootReady) return;
    if (needsOnboarding) router.replace('/onboarding');
    void SplashScreen.hideAsync();
    // Ne redirige qu'une fois, au premier rendu où le boot est prêt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ThemeProvider>
        <PremiumProvider>
          <HydrationProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
              <Stack.Screen name="add-entry" options={{ presentation: 'modal' }} />
              <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
              <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
              <Stack.Screen name="coach-content" options={{ presentation: 'modal' }} />
              <Stack.Screen name="coach-list" options={{ presentation: 'modal' }} />
              <Stack.Screen name="sleep-dashboard" options={{ presentation: 'modal' }} />
              <Stack.Screen name="score-info" options={{ presentation: 'modal' }} />
            </Stack>
          </HydrationProvider>
        </PremiumProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
