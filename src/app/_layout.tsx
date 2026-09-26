import { useFonts } from '@expo-google-fonts/inter';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useSyncExternalStore } from 'react';

import { ToastHost } from '@/components/ui';
import { NotifBanniere } from '@/components/app/NotifBanniere';
import { demarrerCompte } from '@/store/compte';
import { demarrerNotifs } from '@/store/notifs';
import { useProfil } from '@/store/profil';
import { colors, fontAssets } from '@/theme';

SplashScreen.preventAutoHideAsync();
demarrerCompte();
demarrerNotifs();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.pink,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

/** L'état sauvegardé sur l'appareil est-il chargé ? */
function useHydrated() {
  return useSyncExternalStore(useProfil.persist.onFinishHydration, useProfil.persist.hasHydrated);
}

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);
  const hydrated = useHydrated();
  const ready = (loaded || !!error) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }} />
      <NotifBanniere />
      <ToastHost />
    </ThemeProvider>
  );
}
