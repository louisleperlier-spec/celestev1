---
description: Met tout en ligne d'un coup — code sur GitHub, site sur Vercel, backend Supabase (migrations + edge functions).
---

# /deploy — tout mettre en ligne, en une passe

Cette commande pousse **tous** les changements au bon endroit, dans le bon ordre, sans que la personne
touche à quoi que ce soit. C'est la commande « rends mes changements réels et visibles ».

## 0. Constitution
Applique **recette-core**. Tu fais les trois étapes toi-même. Tu confirmes seulement si un déploiement est
**visible du public** ou **coûteux**. Vérifie que `.recette/secrets.env` est présent (sinon → `/setup`).

## 1. Ce que `/deploy` fait (annonce-le en une phrase)
« Je sauvegarde ton code, je mets ton site à jour, et j'applique les changements de base de données — tout
d'un coup. »

Ordre imposé (le backend d'abord si le site en dépend ; sinon l'ordre ci-dessous convient) :

### a) Git — sauvegarder + envoyer le code
- Récapitule en une phrase **ce qui a changé** (traduit en humain : « j'ai changé la couleur du bouton et
  corrigé l'écran de connexion »).
- `git add -A` → `git commit` avec un message clair → `git push`.
- ⚠️ Vérifie la branche courante (`git branch --show-current`). L'app est souvent sur `master`, la landing
  sur `main` — **ne te trompe pas de repo/branche**. Ne pousse jamais `.recette/secrets.env` (il est
  gitignore — reconfirme).

### b) Vercel — publier le site (landing)
- **Garde-fou `siteUrl` (bloquant).** Avant tout deploy, vérifie `landing/lib/config.ts` : si `siteUrl`
  vaut encore un placeholder (`REMPLACE-MOI`, `example.com`, `localhost`, un domaine qui n'est pas le tien)
  ou n'est pas en `https://`, **ARRÊTE et avertis fort** : canonical/sitemap/OG/hreflang pointeraient vers
  le mauvais domaine → **désindexation silencieuse**. Corrige `siteUrl` (domaine custom, ou l'URL Vercel
  réelle récupérée au 1er deploy) puis reprends. (Le socle `nextjs-landing` fait déjà casser le build dans
  ce cas — ne le contourne pas.)
- **Lier le projet SANS prompt interactif (avant le deploy).** Un `vercel deploy` sur un dossier non lié
  pose des questions (« Link to existing project? », « scope? ») → un agent **hang**. On lie en `--yes`,
  de façon **idempotente**, détectée par la présence de `.vercel/project.json`. ⚠️ **Choisis la syntaxe de
  TON shell** — l'agent tourne en **PowerShell sur Windows** et en **bash sur Mac** ; ne sers jamais un
  `if [ … ]` ou un `$VAR` bash à un shell PowerShell (ça plante). Le token se lit depuis
  `.recette/secrets.env` et se pose en variable d'environnement de la session.

  **PowerShell (Windows)** :
  ```powershell
  Set-Location landing
  $env:VERCEL_TOKEN = "<valeur lue depuis .recette/secrets.env>"
  if (-not (Test-Path .vercel/project.json)) {
    npx --yes vercel link --yes --token $env:VERCEL_TOKEN     # zéro question, crée/lie le projet
  }
  npx --yes vercel deploy --prod --token $env:VERCEL_TOKEN
  ```

  **bash (Mac/Linux)** :
  ```bash
  cd landing
  export VERCEL_TOKEN="<valeur lue depuis .recette/secrets.env>"
  if [ ! -f .vercel/project.json ]; then
    npx --yes vercel link --yes --token "$VERCEL_TOKEN"       # zéro question, crée/lie le projet
  fi
  npx --yes vercel deploy --prod --token "$VERCEL_TOKEN"
  ```
  (Ou laisse le déploiement auto sur push si le repo GitHub est déjà connecté à Vercel — dans ce cas le
  `git push` ci-dessus suffit, tu vérifies juste que le déploiement part. `vercel link` reste utile pour
  les deploys CLI manuels.)
- **1er deploy sans domaine custom** : récupère l'URL `*.vercel.app` retournée, **colle-la dans
  `siteUrl`**, puis **redéploie** pour que canonical/sitemap/OG soient corrects.
- Attends l'URL de prod, **teste qu'elle répond en 200** (surtout `/privacy` `/terms` `/support` — un 404
  là = rejet Apple plus tard).

### c) Supabase — appliquer le backend
- **Migrations** (changements de base de données) : applique le SQL versionné via la Management API
  (`POST https://api.supabase.com/v1/projects/{ref}/database/query`) — dans l'ordre, sans rejouer ce qui
  l'est déjà (migrations idempotentes).
- **Edge Functions** (le code serveur, ex. le proxy IA) : déploie-les sans Docker via l'API. Pose d'abord
  le token dans la session **selon ton shell**, puis déploie :
  - **PowerShell** : `$env:SUPABASE_ACCESS_TOKEN = "<val>"`
  - **bash** : `export SUPABASE_ACCESS_TOKEN=<val>`

  puis (identique aux deux) `npx --yes supabase@latest functions deploy <name> --project-ref <ref>` (ajoute
  `--no-verify-jwt` seulement si la fonction est publique par design). Redéploie **toutes** les fonctions
  modifiées.
- Vérifie que les **secrets de fonction** (OPENAI_API_KEY, REVENUECAT_WEBHOOK_SECRET…) sont bien posés —
  ils persistent entre déploiements, mais confirme-le si tu viens d'en ajouter un.

## 2. Self-verify avant de dire « c'est en ligne »
- Landing : URL de prod en 200 + pages légales en 200.
- Backend : un appel test à l'Edge Function principale répond (ou au moins ne renvoie pas 500).
- Si quelque chose casse → **doctor** (rassure → explique → corrige), ne laisse jamais un déploiement à
  moitié fait sans le dire.

## 3. Reporter simplement
Termine par un récap humain : « ✅ Code sauvegardé · ✅ Site à jour (lien) · ✅ Backend appliqué. » Puis la
prochaine action logique (tester avec `/preview`, ou publier avec `/app-store`).

> Note : `/deploy` **ne fait pas** de build iOS ni de soumission App Store (ça, c'est `/update` et
> `/app-store`). Ici on parle du code, du site et du backend — pas de l'app sur l'App Store.
