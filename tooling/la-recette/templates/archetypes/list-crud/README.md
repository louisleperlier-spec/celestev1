# Archétype `list-crud` — liste + détail + CRUD

> **Le moment magique** : l'utilisateur crée une entrée qui lui appartient, la retrouve
> dans une liste propre, l'ouvre, la modifie, la supprime. Ça persiste, c'est à lui.
>
> **Pour quelles idées** : carnet de recettes, notes, contacts, tâches, collection,
> favoris, wishlist, inventaire, journal de bord textuel… Tout ce qui est « une liste de
> choses que je gère ». C'est l'archétype le plus fréquent — quand un doute, c'est souvent
> lui (éventuellement combiné à un autre).

## Ce que fournit ce squelette

- **3 écrans** : liste (avec coche rapide + bouton +), détail/édition, création (modal).
- **Couche données** : table `items` + RLS, repository, hooks React Query avec
  **mutations optimistes** (l'UI répond avant le serveur, rollback si échec).
- Tous les **états** : chargement, erreur (retry), vide, contenu. Aucun écran blanc.

## Où va chaque fichier (clone → adapte)

| Fichier du template | Destination dans l'app scaffoldée |
|---|---|
| `db/001_items.sql` | `db/` (migration appliquée par la phase Backend) |
| `feature/*` | `src/features/items/` |
| `app/(tabs)/items.tsx` | `src/app/(tabs)/items.tsx` (un onglet) |
| `app/item/[id].tsx` | `src/app/item/[id].tsx` |
| `app/item/new.tsx` | `src/app/item/new.tsx` (déclarer en `presentation: 'modal'`) |

## Les points d'adaptation (à faire à chaque idée)

1. **Renomme l'entité** `Item` → ton entité (`Recipe`, `Note`, `Contact`…), partout :
   fichiers (`items-repository.ts` → `recipes-repository.ts`), types, clés de cache
   (`['items', uid]` → `['recipes', uid]`), routes (`/item/...` → `/recipe/...`).
2. **Remplace les champs** `title` / `note` / `done` par tes vrais champs métier — dans
   `db/001_items.sql`, `types.ts`, le repository (colonnes du `select`/`insert`) et les
   `TextField` des écrans. Si ton entité n'a pas d'état « fait/pas fait », retire la coche
   de la liste.
3. **Ajoute les clés i18n** utilisées, dans `src/lib/i18n/locales/fr.ts` **et** `en.ts`
   (les deux, toujours) :
   ```ts
   items: {
     title: 'Mes éléments', new: 'Nouvel élément', empty: 'Rien pour l’instant. Touche + pour commencer.',
     create: 'Créer', notFound: 'Introuvable', deleteConfirm: 'Supprimer cet élément ?',
     fieldTitle: 'Titre', fieldTitlePlaceholder: 'Donne un titre…',
     fieldNote: 'Note', fieldNotePlaceholder: 'Ajoute une note (optionnel)…',
   },
   common: { save: 'Enregistrer', delete: 'Supprimer', cancel: 'Annuler', back: 'Retour',
     loading: 'Chargement…', loadError: 'Impossible de charger', retry: 'Réessayer' },
   ```
4. **Branche l'onglet** dans `src/app/(tabs)/_layout.tsx` (nom + icône SF Symbol) et
   déclare la route modale `item/new` dans `src/app/_layout.tsx`.

## Critères d'acceptation (le smoke-test à cocher en `/preview`)

- [ ] L'app **boote** sur l'onglet et affiche l'état vide (pas d'écran blanc).
- [ ] Je **crée** une entrée → elle apparaît en tête de liste **sans recharger**.
- [ ] Je **rouvre l'app** (kill + relance) → l'entrée est **toujours là** (elle a persisté).
- [ ] J'**ouvre** une entrée, je **modifie** un champ, j'enregistre → le changement se voit
      dans la liste.
- [ ] Je **supprime** → elle disparaît, et ne revient pas après un refresh.
- [ ] Un **autre compte** ne voit pas mes entrées (RLS — testable en `/preview` avec 2 comptes).
