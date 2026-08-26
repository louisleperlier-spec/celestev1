# Archétype `browse-catalog` — parcourir / chercher / filtrer + favoris

> **Le moment magique** : l'utilisateur explore un catalogue soigné, **cherche** ce qu'il
> veut, **filtre** par catégorie, ouvre une fiche, et **garde ses favoris** d'un cœur qui
> répond au doigt. C'est le plaisir de « fouiner » dans une collection bien rangée.
>
> **Pour quelles idées** : recettes, exercices/programmes, produits (shopping/vitrine),
> lieux (restos, spots, événements), cours/leçons, modèles/presets, plantes, films… Tout ce
> qui est « une bibliothèque de contenu qu'on parcourt et dont on garde des favoris ».

## Ce que fournit ce squelette

- **2 écrans** : catalogue (barre de **recherche** + **puces de filtre** par catégorie + puce
  **Favoris**, liste de cartes avec cœur) et détail (infos + tags + favori).
- **Filtrage côté serveur** : la recherche (`ilike`) et la catégorie (`eq`) sont faites en
  base — on ne charge pas tout pour filtrer ensuite. Le filtre « Favoris » se fait côté client.
- **Couche données** : `catalog_items` (lecture **publique** aux connectés, **seedable**) +
  `favorites` (privés, RLS), repository, hooks React Query. **Favoris optimistes** (le cœur
  bascule instantanément, rollback si échec).

## Où va chaque fichier (clone → adapte)

| Fichier du template | Destination |
|---|---|
| `db/001_catalog.sql` | `db/` (migration + **seed** à remplacer, phase Backend) |
| `feature/*` | `src/features/catalog/` |
| `app/(tabs)/catalog.tsx` | `src/app/(tabs)/catalog.tsx` |
| `app/catalog/[id].tsx` | `src/app/catalog/[id].tsx` |

## Les points d'adaptation

1. **Renomme l'entité** `CatalogItem` → la tienne (`Recipe`, `Workout`, `Product`, `Place`…)
   partout : `catalog-repository.ts` → `recipes-repository.ts`, clés de cache
   (`['catalog', …]`), routes (`/catalog/...`).
2. **Remplace les champs** `title` / `subtitle` / `category` / `tags` / `description` par les
   tiens, dans `db/001_catalog.sql`, `types.ts`, le repository (`select`) et les deux écrans.
   Une image ? Ajoute une colonne `image_path` + sers-la via **URL signée** depuis un bucket
   (mêmes précautions que l'archétype média : jamais l'image brute en base).
3. **Le catalogue (le contenu)** : remplace le **seed** de `db/001_catalog.sql` par tes vraies
   fiches (SQL, import CSV, ou une petite fonction d'admin). Le catalogue est en **lecture
   seule** côté app — personne ne l'écrit depuis le téléphone.
4. **Les catégories** : édite `CATEGORIES` dans `catalog.ts` (leurs `id` = la colonne
   `category` du seed). Beaucoup de catégories / dynamiques ? Charge-les via
   `select distinct category` au lieu de la liste figée.
5. **i18n FR *et* EN** (mêmes clés des deux côtés) :
   ```ts
   common: { loadError: 'Impossible de charger', retry: 'Réessayer' },
   catalog: {
     title: 'Catalogue', searchPlaceholder: 'Rechercher…',
     cat: { all: 'Tout', featured: 'À la une', trending: 'Tendances', classics: 'Classiques', favorites: 'Favoris' },
     favorite: 'Ajouter aux favoris', unfavorite: 'Retirer des favoris',
     empty: 'Aucun résultat.', emptyFavorites: 'Aucun favori pour l’instant.', notFound: 'Introuvable',
   },
   ```
6. **Branche l'onglet** dans `src/app/(tabs)/_layout.tsx` (nom + icône SF Symbol
   `square.grid.2x2`) et déclare la route `catalog/[id]` dans `src/app/_layout.tsx`.

## Critères d'acceptation (le smoke-test à cocher en `/preview`)

- [ ] L'app **boote** sur le catalogue rempli par le seed (pas d'écran blanc).
- [ ] Je **tape** dans la recherche → la liste se **réduit** aux titres correspondants.
- [ ] Je touche une **puce de catégorie** → la liste ne montre que cette catégorie ; re-toucher
      la puce enlève le filtre.
- [ ] J'ouvre une fiche → le **détail** (tags, description) s'affiche.
- [ ] Je touche le **cœur** → il se remplit **instantanément** ; la puce **Favoris** ne montre
      que mes favoris.
- [ ] Je **rouvre l'app** (kill + relance) → mes favoris sont **conservés** (ils ont persisté).
- [ ] Un **autre compte** voit le **même catalogue** mais **pas mes favoris** (RLS des favoris).
