---
description: Branche et vérifie tous tes comptes une seule fois (GitHub, Supabase, Vercel, Expo, RevenueCat, OpenAI, Apple).
---

# /setup — brancher les comptes (le point critique)

C'est l'étape qui casse le plus souvent chez les débutants. Ton job : ramasser **7 secrets**, en **vérifier
chacun par un vrai appel** (pas juste « c'est collé »), et tout ranger dans un fichier local **jamais
partagé**. À la fin, un tableau vert/rouge dit exactement ce qui marche.

> ⏱️ **Dis-lui la vérité sur le temps, dès le premier mot.** C'est **l'étape humaine la plus longue** de
> toute La Recette : compte **~45 à 90 min réalistes**. Pas parce que c'est difficile — parce qu'il faut
> **créer 6 comptes** (inscription + confirmation d'e-mail + parfois double authentification + une carte
> bancaire pour l'IA). Tout le reste, c'est moi qui le fais. Annonce-le **avant** de commencer, sinon la
> promesse « en quelques heures » se casse par surprise ici — et rassure aussitôt : **on ne le fait
> qu'une seule fois, ces comptes te resservent pour toutes tes prochaines apps.**

## 0. Constitution
Applique le skill **recette-core**. Rappels qui comptent ici : **zéro jargon nu** (un « token » = « un mot
de passe spécial que le service te génère pour que je puisse agir en ton nom »), tu ne demandes que ce que
**lui seul** peut faire (aller chercher le token), et **jamais de stacktrace** : si une vérif échoue, tu
rassures → tu expliques en une phrase → tu donnes LA seule action pour réparer.

## 1. Prépare la machine — les outils de base (fais ça AVANT tout token)
Un débutant part souvent d'un ordinateur **vierge** : ni Node, ni Git, ni GitHub CLI. Si tu réclames un
token avant d'avoir vérifié ça, la toute première commande plantera avec un « `'gh' n'est pas reconnu` » —
exactement la stacktrace brute que la constitution t'interdit de montrer. Donc **d'abord, tu prépares la
machine, toi-même, en silence.** Tu ne fais jamais taper ces commandes au débutant : tu les lances, tu
**interprètes** le résultat, tu ne recopies jamais l'erreur brute à l'écran.

**Ce qu'il faut, et à quoi ça sert (une phrase chacun)** :
- **Node.js** (version **18 ou +**) — le moteur qui fait tourner mes scripts (vérif des comptes, création de l'app).
- **Git** — l'outil qui suit les versions du code de ton app.
- **GitHub CLI (`gh`)** — ce qui me connecte à ton GitHub sans que tu copies quoi que ce soit.
- **Claude Code** — moi. Tu me parles déjà à travers, je vérifie juste que je suis à jour.

**Détecte l'OS, puis teste chaque outil toi-même** — lance `node --version`, `git --version`,
`gh --version` (et `claude --version` pour moi). Un « command not found » / « n'est pas reconnu » ne se
recopie **jamais** tel quel : tu traduis → « Il me manque un petit outil de base (X), je te montre comment
l'ajouter en une minute. »

**Pour chaque outil manquant, donne LA seule action selon l'OS, puis RE-VÉRIFIE** (une à la fois) :

- **Node.js** — Windows : `winget install OpenJS.NodeJS.LTS` (je peux le lancer ; une fenêtre Windows peut
  demander « Autoriser ? » → Oui). Sinon l'installeur : https://nodejs.org (bouton **LTS**).
  Mac : installeur `.pkg` https://nodejs.org (bouton **LTS**), ou en une commande `brew install node` si Homebrew est là.
- **Git** — Windows : `winget install Git.Git`, sinon https://git-scm.com/download/win.
  Mac : `xcode-select --install` (fournit Git), ou l'installeur https://git-scm.com/download/mac.
- **GitHub CLI (`gh`)** — Windows : `winget install GitHub.cli`, sinon https://cli.github.com.
  Mac : installeur https://cli.github.com, ou `brew install gh`.
- **Claude Code** — je suis déjà là. Si `claude --version` est ancien, je te propose `npm i -g @anthropic-ai/claude-code` (une fois Node installé).

> ⚠️ **PATH pas rafraîchi après une install — le piège qui fait échouer le `--version` juste après.**
> Quand `winget`/`brew` viennent d'installer Node (ou Git/gh), le nouveau binaire est bien sur le disque,
> mais **le PATH de ta session shell actuelle ne le connaît pas encore** — et tu ne peux pas redémarrer ton
> propre shell. Résultat : `node --version` répond encore « n'est pas reconnu » **dans le même shell**,
> alors que tout est bon. Avant de conclure à un échec, **réinjecte le PATH dans la session** :
> - **Windows (PowerShell)** — recompose le PATH depuis le registre (Machine + User), sans redémarrer :
>   ```powershell
>   $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
>   ```
>   puis relance `node --version`.
> - **Mac / Linux (bash/zsh)** — recharge l'environnement Homebrew et le profil :
>   ```bash
>   eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null || eval "$(/usr/local/bin/brew shellenv)" 2>/dev/null; . ~/.zprofile 2>/dev/null; . ~/.zshrc 2>/dev/null; . ~/.bash_profile 2>/dev/null; true
>   ```
>   puis relance `node --version`.
> - **Si le binaire reste introuvable même après ça** : n'insiste pas en boucle. Dis-le comme une **étape
>   humaine assumée**, pas comme un blocage : « L'outil est bien installé, il ne manque qu'un
>   redémarrage : **ferme et rouvre Claude Code une fois**, puis on reprend là où on en est (rien n'est
>   perdu). » Jamais de blocage silencieux, jamais de stacktrace brute.

**Re-vérifie AVANT de continuer.** Après chaque install, réinjecte le PATH (ci-dessus) puis relance
`… --version`. Tant qu'un outil de base manque, **tu ne passes pas aux tokens** — sinon tu envoies le
débutant droit dans le mur. Quand `node`, `git` et `gh` répondent tous une version, dis-le simplement :
« Ta machine est prête. » puis enchaîne.

> Cul-de-sac interdits : si `winget` est absent (vieux Windows), bascule sur l'installeur direct (liens
> ci-dessus). Sur Mac sans Homebrew, privilégie l'installeur `.pkg` direct — n'envoie **jamais** un débutant
> installer Homebrew d'abord (rabbit-hole garanti).

## 2. Où ranger les secrets (fais-le d'abord, en silence)
Les secrets vivent dans `.recette/secrets.env`, **dans le dossier de l'app**. **Ce fichier ne doit JAMAIS
partir sur GitHub.** Normalement `/new` (via `new-app.mjs`) a déjà créé ce fichier **vide** et l'a mis dans
`.gitignore` : si c'est le cas, contente-toi de le vérifier. Sinon, crée-les **avant** d'écrire un secret.
- Ajoute `.recette/` à `.gitignore` (crée-le s'il n'existe pas) **avant** d'y écrire quoi que ce soit.
- Un secret = une ligne `CLE=valeur`. Ne les affiche jamais en entier à l'écran (masque : `ghp_••••1a2b`).
- Si le fichier existe déjà, relis-le : ne redemande QUE les secrets manquants ou cassés.

## 3. Ramasse-les UN PAR UN (jamais les 7 d'un coup)
**Ne suppose JAMAIS que le compte existe déjà.** C'est le vrai gouffre de temps et le premier point
d'abandon. Pour chaque secret, suis toujours le même parcours en 4 temps :
1. **« Tu as déjà un compte X ? »** Si non : ouvre le lien d'**inscription**, crée le compte, **confirme
   l'e-mail** (et fais la double authentification si le service la demande) — c'est ça qui prend du temps,
   c'est normal, rassure.
2. **Explique à quoi sert le token** en une phrase, puis va le **générer** (lien direct + où cliquer).
3. **« Colle-le ici »** — tu le ranges dans `.recette/secrets.env` (jamais affiché en entier).
4. **Vérifie tout de suite** en relançant `verify-secrets.mjs` (voir §4) : ce script est **la seule source
   de vérité**. ✅ vert = on avance ; ⛔ rouge = LA phrase pour réparer, et on reste dessus.

> ⚠️ Les vérifs qui suivent lisent chaque secret depuis `.recette/secrets.env`. Un token peut se balader
> avec un retour chariot Windows collé au bout — **strippe le `\r`/espaces** avant de t'en servir.

### a) GitHub — héberger le code de ton app
« GitHub, c'est le coffre-fort en ligne où vit le code de ton app (repo privé, personne ne le voit). »
- **Tu as déjà un compte GitHub ?** Sinon, crée-le (gratuit) → https://github.com/signup, **confirme
  l'e-mail**, puis reviens. Ne suppose pas qu'il en a un.
- Le plus simple pour les opérations Git : `gh auth login` (connexion navigateur, aucun token à copier).
  Mais pour que la vérif automatique (§4) **voie** ton accès, le mieux reste un **Personal Access Token**.
  ⚠️ **On impose le token « classic »** dans toute La Recette (cohérence setup ↔ doctor) — pas le
  fine-grained (qui expose des *permissions* au lieu des scopes `repo`/`workflow` et prête à confusion) :
  https://github.com/settings/tokens → *Generate new token (classic)* → cocher `repo` + `workflow` →
  coller ici. On le range en `GITHUB_TOKEN=`.
- **Vérif** : `verify-secrets.mjs` teste ce token en direct (appel à l'API GitHub). Si tu as choisi la
  connexion navigateur **sans** token, le script ne peut pas la voir : je confirme alors avec
  `gh auth status` (*Logged in*) et je marque GitHub vert à la main.
- ⛔ Si échec : « Ton accès GitHub n'est pas encore actif. Refais juste la connexion : je lance `gh auth
  login`, une page s'ouvre, tu cliques *Authorize* — c'est tout. »

### b) Supabase — la base de données + les comptes utilisateurs de ton app
« Supabase gère les comptes de tes utilisateurs et stocke leurs données (gratuit pour commencer). »
- **Tu as déjà un compte Supabase ?** Sinon, crée-le (gratuit) → https://supabase.com/dashboard/sign-up,
  **confirme l'e-mail**, puis reviens.
- **Access token** : https://supabase.com/dashboard/account/tokens → *Generate new token* → coller ici.
  On le range en `SUPABASE_ACCESS_TOKEN=`.
- **Vérif** : `verify-secrets.mjs` teste ce token en direct (appel à la Management API Supabase → **200**).
- ⚠️ **Rappelle le plafond** : le plan gratuit Supabase autorise **2 projets max**. `/build` réutilise un
  projet existant, il n'en recrée jamais un troisième. Si la personne en a déjà 2 d'autres apps, préviens-la.
- ⛔ Si 401 : « Ton token Supabase est refusé (expiré ou mal copié). Régénère-le ici :
  https://supabase.com/dashboard/account/tokens et recolle-le. »

### c) Vercel — mettre en ligne la landing (le site de ton app)
« Vercel héberge la page web de ton app (là où les gens la découvrent et cliquent *Télécharger*). »
- **Tu as déjà un compte Vercel ?** Sinon, crée-le (gratuit, tu peux te connecter avec ton GitHub) →
  https://vercel.com/signup, **confirme l'e-mail**, puis reviens.
- **Token** : https://vercel.com/account/tokens → *Create Token* → coller ici. Range en `VERCEL_TOKEN=`.
- **Vérif** : `verify-secrets.mjs` teste ce token en direct (appel à l'API Vercel → **200**).
- ⛔ Si échec : « Vercel ne reconnaît pas ce token. Recrée-en un ici :
  https://vercel.com/account/tokens (laisse *Scope* sur ton compte) et recolle-le. »

### d) Expo / EAS — fabriquer et publier ton app iPhone (sans Mac)
« Expo/EAS construit ton app dans le cloud et l'envoie à l'App Store — c'est ce qui te permet de publier
depuis un PC Windows, sans Mac. »
- **Tu as déjà un compte Expo ?** Sinon, crée-le (gratuit) → https://expo.dev/signup, **confirme
  l'e-mail**, puis reviens.
- **Token** : https://expo.dev/settings/access-tokens → *Create token* → coller ici. Range en `EXPO_TOKEN=`.
- **Vérif** : `verify-secrets.mjs` teste ce token en direct (appel à l'API Expo → ton compte s'affiche).
- ⛔ Si vide/erreur : « Ton token Expo n'est pas passé. Recrée-en un ici :
  https://expo.dev/settings/access-tokens et recolle-le — attention à ne pas copier d'espace au bout. »

### e) RevenueCat — les abonnements payants dans ton app
« RevenueCat gère les abonnements (l'écran *Passez au Premium*). Gratuit tant que tu gagnes peu. »
- **Tu as déjà un compte RevenueCat ?** Sinon, crée-le (gratuit) → https://app.revenuecat.com/signup,
  **confirme l'e-mail**, puis reviens.
- **Secret API key (v2), au niveau du PROJET** : https://app.revenuecat.com → **ton projet** →
  *Project settings* → *API keys* → copie la **clé secrète** (`sk_…`). Range en `REVENUECAT_SECRET_KEY=`.
  (La clé v2 est **par projet**, pas au niveau du compte. La clé *publique* `appl_…` viendra au moment du
  paywall, pas maintenant.)
- **Vérif** : `verify-secrets.mjs` teste la clé en direct (appel à l'API v2 RevenueCat `/v2/projects` → **200**).
- ⛔ Si échec : « RevenueCat refuse la clé — tu as peut-être copié la clé *publique* au lieu de la *secrète*,
  ou une clé qui n'est pas au niveau du projet. Reprends la clé qui commence par `sk_` ici :
  https://app.revenuecat.com → ton projet → Project settings → API keys. »

### f) OpenAI — l'intelligence artificielle (si ton app en a besoin)
« OpenAI fournit l'IA (générer du texte, des réponses…). Optionnel : on ne le branche que si ton app
utilise l'IA. » Si l'idée n'implique pas d'IA, **saute** ce secret et note-le comme *non requis*.
- **Tu as déjà un compte OpenAI ?** Sinon, crée-le → https://auth.openai.com/create-account, **confirme
  l'e-mail** (double authentification possible), puis reviens. **Étape en plus, souvent oubliée** :
  l'IA est **payante à l'usage**, il faut donc **ajouter une carte bancaire + un peu de crédit** →
  https://platform.openai.com/settings/organization/billing. Sans crédit, la clé existera mais renverra une
  erreur de quota. Préviens : c'est la seule étape de /setup qui demande une carte.
- **Clé** : https://platform.openai.com/api-keys → *Create new secret key* → coller ici. Range en
  `OPENAI_API_KEY=`.
- **Vérif** : `verify-secrets.mjs` teste la clé en direct (appel à l'API OpenAI). Un *429
  insufficient_quota* = clé bonne mais **pas de crédit** → ajoute un moyen de paiement (billing ci-dessus).
- ⚠️ Précise que l'IA **coûte à l'usage** (quelques centimes par appel) et qu'un budget/quota se règle sur
  le compte OpenAI. Cette clé restera **côté serveur uniquement** (jamais dans l'app) — tu le rappelles.
- ⛔ Si 401 : clé invalide → recréer. Si 429 *insufficient_quota* : « ta clé marche mais ton compte OpenAI
  n'a pas de crédit — ajoute un moyen de paiement ici :
  https://platform.openai.com/settings/organization/billing ».

### g) Apple — le seul que je ne peux pas automatiser
« Apple exige une connexion humaine avec double authentification (le code qui arrive sur ton iPhone). Je ne
peux pas cliquer à ta place, mais je te guide écran par écran le moment venu. »
- **Compte ?** L'identifiant Apple de son iPhone suffit pour commencer, mais le **compte qui compte** est
  l'inscription **payante** au Apple Developer Program (99 $/an) — ne suppose **jamais** qu'elle est déjà
  faite (voir prérequis ci-dessous).
- Ce qu'on **note maintenant** (pas de vérif automatique possible) : l'**e-mail Apple Developer** →
  `APPLE_ID=`, et si elle le connaît, le **Team ID** (App Store Connect → *Membership*) → `APPLE_TEAM_ID=`.
- **Prérequis à vérifier avec elle, pas dans un terminal** : a-t-elle payé le **Apple Developer Program
  (99 $/an)** et signé les **contrats** dans App Store Connect (*Agreements, Tax and Banking*) ? Sinon,
  l'app ne pourra pas être soumise plus tard — préviens dès maintenant, guide vers
  https://developer.apple.com/programs/enroll/.
- La vraie connexion Apple (login + code 2FA) se fera **au premier build EAS** : tu la préviens que ce
  jour-là, elle devra avoir son iPhone à portée pour taper le code.

## 4. Le tableau final — la seule source de vérité : `verify-secrets.mjs`
Ne reconstruis **jamais** ce tableau de mémoire. Une fois les secrets rangés dans `.recette/secrets.env`,
**lance le script** de La Recette — il relit le fichier, teste **chaque** token par un vrai appel réseau, et
imprime lui-même le tableau vert/rouge :

```
node "$CLAUDE_PROJECT_DIR/scripts/verify-secrets.mjs"
```

Il retrouve tout seul `.recette/secrets.env` (en remontant les dossiers), **saute proprement** les secrets
absents (ex. OpenAI si l'app n'a pas d'IA), et pour chaque échec donne **le lien exact** pour régénérer le
token. Le tableau que tu montres au débutant, c'est **sa sortie** — pas une version que tu réécris. C'est
**exactement** le même script que lit `/status`, pour que les deux racontent toujours la même chose.

La sortie ressemble à ça (c'est **exactement** ce que le script imprime — 8 lignes, dont **deux** pour
Supabase et une pour App Store Connect) :

```
  Service                   État    Détail
  ------------------------  ------  ----------------------------------------
  GitHub                      OK    connecté en tant que @ton-compte
  Supabase (Management)       OK    Management API OK (1 projet(s))
  Supabase (service_role)   absent  SUPABASE_URL + SERVICE_ROLE_KEY requis
  Vercel                      OK    connecté : ton-compte
  Expo / EAS                  OK    connecté : ton-compte
  RevenueCat                  OK    API v2 OK (1 projet(s))
  OpenAI                      OK    clé valide (63 modèles accessibles)
  App Store Connect         absent  App Store Connect API non configurée (optionnel)

  6 OK · 0 à corriger · 2 non configuré(s)
```

> ⚠️ **Les deux lignes `absent` à ce stade sont NORMALES — ce ne sont PAS des échecs :**
> - **Supabase (service_role)** : cette clé n'existe **qu'une fois le projet Supabase créé**, au **build**
>   (`/build`, phase Infra/Backend). Pendant `/setup` elle est logiquement absente. Rassure : « elle
>   viendra toute seule au moment où je construis ton backend ». Ne la traite jamais comme un rouge.
> - **App Store Connect** : la clé API `.p8` est **optionnelle ici** ; on la posera au moment de publier
>   (`/app-store`) pour rendre le 1er build EAS non-interactif. Absente à `/setup` = attendu.
>
> Ce qui compte pour dire « comptes branchés » à ce stade : **GitHub, Supabase (Management), Vercel,
> Expo/EAS, RevenueCat** en `OK` (+ **OpenAI** si l'app a de l'IA, sinon `absent`/non requis).

> Seule exception au tout-automatique : si tu as branché GitHub par connexion navigateur (`gh auth login`)
> **sans** token, le script ne peut pas la voir — confirme alors GitHub avec `gh auth status` et marque-le
> vert à la main. App Store Connect, lui, reste `absent` (manuel) à ce stade.

- **Tout vert** → « Tes comptes sont branchés, une bonne fois pour toutes. La suite : me raconter ton idée
  d'app. Je lance `/new` ? »
- **Un rouge** → reste dessus : rappelle LA seule action pour le réparer (le script te donne déjà le lien),
  propose de re-vérifier dès qu'elle a recollé. Ne passe jamais à la suite avec un ⛔ sur un secret
  réellement nécessaire à l'app.

## 5. Sécurité (non négociable)
- Ne recopie **jamais** un secret en clair dans un message, un commit, ou un fichier suivi par git.
- Confirme à voix haute que `.recette/` est bien dans `.gitignore` avant de finir.
- Rappelle qu'après le lancement de l'app, ces tokens peuvent être **révoqués/régénérés** par sécurité.
