import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useSyncExternalStore } from 'react';

import { ToastHost } from '@/components/ui';
import { FeteHost } from '@/components/app/Fete';
import { NotifBanniere } from '@/components/app/NotifBanniere';
import { demarrerCompte } from '@/store/compte';
import { demarrerNotifs } from '@/store/notifs';
import { useProfil } from '@/store/profil';
import { demarrerAchats } from '@/store/achats';
import { demarrerAlertes } from '@/store/alertes';
import { demarrerMajs } from '@/store/majs';
import { demarrerJeu } from '@/store/jeu';
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
    // NÉA Plus : vrais achats App Store (RevenueCat) quand la clé est fournie.
    demarrerAchats();
    // Cartes récompense, records, défis de la semaine, niveaux : récompenses et fêtes.
    demarrerJeu();
    // Mises à jour à distance appliquées tout de suite (relance de l'app).
    demarrerMajs();
  }, [ready]);

  if (!ready) return null;

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="light" />
      {/*
        Transitions natives d'iOS (fil d'interface, 120 Hz) : les pages de détail glissent depuis la droite avec l'effet de
        profondeur et se ferment d'un glissement depuis n'importe où ; les activités et l'achat montent depuis le bas ;
        l'accueil, l'onboarding et les onglets se fondent.
      */}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'ios_from_right', fullScreenGestureEnabled: true }}>
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="bienvenue" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="seance-en-cours" options={{ animation: 'fade_from_bottom', fullScreenGestureEnabled: false }} />
        <Stack.Screen name="randonnee/en-cours" options={{ animation: 'fade_from_bottom', fullScreenGestureEnabled: false }} />
        <Stack.Screen name="randonnee/recap" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="activite" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="cartes/ouvrir" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="plus" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="chat" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ajouter" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
      <NotifBanniere />
      <FeteHost />
      <ToastHost />
    </ThemeProvider>
  );
}
