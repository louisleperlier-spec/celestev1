---
name: expo-ios-app
description: >
  Scaffold et développe une app iOS en Expo (React Native) avec une stack et une architecture éprouvées
  en production. Utilise ce skill dès qu'on démarre une nouvelle app mobile Expo, qu'on met en place la
  structure d'un projet React Native/Expo, qu'on choisit la stack mobile, ou qu'on travaille sur la
  navigation, le thème, l'i18n ou l'architecture d'une app iOS. Couvre le pinning du SDK (piège Expo Go),
  l'archi en couches, le thème clair/sombre, l'i18n FR/EN, et la boucle de vérif typecheck + bundle.
---

# Expo iOS App — scaffold & conventions

Stack validée en production. **Pas besoin de Mac** : les builds iOS se font dans le cloud via **EAS**, donc
tu peux développer depuis n'importe quel OS.

## ⚠️ Règle d'or n°1 : PINNER le SDK Expo
L'app **Expo Go** de l'App Store plafonne souvent à un SDK **en retard** d'une version. Tu testes ton app
avec Expo Go → il faut choisir le SDK que **ton** Expo Go supporte (ex. rester sur le SDK N alors que N+1
ou N+2 existe déjà).
- **Ne jamais upgrader le SDK sans raison.** Un `AGENTS.md`/`CLAUDE.md` à la racine doit le rappeler.
- Publiable App Store via EAS quelle que soit la version, donc rester sur le SDK compatible Expo Go.
- Vérifier la compatibilité des libs natives avec ce SDK avant de les ajouter.

### Le POINT DE VÉRITÉ : quel SDK pinner ? (à faire AVANT de scaffolder)
Ne devine jamais le numéro de SDK, et ne le lis pas « de mémoire » — il change vite. Détermine-le avec
**une** de ces sources de vérité, dans l'ordre :
1. **Demande au user la version de son Expo Go** (c'est la source la plus fiable, c'est *son* appareil qui
   testera) : « Ouvre **Expo Go** sur ton iPhone → l'écran d'accueil / *Settings* affiche la version. » La
   version d'Expo Go dicte le **SDK max** qu'il sait ouvrir.
2. **Croise avec la table officielle à jour** — la page des versions du SDK Expo
   (`https://docs.expo.dev/versions/latest/`, et la note « SDK supported by Expo Go ») dit quel SDK va avec
   quelle Expo Go. **Lis-la live**, ne te fie pas à une valeur écrite en dur ici (elle serait périmée).
3. **En cas de doute** : pinne le SDK que `npx create-expo-app` scaffolde par défaut **si** l'Expo Go du
   user le supporte ; sinon **downgrade** au SDK que son Expo Go accepte (§ « Point de départ rapide » ci-
   dessous). Puis **grave le numéro choisi** dans `app.json`, `package.json` et le `CLAUDE.md`/`AGENTS.md`
   racine — c'est LE numéro de référence pour toute la suite du projet.

> Si l'app ne s'ouvre pas sur le téléphone (« something went wrong », écran de version incompatible) →
> c'est presque toujours ce décalage SDK ↔ Expo Go (voir skill **doctor**). Le fix = re-pinner, pas bricoler.

## Stack de référence
- **Expo SDK** (pinné) + **React Native** + **expo-router** (routing par fichiers) + **TypeScript**
- **NativeWind** (Tailwind RN) ou StyleSheet — cohérence avant tout
- **Reanimated** (+ Moti/Animated) pour l'animation. **PAS de Skia** ni de module natif absent d'Expo Go
  (tu testes en Expo Go). Lottie ok.
- **TanStack Query** (données serveur) + **Zustand** (état UI local)
- **Supabase JS** (voir skill `supabase-backend`)
- **expo-symbols** (SF Symbols) plutôt que des emojis dans l'UI (goût premium)
- i18n : `i18next` + `react-i18next`

## Architecture en couches (clean/layered)
```
src/
  app/         # routes expo-router ((tabs), (auth), écrans) — de fins wrappers
  features/    # logique métier par domaine (auth, <feature>/…): hooks, repo, vues
  services/    # accès externe : supabase/, ai/, purchases/, notifications/ (ports/adapters)
  ui/          # design system : components/ (Button, Card, TextField…), navigation/
  lib/         # i18n, préférences, helpers transverses
  constants/   # theme (couleurs, spacing, radius, fonts)
```
Les routes restent minces : le corps des écrans vit dans `features/<x>/*-view.tsx` (réutilisable entre
une route et un sheet).

## Conventions clés
- **Thème clair/sombre/auto** via un `PreferencesProvider` + hook `useThemeMode()`. Couleurs dans
  `constants/theme`. Un seul accent.
- **i18n FR/EN** : tout texte affiché passe par `t('...')` ; les deux locales toujours à jour
  (`lib/i18n/locales/{fr,en}.ts`, clés identiques). Sélecteur de langue Auto/FR/EN dans Profil.
- **Perf listes** : `FlatList` virtualisée (`removeClippedSubviews`, `initialNumToRender`, `windowSize`),
  jamais `.map()` dans un ScrollView pour de longues listes.
- **Perf data** : `select` uniquement les colonnes utiles (jamais `select('*')` pour une liste), mutations
  **optimistes** (patch du cache, pas d'invalidation qui refetch tout).
- **Perf animations** : couper les boucles d'animation quand l'écran n'est pas focus (`freezeOnBlur` ne
  stoppe PAS les animations natives → gérer un flag `paused`/`isFocused` qui démonte/gèle le décor animé).
- **⚠️ Scrollables imbriqués / pager (piège RN vécu en prod)** : dès qu'on imbrique des scrollables (ex.
  carrousel horizontal paginé + scroll vertical dedans) ou qu'un ScrollView vit sous `GestureHandlerRootView`,
  importer **`ScrollView`/`FlatList` de `react-native-gesture-handler`** (PAS `react-native`) — sinon
  l'arbitrage des gestes ne coopère pas et on n'a **ni scroll ni swipe** (symptôme exact : « je peux pas
  scroller ni swiper »). Pager horizontal + lecture verticale = axes **orthogonaux** (OK nativement) :
  pager `horizontal pagingEnabled` (RNGH), chaque page à **largeur fixe** (`useWindowDimensions`) ET
  **hauteur bornée** (sinon le scroll interne ne se crée jamais). Ne PAS copier les hacks
  `activeOffsetX`/`PanGestureHandler` (ils visent le cas co-orienté, pas l'orthogonal).

## Commandes
```bash
npm install
npx expo start -c            # -c vide le cache ; scanner le QR avec Expo Go
# VÉRIF après toute grosse modif (les deux) :
./node_modules/.bin/tsc.cmd --noEmit -p tsconfig.json
npx expo export --platform ios
```
- Node ≥ 20.19. Sous Windows : `tsc.cmd` (pas `tsc`).
- Aligner les versions de libs sur le SDK : `npx expo install <pkg>` (jamais `npm install` d'une lib
  Expo → mauvaise version). Attention aux **doublons** dans `dependencies` ET `devDependencies`
  (piège `@types/react`).

## Secrets (critique)
- `EXPO_PUBLIC_*` = **publié dans le bundle**. N'y mettre QUE du public (URL Supabase, clé anon/publishable,
  clé SDK RevenueCat publique).
- Une **clé secrète** (clé d'API IA…) ne doit JAMAIS avoir ce préfixe → elle vit en secret d'Edge Function
  (skill `supabase-backend`). Vérifier son absence du bundle exporté.
- `.env` gitignored. Idéalement l'exclure d'une sync cloud type OneDrive/Drive.

## Point de départ rapide
1. `npx create-expo-app` avec le template TS + expo-router, puis **downgrade le SDK** au besoin.
2. Poser l'archi ci-dessus + le design system + i18n + thème.
3. Écrire `CLAUDE.md`/`AGENTS.md` racine : SDK pinné, règles (pas de Skia, secrets server-side, FR/EN).
4. Brancher Supabase (skill dédié).

## Skills Expo officiels (à consulter)
La Recette bundle un set curé de **skills officiels Expo** (open-source, MIT © 650 Industries/Expo —
voir `.claude/skills/EXPO-SKILLS-NOTICE.md`). Ce sont les docs Expo de référence : consulte le bon selon
le besoin plutôt que de deviner une API.

| Besoin | Skill à charger |
|---|---|
| Navigation, routing par fichiers, tabs, modals, headers | **`expo-router`** |
| Structure de dossiers d'un nouveau projet | **`expo-project-structure`** |
| Build de dev / tester du code natif sur device | **`expo-dev-client`** |
| UI native (HIG, SF Symbols, effets, gradients) | **`expo-native-ui`** |
| UI native SwiftUI/Compose via `@expo/ui` | **`expo-ui`** |
| Données : fetch, cache, offline, React Query/SWR, loaders | **`expo-data-fetching`** |
| Écrire un module/vue natif (Expo Modules API) | **`expo-module`** |
| Upgrade d'une version de SDK Expo | **`expo-upgrade`** |
| CI/CD EAS (`.eas/workflows/`) | **`eas-workflows`** |
| Build & submit aux stores / TestFlight | **`eas-app-stores`** |
| Exemple canonique d'intégration d'une lib tierce | **`expo-examples`** |

> ⚠️ **RÈGLE DE PRIORITÉ CRITIQUE — le PIN gagne, toujours.**
> Ces skills Expo sont un **snapshot de la version courante d'Expo** : ils **supposent le dernier SDK**.
> La Recette, elle, **PIN le SDK** sur la version supportée par l'Expo Go du device du client (voir
> Règle d'or n°1 ci-dessus) — c'est **non négociable**, c'est LE piège classique du pin de SDK sur Expo Go.
> **En cas de conflit entre un skill Expo et le SDK pinné, le SDK pinné l'emporte.** N'upgrade **jamais**
> le SDK « parce qu'un skill Expo le suggère » : adapte la reco du skill au SDK pinné, pas l'inverse.
> `expo-upgrade` ne s'utilise que lors d'un **changement de SDK volontaire et assumé**, jamais en réflexe.
