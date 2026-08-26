---
name: assets
description: >
  Le mécanisme RÉEL de génération des assets d'une app iOS (icône, splash, screenshots App Store
  localisés) — sans simulateur, sans Photoshop, cross-platform (Windows/Mac/Linux). Charge ce skill dès
  qu'il faut produire l'icône, l'écran de démarrage, ou les captures d'écran aux tailles Apple exactes
  (ex. 1290×2796) — typiquement en Phase 6 de /build (icône + splash) et pendant /app-store (screenshots
  réels, GATE 2b). Repose sur `$CLAUDE_PROJECT_DIR/scripts/generate-assets.mjs` (image processing via `sharp`). Principe
  non négociable : on ENCADRE de vraies captures, on n'invente JAMAIS un mockup ; sans device, on
  REQUALIFIE honnêtement en « capture guidée » (Claude guide l'humain écran par écran).
---

# Assets — icône, splash & screenshots, pour de vrai

> **Le trou qu'on bouche.** La Definition-of-Done exige partout des assets (icône, splash, screenshots
> « fidèles à la vraie app »). Mais un débutant sur **Windows + Expo Go** n'a **ni simulateur iOS ni
> device garanti**, et Claude **ne « dessine » pas de PNG**. Sans mécanisme, cet item est une **promesse
> creuse**. Ce skill le rend **réel** — et là où l'automatisation totale est impossible, il le **dit** et
> passe à une action humaine guidée, plutôt que de mentir. C'est la constitution : **jamais de fausse
> promesse.**

## L'outil

Tout passe par un script Node cross-platform, sans dépendance exotique :

```
$CLAUDE_PROJECT_DIR/scripts/generate-assets.mjs   # 3 sous-commandes : icon · screenshots · sizes
```

- **Dépendance : `sharp`** (traitement d'image natif). ⚠️ Il **n'est PAS livré** avec La Recette
  (`node_modules` est gitignore → absent chez le client). **Étape explicite et vérifiée du pipeline** :
  installe-le **dans le dossier de l'app** avant de générer les assets.
  ```
  npm i sharp
  ```
  Préviens le client : « J'installe l'outil qui fabrique tes images — **c'est une brique native, compte
  1-2 minutes de compilation la première fois**, c'est normal. » Puis **vérifie** que l'install a réussi
  (le script échoue proprement et te le dit si `sharp` manque encore).
- **Aucun** simulateur, **aucun** outil Apple requis pour l'icône et le splash.

> **Si `npm i sharp` échoue** (proxy d'entreprise, réseau, toolchain de compilation absente) : **on ne
> bloque pas et on ne ment pas.** On **requalifie** en « capture guidée » (voir plus bas) — Claude guide
> le client pour fournir/capturer les images à la main plutôt que de promettre une génération automatique
> qui ne peut pas tourner. Jamais de fausse promesse (constitution).

Explique-le au client en une phrase : « Je génère toutes tes images (l'icône, l'écran de démarrage, les
captures pour l'App Store) à partir d'une seule image de départ — tu n'as rien à installer. »

---

## Pipeline 1 — Icône + splash (100 % automatisable, sans device)

**D'où vient l'icône de départ ?** Claude **compose l'icône en SVG** — du **code vectoriel**, pas un PNG
« dessiné » — selon le kit UI choisi (skill **ui-kits** : monochrome + 1 accent, épuré). C'est légitime
et honnête : écrire du SVG, c'est écrire du code. Le script **rasterise** ensuite ce SVG à toutes les
tailles requises. (À défaut de SVG, un **PNG carré 1024×1024** fourni par le client marche aussi.)

```
node "$CLAUDE_PROJECT_DIR/scripts/generate-assets.mjs" icon --src ./brand/icon.svg --out ./assets/images \
     --bg "#FFFFFF" --splash-bg "#0C0C0F"
```

Ça produit, dans `assets/images/` :

| Fichier | Taille | Rôle |
|---|---|---|
| `icon.png` | 1024×1024 **opaque** | Icône App Store & app (Apple **refuse l'alpha** ici — le script aplatit sur `--bg`). |
| `adaptive-icon.png` | 1024×1024 (transparent, marge) | Icône adaptative Android. |
| `splash-icon.png` | 1024×1024 (logo centré, transparent) | Logo d'écran de démarrage, posé sur `--splash-bg`. |
| `favicon.png` | 48×48 | Web (landing). |

Le script **imprime le snippet `app.json`** exact à coller (clé `icon`, `expo-splash-screen`,
`adaptiveIcon`). Après branchement : **self-verify** (`tsc --noEmit` + `expo export --platform ios`) puis
`/preview` pour voir le **boot réel** avec les vrais assets.

> **Où ça compte pour la DoD :** la **présence** de l'icône + du splash branchés (pas l'icône Expo par
> défaut) est un item de **GATE 2a — Code-complet**. Le script la ferme automatiquement.

---

## Pipeline 2 — Screenshots App Store (encadre de VRAIES captures)

Les screenshots Apple doivent être **fidèles à la vraie app** (guideline **2.3** — un mockup trompeur =
rejet). Le script ne **fabrique pas** l'app en image : il prend de **vraies captures** et les **compose**
proprement aux tailles Apple exactes, **par langue**.

```
node "$CLAUDE_PROJECT_DIR/scripts/generate-assets.mjs" screenshots --in ./raw --out ./assets/store/screenshots \
     --size 1290x2796 --captions ./captions.json --bg "#0C0C0F" --caption-color "#F2F2F7"
```

Pour **chaque** capture, il : redimensionne (aspect préservé), **arrondit les coins**, pose sur un **fond**
de marque, ajoute une **légende localisée** (texte vectoriel, centré, en haut), et sort **exactement** à
la taille cible (ex. `1290×2796`).

- **Multi-langue :** range tes captures en sous-dossiers `raw/en/`, `raw/fr/` → une passe par langue,
  sortie dans `screenshots/en/`, `screenshots/fr/`. (Ou une seule langue via `--lang fr`.)
- **Légendes :** `--captions captions.json`, format plat `{ "01-home.png": "Titre" }` **ou** par langue
  `{ "fr": { "01-home": "Tout au même endroit" }, "en": { "01-home": "Everything in one place" } }`.
  Sans légende : `--no-caption`.
- **Cadre device optionnel :** `--frame ./bezel.png` (PNG à écran transparent) si tu en as un ; sinon le
  rendu par défaut (capture arrondie sur fond de marque + légende) est propre et fiable.
- **Réglages fins :** `--margin`, `--radius`, `--top` (hauteur de la bande de légende), `--bg`,
  `--caption-color`.

**Tailles Apple** (portrait) — `node "$CLAUDE_PROJECT_DIR/scripts/generate-assets.mjs" sizes` :

| Preset | Pixels | Cible |
|---|---|---|
| `6.9` (défaut) | 1290×2796 | iPhone 6.9"/6.7" — **le socle exigé** |
| `6.5` | 1242×2688 | iPhone 6.5" |
| `ipad13` | 2064×2752 | iPad 13" (si l'app supporte l'iPad) |
| `ipad129` | 2048×2732 | iPad 12.9" |

> ⚠️ **Recroise toujours** avec App Store Connect **live** avant soumission — Apple fait évoluer ses
> exigences de tailles. Ne jamais affirmer « bonnes tailles » sur une liste périmée.

---

## Le point d'honnêteté — quand l'auto n'est PAS possible

Le script **encadre** des captures ; il n'en **invente pas**. Or un débutant peut n'avoir **aucun device**
ni aucune capture. Dans ce cas, **on ne prétend pas** avoir automatisé l'impossible — on **requalifie**
l'item en **action humaine guidée** :

1. Claude **liste précisément** les écrans à capturer (les 3 à 6 vues qui vendent l'app : accueil, la
   feature centrale en action, le résultat, le paywall…), dans l'ordre, **par langue**.
2. Claude **guide la capture écran par écran** — sur **Expo Go** (pour un premier jet) ou, mieux, sur le
   **build TestFlight réel** (rendu final fidèle) : quel écran ouvrir, quand appuyer sur *capture*
   (Volume ↑ + Latéral sur iPhone), comment **envoyer** les PNG au dossier `raw/<langue>/`.
3. **Une seule action à la fois**, jamais une liste de dix (constitution).
4. Dès que les captures arrivent, le script **reprend la main** : cadre, légende, tailles → prêt à coller.

C'est la ligne rouge : **un screenshot doit montrer la vraie app.** Fabriquer une image « à peu près »
serait un mockup trompeur (2.3) **et** un mensonge au client. On préfère **guider** que **faire semblant**.

> **Où ça compte pour la DoD :** des screenshots **réels et fidèles**, aux bonnes tailles, localisés, est
> un item de **GATE 2b — Validé pour soumission** (il faut le build/le device réel). C'est `/app-store`
> qui le ferme, avec ce skill.

---

## Récapitulatif du branchement dans le parcours

- **`/build` · Phase 6 (GATE 2a)** — Claude compose le SVG d'icône (kit UI) → `generate-assets.mjs icon`
  → icône + splash + favicon branchés → self-verify. Automatique, sans device.
- **`/app-store` (GATE 2b)** — vraies captures du build TestFlight (ou capture guidée) →
  `generate-assets.mjs screenshots` par langue → placées dans App Store Connect.

## Garde-fous

- **Icône App Store = opaque, 1:1, ≥ 1024².** Le script aplatit l'alpha et avertit si la source raster
  n'est pas carrée / est trop petite. Préfère **toujours** le SVG (net à toute taille).
- **Fidélité avant tout** (2.3) : les screenshots encadrent la **vraie** app, jamais un rendu inventé.
- **Localise** : une passe de captures **par langue** livrée (FR/EN au minimum si l'app est bilingue).
- **Cohérence de marque** : `--bg` / `--caption-color` alignés sur le kit UI (un accent, pas dix couleurs).
- **Ne jamais surpromettre** : sans device ni capture, on **guide**, on n'automatise pas une capture qui
  n'existe pas.
