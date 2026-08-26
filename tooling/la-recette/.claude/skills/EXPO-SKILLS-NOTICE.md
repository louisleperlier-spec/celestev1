# Skills Expo officiels — attribution & licence

La Recette embarque un set curé de **skills officiels Expo**, inclus **verbatim** (obligation MIT).

- **Source** : https://github.com/expo/skills (dossier `plugins/expo/skills/`)
- **Licence** : **MIT** — voir le fichier `LICENSE` présent dans **chaque** dossier de skill.
- **Copyright** : `Copyright (c) 2025-present 650 Industries, Inc. (aka Expo)`

## Skills inclus (11)

| Skill | Rôle |
|---|---|
| `expo-project-structure` | Structure de dossiers d'un nouveau projet Expo |
| `expo-router` | Navigation & routing par fichiers (expo-router) |
| `expo-dev-client` | Build & distribution d'un dev client (test de code natif) |
| `expo-native-ui` | UI native (HIG Apple, SF Symbols, effets, gradients…) |
| `expo-ui` | UI native SwiftUI/Jetpack Compose via `@expo/ui` |
| `expo-data-fetching` | Fetch, React Query/SWR, cache, offline, loaders |
| `expo-upgrade` | Upgrade de SDK Expo + fix de dépendances |
| `expo-module` | Écriture de modules/vues natifs (Expo Modules API) |
| `expo-examples` | Catalogue des exemples officiels `expo/examples` |
| `eas-workflows` | CI/CD EAS (fichiers `.eas/workflows/*.yml`) |
| `eas-app-stores` | Build & submit vers l'App Store / Play Store / TestFlight |

## Règles (à respecter)

- **Inclus verbatim** : les `SKILL.md` (et leurs `references/`, `scripts/`) sont copiés tels quels
  depuis le repo Expo. Ne pas les modifier ni les traduire.
- **Ne pas retirer les `LICENSE`** : MIT exige que l'avis de copyright soit présent dans **chaque**
  copie — un fichier `LICENSE` vit donc dans chaque dossier de skill Expo.
- Ces skills sont un **snapshot de la version courante d'Expo** au moment du bundling. En cas de conflit
  avec le **SDK pinné** du projet, **le PIN gagne** (voir la règle de priorité dans `expo-ios-app/SKILL.md`).
