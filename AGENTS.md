# Lume — repères pour toute IA qui travaille sur ce repo

**Lume** est une app iOS de suivi d'hydratation : fond noir, accent vert, notes A/B/C par
métrique + une note globale /100, 3 écrans (Accueil, Journal, Tendances), synchro Apple Santé.

## SDK Expo pinné

- **SDK 57** (`expo@~57.0.14`). Ne JAMAIS upgrader sans raison explicite — Expo Go plafonne
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
  app/            routes expo-router — (tabs)/ (Accueil, Journal, Tendances) + add-entry, settings (modales)
  features/       cœur métier : hydration/ (types, scoring, storage, contexte React)
  services/       accès externe : health/ (HealthKit)
  ui/components/  design system (Screen, Card, Button, ScoreRing, GradeBadge, MetricCard, EntryRow, BarChart…)
  lib/            i18n, date/id helpers
  constants/      theme.ts — SOURCE UNIQUE DE VÉRITÉ du look (fond noir, accent vert)
```

Routes minces : le corps de chaque écran vit dans `src/features/hydration/*-view.tsx`.

## Design

- **Mono-thème, volontairement** : `src/constants/theme.ts` n'a qu'une palette (pas de
  variante claire) — c'est l'identité de marque, pas un oubli. Toute couleur passe par
  `Colors.*`, jamais en dur dans un composant.
- Un seul accent (`Colors.accent`, vert). Les couleurs A/B/C (`gradeA/B/C`) sont la seule
  autre famille de couleurs sémantiques de l'app.
- SF Symbols (`expo-symbols`) partout, jamais d'emoji dans l'UI.

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
