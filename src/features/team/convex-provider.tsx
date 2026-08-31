import { ConvexProvider, ConvexReactClient } from 'convex/react';
import React from 'react';

/**
 * Client Convex pour la fonctionnalité Équipe (comptes liés à l'appareil, classement). Sans
 * `EXPO_PUBLIC_CONVEX_URL` configuré (pas de build natif avec `.env` rempli), le client n'est pas
 * créé et `useTeam()` (team-context.tsx) reste en mode dégradé — l'onglet Équipe affiche un état
 * "indisponible" plutôt que de planter, comme HealthKit/RevenueCat ailleurs dans l'app.
 */

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

export const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function AppConvexProvider({ children }: { children: React.ReactNode }) {
  if (!convexClient) return <>{children}</>;
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}
