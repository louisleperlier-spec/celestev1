import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useSyncExternalStore } from 'react';

import { ToastHost } from '@/components/ui';
import { NotifBanniere } from '@/components/app/NotifBanniere';
import { demarrerCompte } from '@/store/compte';
import { demarrerNotifs } from '@/store/notifs';
import { useProfil } from '@/store/profil';
import { demarrerAlertes } from '@/store/alertes';
import { demarrerLiaisonMontre } from '@/store/liaisonMontre';
import { demarrerSante } from '@/store/sante';
// Territoires : envoie les cases gardées hors ligne dès la connexion au compte.
import '@/store/territoires';
import { colors } from '@/theme';

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
  const ready = useHydrated();

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync();
    // Apple Santé : la nuit de la montre, une fois l'état de l'appareil chargé.
    demarrerSante();
    // Apple Watch : séances de la semaine vers la montre, séances terminées vers l'iPhone.
    demarrerLiaisonMontre();
    // Alertes santé de l'iPhone (VFC, eau, vélo, pas), posées même app fermée.
    demarrerAlertes();
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
