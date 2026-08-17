# Lume

App iOS de suivi d'hydratation — fond noir, accent vert, une note A/B/C par métrique et une
note globale sur 100, synchronisée avec Apple Santé.

## Écrans

- **Accueil** — la note globale du jour (anneau de score + lettre), l'objectif en ml, un ajout
  rapide (verre 250 ml / bouteille 500 ml / personnalisé), le détail des 4 métriques, et l'état
  de la synchro Apple Santé.
- **Journal** — l'historique des prises d'eau groupées par jour, avec le total et la note du
  jour ; les entrées venues d'Apple Santé sont marquées et non supprimables depuis Lume.
- **Tendances** — score moyen, jours "bons" (≥ B), série en cours, évolution du score et du
  volume sur 7 ou 30 jours, moyenne par métrique.

## La note

Le moteur (`src/features/hydration/scoring.ts`, pur et sans dépendance React) calcule 4
métriques, chacune notée 0-100 puis en lettre (A ≥ 85, B ≥ 60, sinon C) :

| Métrique | Poids | Ce qu'elle mesure |
|---|---|---|
| **Volume** | 40 % | part de l'objectif quotidien atteinte (le café/soda/thé hydratent un peu moins qu'un volume égal d'eau — facteur appliqué) |
| **Régularité** | 20 % | l'hydratation est-elle étalée dans la journée (7h-23h découpée en 4 créneaux) ou concentrée d'un coup ? pénalise les trous de plus de 4-6h |
| **Timing** | 15 % | démarrer tôt (avant 10h/12h) et éviter de tout boire juste avant le coucher (après 21h) |
| **Qualité** | 25 % | part de boissons qui hydratent moins bien (café, soda) au-delà d'une petite tolérance |

La note globale est la moyenne pondérée des 4, arrondie, puis mise en lettre avec les mêmes
seuils.

## Synchro Apple Santé

Lume lit et écrit l'eau bue (`HKQuantityTypeIdentifierDietaryWater`) dans Apple Santé via
[`@kingstinct/react-native-healthkit`](https://github.com/kingstinct/react-native-healthkit) :

- une entrée ajoutée dans Lume est poussée dans Apple Santé (si la synchro est activée) ;
- à l'ouverture et sur demande (bouton "Synchroniser"), Lume relit les 30 derniers jours
  d'Apple Santé et importe ce qui vient d'ailleurs (Apple Santé lui-même, une autre app) sans
  dupliquer ses propres écritures.

**⚠️ HealthKit est un module natif : il ne fonctionne pas dans Expo Go.** Le reste de l'app
(saisie manuelle, journal, tendances) fonctionne partout ; seule la synchro Apple Santé
nécessite un **dev client** :

```bash
npx expo prebuild --platform ios
npx expo run:ios          # avec Xcode, ou via EAS Build (pas besoin de Mac)
```

Hors build natif, `isHealthKitSupported()` renvoie `false` et l'app se comporte normalement,
sans la carte de synchro active.

## Stack

Expo SDK 57 (pinné — voir `AGENTS.md`) · expo-router · TypeScript · `react-native-svg` (anneau
de score, graphiques) · `@react-native-async-storage/async-storage` (persistance locale) ·
`i18next`/`react-i18next` (FR par défaut, EN en repli) · SF Symbols (`expo-symbols`) pour toute
l'iconographie.

## Démarrer

```bash
npm install
npx expo start -c        # scanner le QR avec Expo Go pour tout sauf la synchro Apple Santé
```

Vérification après modif :

```bash
npx tsc --noEmit -p tsconfig.json
npx expo export --platform ios
```

Voir `AGENTS.md` pour l'architecture détaillée et les règles à respecter (SDK pinné, thème
mono-couleur, i18n).
