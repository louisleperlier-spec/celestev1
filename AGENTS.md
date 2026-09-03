# Lume — repères pour toute IA qui travaille sur ce repo

**Lume** est une app iOS de suivi d'hydratation : fond clair et doux, mascotte goutte, accent
vert, notes A/B/C/D par métrique + une note globale /100, 5 écrans (Accueil, Journal, Coach,
Tendances, Équipe), synchro Apple Santé.

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
    onboarding/   parcours 7 écrans au premier lancement (voir section dédiée ci-dessous)
    reminders/    rappels quotidiens locaux (expo-notifications, aucun backend)
    premium/      RevenueCat (purchases.ts, contexte usePremium), thèmes d'accent, écran paywall
  services/       accès externe : health/ (HealthKit)
  ui/components/  design system (Screen, Card, Button, ZoneGauge, GradeBadge, MetricCard, EntryRow, BarChart…)
  lib/            i18n, date/id helpers
  constants/      theme.ts — SOURCE de vérité du fond clair + tokens invariants (texte, notes A/B/C/D…)
```

Routes minces : le corps de chaque écran vit dans `src/features/hydration/*-view.tsx` (ou
`premium/paywall-view.tsx`).

## Design

- **Fond clair et doux, mascotte, un seul accent affiché à la fois.** L'identité visuelle a
  oscillé plusieurs fois en cours de session (noir/vert → lavande/mascotte → noir/vert →
  clair/vert/mascotte → sombre/vert "dashboard premium" → **clair/vert/mascotte "wellness"
  actuel**, inspiré d'une appli santé/bien-être de référence pour le style de cartes/jauge
  uniquement — jamais ses métriques HRV/stress/fréquence cardiaque, absentes de Lume, qui ne
  suit que l'hydratation) — c'est la version en place tant qu'on ne redemande pas explicitement
  un changement, mais ne pas supposer qu'elle est figée pour toujours. `src/constants/theme.ts`
  reste la source des tokens invariants (fond `#F5F7EF`, surfaces blanches, texte sombre, notes
  A/B/C/D, couleur fixe de la mascotte) ; **l'accent seul varie** selon le thème choisi (premium),
  via `useTheme()` (`src/features/premium/theme-context.tsx`), jamais `Colors.accent*` en dur.
  Menthe (vert `#2ECC71`) est l'accent par défaut (gratuit) ; Azur/Corail/Violet sont réservés au
  premium (`src/features/premium/themes.ts`). Toute couleur passe par un token, jamais en dur
  dans un composant.
- **`ZoneGauge`** (`src/ui/components/ZoneGauge.tsx`) : jauge horizontale à 4 zones de couleur
  (D/C/B/A, mêmes seuils que `scoring.ts`, largeurs proportionnelles — D fait 40 points de large,
  C/B/A 20 chacune) avec un curseur blanc positionné en `left: score%`. Élément visuel signature
  de la carte score (Accueil), à ne pas confondre avec les barres de `MetricCard`/`BarChart`.
- **Mascotte** (`src/ui/components/Mascot.tsx`) : illustrations fournies par l'utilisateur
  (`assets/mascot/*.webp`, 8 poses détourées — pas un rendu généré ni de la photo de stock), pas
  du SVG maison. Poses utilisées : `wave` (Bienvenue onboarding, Défi encourageant),
  `thumbsup` (Révélation onboarding, Ajouter une boisson), `sparkle` (anneau Accueil, avatar
  Coach), `heart` (Défi quand la semaine est réussie). `sunglasses`/`workout`/`sleep` sont
  disponibles dans les assets mais pas encore branchés à un écran.
- **`theme.accentText`** : chaque thème d'accent définit sa propre couleur de texte lisible
  dessus (`onAccent` dans `themes.ts`). Ne jamais coder `'#000000'`/`'#FFFFFF'` en dur sur un fond
  `theme.accent` — toujours `theme.accentText`.
- **Notes A (≥80) / B (≥60) / C (≥40) / D (<40)** (`gradeA/B/C/D` dans `theme.ts`) restent fixes
  quel que soit le thème d'accent — la grammaire de couleur des notes ne doit jamais changer de
  sens.
- SF Symbols (`expo-symbols`) partout, jamais d'emoji dans l'UI. Ils ne rendent rien sur le web
  (no-op silencieux hors plateforme native) — normal en testant via `expo export --platform web`,
  sans impact sur le vrai build iOS.
- **Exception scoped au Coach** (`src/features/coach/coach-theme.ts`) : les cartes recommandées
  (recette/activité/récupération) ont une couleur par catégorie + une icône SF Symbol
  (`CATEGORY_ICON`) au lieu du mono-accent strict. Les anciennes photos `assets/coach/*.jpg`
  (fournies par l'utilisateur) ont été retirées du code — leur mélange de styles disparates
  (photo réaliste, art abstrait, halo vert) lisait comme de l'illustration IA générique plutôt
  que comme une identité Lume ; des tuiles plates teintées + icône sont plus sobres et cohérentes
  avec le reste de l'app. C'est une dérogation volontaire et délimitée, décidée pour ce tab
  uniquement ; le reste de l'app (Accueil, Journal, Tendances, Réglages, Paywall) reste
  mono-accent. Ne pas réutiliser `CATEGORY_TINT`/`CATEGORY_ICON`/`STREAK_COLOR` en dehors de
  `src/features/coach/`.
- Icône d'app, écran de démarrage (splash) et icônes Android (`assets/images/*.png`) sont
  restées sur l'ancienne identité (fond noir) à travers les changements de thème — pas encore
  régénérées pour la DA claire actuelle. À refaire visuellement avant la sortie publique (hors
  portée d'une session code-only).

## Onboarding (premier lancement)

- `src/features/onboarding/` : 7 écrans (Bienvenue → Objectif → Poids → Activité → Sommeil → Apple
  Santé → Révélation) affichés une seule fois avant `(tabs)`. Route `src/app/onboarding.tsx`
  (`Stack.Screen` en `fullScreenModal`, `gestureEnabled: false`) ; le gate est dans
  `src/app/_layout.tsx` via `shouldShowOnboarding()` (`onboarding-storage.ts`), qui pose le flag
  `lume.onboarding.completed.v1` et — pour ne jamais forcer un utilisateur déjà actif (mise à jour
  de l'app) — le pose aussi silencieusement si des entrées ou des réglages non-défaut existent déjà.
- L'estimation d'objectif initial (`goal-estimate.ts`, poids/activité/sommeil → ml) est un repère de
  bien-être courant (30-35 ml/kg + bonus activité), explicitement non médical, immédiatement
  ajustable dans Réglages et remplacé par l'objectif adaptatif (premium) dès qu'assez de données
  réelles existent. L'écran de révélation finale montre cet objectif réel (persisté via
  `setDailyGoal`) et les vraies pondérations du score (`WEIGHTS` exporté de `scoring.ts`) — jamais
  un score ou une note projetée inventée, puisqu'aucune donnée n'existe encore à ce stade.
- L'étape Apple Santé appelle le vrai `enableHealthSync()` (donc `requestHealthAuthorization`) ;
  no-op silencieux hors build natif comme partout ailleurs (voir section HealthKit).
- Dernier écran → `router.replace('/(tabs)')` puis `router.push('/paywall')` : ouvre le VRAI
  paywall déjà livré (5 bénéfices réels), jamais une liste de features réinventée pour l'onboarding.

## Premium (RevenueCat)

- `react-native-purchases` est un module natif : **ne fonctionne pas dans Expo Go** (comme
  HealthKit). Chargé en lazy/try-catch (`src/features/premium/purchases.ts`), no-op sans
  `EXPO_PUBLIC_REVENUECAT_API_KEY` ni build natif — `usePremium().isPremium` reste `false`.
- Entitlement unique : `"premium"`. Verrouillé derrière : historique > 7 jours + Tendances 30
  jours, plusieurs rappels, objectif adaptatif, boissons personnalisées, thèmes non-défaut,
  Dashboard sommeil (lecture HealthKit sommeil), reformulation IA du Coach (Gemini — la version
  gratuite garde le texte de repli déterministe, jamais moins fonctionnelle).
- Geste standard pour verrouiller un bouton : `usePremiumGate().guard(action)` — exécute
  `action` si premium, sinon ouvre `/paywall`.
- Paywall (`src/features/premium/paywall-view.tsx`) : prix réels via l'offering RevenueCat
  quand disponible, sinon repli statique (`paywall.monthlyPriceFallback`/`annualPriceFallback`
  dans les locales) — à garder alignés sur les prix réels une fois les produits créés sur
  App Store Connect + RevenueCat. Hero dégradé + mascotte + badges de réassurance (annulable,
  paiement sécurisé, sans engagement) — jamais de faux avis/note/nombre d'utilisateurs inventés,
  Lume n'ayant pas encore d'historique App Store réel à afficher honnêtement.

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

## Landing page (support URL App Store)

`web/` est une page statique indépendante (pas de build, pas de React Native) déployée sur
Netlify — voir `web/README.md`. Elle sert uniquement à couvrir le champ **Support URL**
obligatoire d'App Store Connect (formulaire de contact via Netlify Forms, aucun backend).
`netlify.toml` à la racine pointe dessus (`publish = "web"`). Complètement séparé de `src/` et
`server/` — jamais importé par l'app, jamais buildé par Expo.

## Score d'hydratation

Le moteur pur est dans `src/features/hydration/scoring.ts` (zéro dépendance React, testable
isolément) : 4 métriques (Volume 40 %, Régularité 20 %, Timing 15 %, Qualité 25 %) → une note
0-100 par métrique + lettre A (≥80) / B (≥60) / C (≥40) / D (<40), combinées en une note globale
pondérée. Voir le README pour le détail de chaque métrique.

## Coach — défi hebdo, récompenses, routines

- **Écran Défi** (`challenge-view.tsx`, route `/challenge`, hero dégradé + mascotte) : accessible
  depuis une carte teaser en bas du Coach. Regroupe défi hebdo, récompenses et routines — extrait
  du scroll principal du Coach pour ne pas le surcharger.
- **Défi de la semaine** : nombre réel de jours (sur les 7 derniers) où l'objectif quotidien a été
  atteint (`hydratingMl >= goalMl`) — jamais une progression inventée. Le titre du hero s'adapte
  (encourageant si < 4/7 jours, positif sinon) — jamais une louange plaquée sans rapport avec la
  donnée réelle.
- **Récompenses** : paliers de série (7/15/30 jours) basés sur `computeStreak` (`streak.ts`,
  déjà utilisé pour le badge flamme). Le palier 7 jours est calculable gratuitement (fenêtre de 7
  jours) ; 15 et 30 jours demandent l'historique 30 jours, donc **verrouillés en Premium** comme
  Tendances 30 jours — jamais affichés "débloqués" sans que la donnée réelle existe.
- **Routines recommandées** (`routines.ts` + `routine-view.tsx`, route `/routine?id=`) : liste
  d'étapes génériques de bien-être (pas de promesse médicale), cochables localement (pas
  persistées) — même esprit que `content.ts`, pas un catalogue.

## Journal — semaine calendaire

- Bandeau de 7 jours (lundi→dimanche, semaine calendaire contenant "aujourd'hui", pas une fenêtre
  glissante) au-dessus de la liste ; taper un jour affiche ses entrées réelles pour cette date
  (`statsForDate`). Flèches gauche/droite pour changer de semaine — au-delà de 7 jours en arrière,
  **verrouillé en Premium** (`journal-view.tsx`), même logique que l'historique Journal déjà
  documentée sous Premium ci-dessous.

## Vérif après toute modif

```bash
npx tsc --noEmit -p tsconfig.json
npx expo export --platform ios
```

## i18n

FR par défaut (device), EN en repli. Chaque texte affiché passe par `t('...')` — clés dans
`src/lib/i18n/locales/{fr,en}.ts`, toujours les deux à jour.
