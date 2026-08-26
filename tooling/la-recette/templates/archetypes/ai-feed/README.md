# Archétype `ai-feed` — feed + génération IA

> **Le moment magique** : l'utilisateur écrit une demande, l'IA lui rend quelque chose
> d'utile en quelques secondes, et ça vient s'ajouter à SON feed (gardé, refaçonnable,
> mis en favori). La valeur perçue est immédiate — c'est le cœur d'une app IA.
>
> **Pour quelles idées** : générateur de texte (bio, légendes, e-mails, poèmes, prières,
> idées, plans de séance, recettes à partir d'ingrédients…), coach/assistant qui répond,
> tout ce qui « transforme une saisie en résultat » via un modèle.

## Ce que fournit ce squelette

- **3 écrans** : feed (galerie des créations), composition (saisie → génération), détail.
- **Edge Function `generate`** : proxy IA **clé côté serveur uniquement**, anti-injection,
  timeout 20 s, **rate-limit** anti-abus (table `generation_events`), sortie JSON stricte.
- **Couche données** : `creations` + RLS, repository, hooks React Query, plus
  `use-generate` qui enchaîne appel IA → sauvegarde → rafraîchissement du feed.

## Où va chaque fichier (clone → adapte)

| Fichier du template | Destination |
|---|---|
| `db/001_creations.sql` | `db/` (migration, phase Backend) |
| `edge/generate/index.ts` | `supabase/functions/generate/index.ts` (à déployer) |
| `feature/*` | `src/features/creations/` |
| `app/(tabs)/feed.tsx` | `src/app/(tabs)/feed.tsx` |
| `app/creation/[id].tsx` | `src/app/creation/[id].tsx` |
| `app/creation/new.tsx` | `src/app/creation/new.tsx` (modal) |

## Les points d'adaptation

1. **Le `SYSTEM_PROMPT`** de `edge/generate/index.ts` : c'est LUI qui donne sa valeur à
   l'app. Décris précisément ce que le modèle doit produire, le ton, les garde-fous. Si
   ton app touche un **domaine sensible** (santé, finance, droit), verrouille : pas de
   conseil dangereux (guideline Apple 1.4).
2. **La forme de sortie** : ici `{ text }`. Si tu renvoies plus (titre, tags, image),
   adapte le JSON de l'edge, le type `GenerateResult`, la table `creations` et l'affichage.
3. **Renomme** `Creation` → ton entité si pertinent (`Caption`, `Poem`, `Plan`…).
4. **Déploie l'edge function** (phase Backend) et **pose le secret** :
   `supabase secrets set OPENAI_API_KEY=...` puis
   `supabase functions deploy generate --no-verify-jwt` (l'auth est gérée dans la fonction).
5. **Quota / premium** : les plafonds du rate-limit sont des exemples. Pour un modèle
   freemium (X gratuits puis Premium), branche le quota sur la table `profiles` — voir le
   skill `revenuecat-subscriptions`.
6. **Écran de consentement IA** nommant le prestataire (OpenAI) : **obligatoire** pour
   Apple (5.1.2). À poser au 1er usage. Les pages légales doivent aussi nommer OpenAI.
7. **Clés i18n** à ajouter dans `fr.ts` **et** `en.ts` :
   ```ts
   feed: {
     title: 'Mon feed', new: 'Créer', empty: 'Ton feed est vide. Compose ta première création.',
     composeTitle: 'Que veux-tu créer ?', promptPlaceholder: 'Décris ce que tu veux…',
     generate: 'Générer', favorite: 'Favori', unfavorite: 'Retirer des favoris',
     notFound: 'Introuvable', deleteConfirm: 'Supprimer cette création ?',
     errorGeneric: 'La génération a échoué. Réessaie dans un instant.',
   },
   ```

## Critères d'acceptation (le smoke-test à cocher en `/preview`)

- [ ] L'app **boote** sur le feed vide (pas d'écran blanc).
- [ ] J'écris une demande, je touche **Générer** → un **loader** s'affiche, puis un résultat
      **apparaît en tête du feed** (le moment magique fonctionne pour de vrai).
- [ ] Le résultat **persiste** après un kill + relance de l'app.
- [ ] Une demande **abusive/vide** ne plante pas : message d'erreur clair, pas de spinner
      infini (timeout géré côté serveur).
- [ ] **Aucune clé IA dans le bundle** : `grep -rn "sk-"` et `grep -rn "OPENAI"` dans `src/`
      ne renvoient rien (la clé vit seulement dans le secret de l'edge function).
- [ ] Mes créations sont **privées** (RLS) : un autre compte ne les voit pas.
