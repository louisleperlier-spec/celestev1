# lume-coach-ai-proxy

Petit Cloudflare Worker qui fait l'intermédiaire entre l'app Lume et l'API Gemini. Sa seule
raison d'être : la clé Gemini ne doit jamais atterrir dans le bundle Expo (une app distribuée
peut être décompilée et une clé qui y traîne est extraite en quelques minutes). Ce Worker la
détient côté serveur, l'app ne lui envoie que des chiffres non identifiants.

## Déploiement (une fois)

Prérequis : un compte Cloudflare gratuit.

```bash
cd server/coach-ai-proxy
npm install
npx wrangler login          # ouvre le navigateur, autorise l'accès à ton compte Cloudflare
npx wrangler deploy         # publie le Worker, affiche son URL (https://lume-coach-ai-proxy.<ton-sous-domaine>.workers.dev)
```

## Où coller ta clé Gemini

**Pas dans un fichier du repo.** Une fois le Worker déployé :

```bash
npx wrangler secret put GEMINI_API_KEY
# colle ta clé récupérée sur aistudio.google.com quand la commande te la demande
```

Optionnel mais recommandé — un jeton partagé pour éviter que n'importe qui trouvant l'URL du
Worker ne consomme ton quota Gemini gratuit (ce n'est qu'un déterrent, pas une vraie
authentification — voir le commentaire en tête de `src/index.ts`) :

```bash
npx wrangler secret put CLIENT_TOKEN
# invente une longue chaîne aléatoire, ex: openssl rand -hex 32
```

Ces deux secrets sont stockés chiffrés par Cloudflare, jamais dans ce repo.

## Côté app Expo

Dans le fichier `.env` à la racine du repo Lume (jamais commité — voir `.env.example`) :

```
EXPO_PUBLIC_COACH_BACKEND_URL=https://lume-coach-ai-proxy.<ton-sous-domaine>.workers.dev
EXPO_PUBLIC_COACH_CLIENT_TOKEN=<le même CLIENT_TOKEN que ci-dessus, si tu l'as défini>
```

Ces deux valeurs sont des `EXPO_PUBLIC_*` : elles sont normalement visibles dans le bundle
client (c'est prévu, ce sont l'URL du proxy et un déterrent léger — pas des secrets forts).
**`GEMINI_API_KEY` n'apparaît jamais côté client, nulle part.**

## Développement local

```bash
cp .dev.vars.example .dev.vars   # puis remplis avec une clé de test
npm run dev                       # wrangler dev, sert le Worker en local
```

## Ce que fait/ne fait pas ce Worker

- Un seul endpoint : `POST /coach-copy` avec `{ "userPrompt": "..." }`.
- Le prompt système strict (garde-fous santé) vit dans `src/system-prompt.ts`, codé en dur côté
  serveur — un `systemPrompt` envoyé par le client serait ignoré. Il doit rester identique à
  `src/features/coach/ai-system-prompt.ts` côté app ; si tu modifies l'un, modifie l'autre.
- Aucune persistance, aucun log de contenu, aucune base de données.
- Renvoie `{ "error": "rate_limited" }` (429) si Gemini limite, `502` sur toute autre panne
  amont — l'app bascule alors sur son texte de repli déterministe (voir
  `src/features/coach/ai-copy.ts`), elle ne plante jamais.
