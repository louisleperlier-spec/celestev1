import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Onboarding } from '@/components/onboarding';
import { EntriesProvider } from '@/lib/entries-store';
import { loadJSON, saveJSON, StorageKeys } from '@/lib/storage';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    loadJSON<boolean>(StorageKeys.onboarded, false).then((value) => {
      setOnboarded(value);
      SplashScreen.hideAsync().catch(() => {});
    });
  }, []);

  if (onboarded === null) return null;

  const finishOnboarding = () => {
    saveJSON(StorageKeys.onboarded, true).catch(() => {});
    setOnboarded(true);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <EntriesProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {onboarded ? (
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="add-entry" options={{ presentation: 'modal' }} />
            </Stack>
          ) : (
            <Onboarding onDone={finishOnboarding} />
          )}
        </ThemeProvider>
      </EntriesProvider>
    </GestureHandlerRootView>
  );
}
