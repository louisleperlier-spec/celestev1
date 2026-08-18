# Lume — repères pour toute IA qui travaille sur ce repo

**Lume** est une app iOS de suivi d'hydratation : fond noir, accent vert, notes A/B/C par
métrique + une note globale /100, 3 écrans (Accueil, Journal, Tendances), synchro Apple Santé.

## SDK Expo pinné

- **SDK 54** (`expo@^54.0.0`). Ne JAMAIS upgrader sans raison explicite — Expo Go plafonne
  souvent une version en retard. Si l'app ne s'ouvre pas sur Expo Go du client, vérifier
  d'abord la version d'Expo Go de son téléphone avant de toucher au SDK.
- Aligner toute lib Expo avec `npx expo install <pkg>`, jamais `npm install` seul (mauvaise
  version).

## HealthKit = build natif obligatoire

- `@kingstinct/react-native-healthkit` est un module natif (Nitro). **Il ne fonctionne PAS
  dans Expo Go.** Pour tester la synchro Apple Santé il faut un **dev client** (`npx expo
  prebuild` + build iOS via EAS ou Xcode) — voir skill `expo-dev-client` / `eas-app-stores`.
- Tout le reste de l'app (saisie manuelle, journal, tendances) fonctionne en Expo Go ; seule
  la lecture/écriture Apple Santé se dégrade en no-op silencieux hors build natif
  (`src/services/health/healthkit.ts`, guardé par `isHealthKitSupported()`).

## Architecture

```
src/
  app/            routes expo-router — (tabs)/ (Accueil, Journal, Tendances) + add-entry, settings, paywall (modales)
  features/
    hydration/    cœur métier : types, scoring, storage, contexte React, boissons personnalisées, objectif adaptatif
    reminders/    rappels quotidiens locaux (expo-notifications, aucun backend)
    premium/      RevenueCat (purchases.ts, contexte usePremium), thèmes d'accent, écran paywall
  services/       accès externe : health/ (HealthKit)
  ui/components/  design system (Screen, Card, Button, ScoreRing, GradeBadge, MetricCard, EntryRow, BarChart…)
  lib/            i18n, date/id helpers
  constants/      theme.ts — SOURCE de vérité du fond noir + tokens invariants (texte, notes A/B/C…)
```

Routes minces : le corps de chaque écran vit dans `src/features/hydration/*-view.tsx` (ou
`premium/paywall-view.tsx`).

## Design

- **Mono-surface, volontairement** : fond noir, un seul accent affiché à la fois — c'est
  l'identité de marque, pas un oubli. `src/constants/theme.ts` reste la source des tokens
  invariants (texte, surfaces, notes A/B/C) ; **l'accent seul varie** selon le thème choisi
  (premium), via `useTheme()` (`src/features/premium/theme-context.tsx`), jamais `Colors.accent*`
  en dur. Toute couleur passe par un token, jamais en dur dans un composant.
- Les couleurs A/B/C (`gradeA/B/C`) restent fixes quel que soit le thème — le vert de succès
  ne doit jamais changer de sens.
- SF Symbols (`expo-symbols`) partout, jamais d'emoji dans l'UI.
- **Exception scoped au Coach** (`src/features/coach/coach-theme.ts`) : les cartes recommandées
  (recette/activité/récupération) ont une couleur par catégorie + une illustration
  (`assets/coach/*.jpg`, fournies par l'utilisateur, pas de la photo de stock) au lieu du
  mono-accent strict. C'est une dérogation volontaire et délimitée, décidée pour ce tab
  uniquement ; le reste de l'app (Accueil, Journal, Tendances, Réglages, Paywall) reste
  mono-accent. Ne pas réutiliser `CATEGORY_TINT`/`CATEGORY_IMAGE`/`HYDRATION_IMAGE`/
  `STREAK_COLOR` en dehors de `src/features/coach/`.

## Premium (RevenueCat)

- `react-native-purchases` est un module natif : **ne fonctionne pas dans Expo Go** (comme
  HealthKit). Chargé en lazy/try-catch (`src/features/premium/purchases.ts`), no-op sans
  `EXPO_PUBLIC_REVENUECAT_API_KEY` ni build natif — `usePremium().isPremium` reste `false`.
- Entitlement unique : `"premium"`. Verrouillé derrière : historique > 7 jours + Tendances 30
  jours, plusieurs rappels, objectif adaptatif, boissons personnalisées, thèmes non-défaut.
- Geste standard pour verrouiller un bouton : `usePremiumGate().guard(action)` — exécute
  `action` si premium, sinon ouvre `/paywall`.
- Paywall (`src/features/premium/paywall-view.tsx`) : prix réels via l'offering RevenueCat
  quand disponible, sinon repli statique (`paywall.monthlyPriceFallback`/`annualPriceFallback`
  dans les locales) — à garder alignés sur les prix réels une fois les produits créés sur
  App Store Connect + RevenueCat.

## Coach IA (Gemini)

- Le Coach (`src/features/coach/`) décide TOUJOURS des recommandations via un moteur de règles
  déterministe (`rules-engine.ts`) — l'IA ne fait que reformuler le "pourquoi" en langage naturel,
  jamais le choix. Voir `ai-copy.ts` (cache 1x/jour) et `ai-system-prompt.ts` (garde-fous santé).
- **La clé Gemini ne vit jamais dans l'app cliente.** L'appel réel passe par un Cloudflare Worker
  séparé, `server/coach-ai-proxy/` (voir son README pour déployer + où coller la clé). L'app
  n'appelle que `EXPO_PUBLIC_COACH_BACKEND_URL` (l'URL du Worker, pas un secret) via
  `src/features/coach/ai-provider.ts`. Sans cette variable définie (`.env` absent ou vide), le
  Coach reste 100 % fonctionnel sur ses textes de repli déterministes — c'est le comportement par
  défaut et celui de tout build sans `.env` fourni.
- Le prompt système strict est dupliqué dans `server/coach-ai-proxy/src/system-prompt.ts` (côté
  serveur, seul qui compte réellement) et `src/features/coach/ai-system-prompt.ts` (côté client,
  gardé pour référence/tests) — les deux DOIVENT rester identiques.
- `server/` est un projet Node séparé (son propre `package.json`, `tsconfig.json`, déployé via
  `wrangler`) — exclu du `tsconfig.json` racine et du bundle Expo, jamais importé depuis `src/`.

## Score d'hydratation

Le moteur pur est dans `src/features/hydration/scoring.ts` (zéro dépendance React, testable
isolément) : 4 métriques (Volume 40 %, Régularité 20 %, Timing 15 %, Qualité 25 %) → une note
0-100 par métrique + lettre A (≥85) / B (≥60) / C, combinées en une note globale pondérée.
Voir le README pour le détail de chaque métrique.

## Vérif après toute modif

```bash
npx tsc --noEmit -p tsconfig.json
npx expo export --platform ios
```

## i18n

FR par défaut (device), EN en repli. Chaque texte affiché passe par `t('...')` — clés dans
`src/lib/i18n/locales/{fr,en}.ts`, toujours les deux à jour.
