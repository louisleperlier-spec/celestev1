# Céleste — app iOS de bien-être spirituel

App Expo Router (TypeScript) : méditations (respiration guidée), heures miroir, carte du jour,
journal, phases de la lune. Design "ciel nocturne contemplatif" (voir DESIGN.md).

## SDK Expo — PINNÉ sur 57

Scaffoldé avec `create-expo-app@latest` le 26/08/2026 → **SDK 57**. Ne JAMAIS upgrader sans raison
explicite : l'app Expo Go de l'utilisateur doit supporter ce SDK pour tester en développement. Avant
tout changement de SDK, vérifier la version d'Expo Go de l'utilisateur (Réglages → à propos) et croiser
avec https://docs.expo.dev/versions/latest/.

## Architecture

```
src/
  app/         # routes expo-router — (tabs)/ + profil, paywall, meditation/[id] (fines, peu de logique)
  features/    # logique + vues par domaine (home, journal, meditate, moon, mirror-hours, profile, paywall)
  ui/          # design system : components/ (Button, Card, FrostCard, Screen, IconSymbol, NightSkyBackdrop)
  components/  # primitives héritées du scaffold Expo (ThemedText, ThemedView, ExternalLink)
  lib/         # logique pure sans UI (moon.ts, mirror-hours.ts, daily-card.ts, breathing.ts, storage.ts)
  constants/   # theme.ts — SOURCE UNIQUE des couleurs/espacements/typo
```

## Design system

Un seul fichier : `src/constants/theme.ts`. Aucune couleur en dur dans un composant — toujours
`useTheme()` (clair/sombre auto). Voir `DESIGN.md` pour l'intention visuelle complète.

## État actuel — ce qui est réel vs ce qui reste à brancher

**Fonctionne déjà, sans backend (100% local, hors-ligne)** :
- Respiration guidée (3 techniques, animation + minuteur réels)
- Phase de lune (calcul astronomique local, précis)
- Heures miroir (calcul + liste complète)
- Carte du jour (tirage déterministe par date)
- Journal (AsyncStorage — persiste sur l'appareil)

**Volontairement non branché pour l'instant** (voir conversation produit — étape reportée) :
- Comptes utilisateurs / sync multi-appareil (Supabase)
- Abonnement réel (RevenueCat + StoreKit) — l'écran Paywall existe, le bouton explique honnêtement
  que le paiement n'est pas encore actif
- Icône et écran de lancement définitifs (assets par défaut Expo pour l'instant)
- Build EAS / soumission App Store (nécessite un compte Apple Developer)

Ne jamais faire semblant qu'une de ces briques existe : si on la mentionne à l'utilisateur, dire
explicitement qu'elle n'est pas encore branchée.

## Vérif obligatoire après toute modification

```bash
npx tsc --noEmit -p tsconfig.json
npx expo export --platform ios
```

## Le dossier tooling/

`tooling/la-recette/` est un kit Claude Code (skills, commandes) fourni par le propriétaire de l'app
pour construire/maintenir ce type d'app. Il est exclu de la compilation (`tsconfig.json` → `exclude`)
et n'est pas embarqué dans le bundle de l'app — c'est un outil de développement, pas du code applicatif.
