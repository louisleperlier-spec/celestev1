---
name: doctor
description: >
  La base de pannes de La Recette — le runbook symptôme → cause probable → fix pas-à-pas + l'auto-réparation.
  Charge ce skill DÈS QU'UNE COMMANDE PLANTE ou que l'utilisateur signale que « ça marche pas » : erreur,
  crash, écran blanc, build qui échoue, 401/403, rejet Apple, message rouge, « c'est bloqué », « pourquoi
  ça marche pas », « erreur bizarre ». Claude le consulte AVANT de réfléchir dans le vide : il identifie le
  symptôme, applique le fix connu, retente, se self-vérifie ; si vraiment bloqué, il fait un stop propre +
  un rapport support. Charge-le aussi via /doctor et /fix.
---

# Doctor — la base de pannes + l'auto-réparation

> Une erreur, c'est **normal** et **attendu**. Le user a payé pour ne jamais voir une stacktrace brute.
> Ton job ici : reconnaître la panne dans cette base, appliquer le fix toi-même, retenter, vérifier — et
> ne parler au user qu'en langage humain. Tu ne réfléchis dans le vide qu'APRÈS avoir cherché ici.

## La boucle de réparation (ta méthode, à chaque panne)

1. **Capture le symptôme brut** (le message d'erreur exact, le code de sortie, quelle commande). Pour TOI,
   pas pour le user.
2. **Cherche ici d'abord.** Scanne l'index ci-dessous et la table. Un symptôme connu = un fix connu →
   applique-le directement, sans deviner.
3. **Applique le fix toi-même** (le maximum est automatisable : édition de fichier, migration, re-config,
   nouvelle tentative). Ne fais agir l'humain que pour ce que lui seul peut faire (coller un token, un clic
   Apple, trancher une décision).
4. **Retente la commande** qui avait planté.
5. **Self-vérifie** que c'est vraiment réparé (voir « Self-checks » plus bas — typecheck, bundle, boot, ou
   le check spécifique du fix). Ne dis JAMAIS « c'est réparé » sur une impression.
6. **Anti-boucle (DEUX plafonds).** **Par-fix : 2 tentatives max** sur le même fix — si ça re-plante à
   l'identique, tu **ne relances pas une 3e fois**. **Global : ~3 hypothèses distinctes max** sur le même
   problème — au-delà, tu arrêtes de deviner même si l'idée te paraît « nouvelle » (c'est ce plafond global
   qui protège vraiment son budget, pas seulement le par-fix). Et **aucun build EAS de diagnostic sans un
   "oui" explicite** du user (un build **coûte** : dis ce que ça coûte, attends le oui). Dès qu'un de ces
   plafonds est atteint → « Quand vraiment bloqué ». Jamais de loop qui brûle ses tokens ou son argent d'API.
   (Détail des plafonds : recette-core §4.)
7. **Parle au user au format constitution :** (a) rassure → (b) explique en UNE phrase simple → (c) dis ce
   que tu as corrigé, ou LA seule action qu'il te reste à faire faire. Jamais de liste de 5 trucs.
8. **Bug inédit ?** (rien ici ne matche) → résous-le proprement, PUIS **note-le dans `journal.md`** (format
   en bas). C'est ce qui rend La Recette meilleure à chaque client.

## Index rapide (symptôme → section)

| Ce que tu vois / ce qu'il dit | Va voir |
|---|---|
| Écran blanc au lancement, « unsupported SDK », « incompatible » sur le tél | [A1](#a1) |
| Le paywall / l'abo crashe l'app en test sur le tél | [A2](#a2) |
| Reset mot de passe : le lien de l'email ne fait rien / n'ouvre pas l'app | [A3](#a3) |
| « Je peux ni scroller ni swiper » sur un écran (scrollables imbriqués / carrousel) | [A4](#a4) |
| « Unable to resolve module » / écran rouge au bundling, souvent après un changement de deps | [A5](#a5) |
| Conflit de versions / « peer dependency » / une lib incompatible avec le SDK Expo | [A6](#a6) |
| Erreurs TypeScript rouges au build / `@/...` « cannot find module » | [A7](#a7) |
| Le lien reset/redirection est cassé **même en vrai build** (scheme mal réglé, pas juste Expo Go) | [A8](#a8) |
| Expo Go affiche « Something went wrong » / n'ouvre pas le projet (le SDK, lui, est bon) | [A9](#a9) |
| `401` / `403` / « unauthorized » / « invalid token » (Supabase, Vercel, GitHub, Expo) | [B1](#b1) |
| Un secret / une clé s'est retrouvé publié, ou push bloqué « secret detected » | [B2](#b2) |
| « infinite recursion detected in policy » (Supabase) | [C1](#c1) |
| « Network request failed » à l'inscription / connexion | [C2](#c2) |
| Après inscription : pas de session, l'onboarding renvoie à la connexion | [C3](#c3) |
| Impossible de créer un nouveau projet Supabase / « project limit reached » | [C4](#c4) |
| Une edge function ne se déploie pas / renvoie 500 / erreur CORS / « secret manquant » | [C5](#c5) |
| Une migration SQL échoue (« already exists », clé étrangère, policy en double) | [C6](#c6) |
| Le build EAS échoue sur « credentials » / « provisioning profile » | [D1](#d1) |
| App Store Connect : « bundle ID already exists » / déjà pris | [D2](#d2) |
| App Store Connect : « Agreements not signed » / impossible de soumettre | [D3](#d3) |
| `eas.json` mal configuré / « invalid eas.json » / mauvais profil de build | [D4](#d4) |
| `eas submit` bloqué : login Apple / code 2FA / mot de passe d'application | [D5](#d5) |
| « build limit reached » / plus de builds gratuits EAS ce mois-ci | [D6](#d6) |
| App rejetée par Apple pour crash / lenteur au lancement (« crashed on launch », perf) | [D7](#d7) |
| RevenueCat / l'abo : « Missing Metadata », pas « Ready to Submit » | [E1](#e1) |
| Un user a payé mais reste en gratuit / le premium ne se débloque pas | [E2](#e2) |
| « J'ai perdu mon travail », les fichiers semblent revenus en arrière | [F1](#f1) |
| « 'gh' / 'node' / 'git' / 'npx' n'est pas reconnu » / « command not found » | [F2](#f2) |
| « unsupported Node version » / `EACCES` / install qui casse / `node_modules` foireux | [F3](#f3) |
| L'app **marche** mais ne fait pas le bon truc : données fausses, état perdu, parcours qui ne boucle pas | [G1](#g1) |
| Le déploiement de la landing (Vercel) échoue / build Next.js rouge / 404 | [H1](#h1) |

---

# A. Expo / app mobile

<a id="a1"></a>
## A1 — Écran blanc ou « unsupported SDK » au lancement sur le téléphone

- **Symptôme :** en scannant le QR avec Expo Go, écran blanc, ou message du type « Project is incompatible
  with this version of Expo Go » / « unsupported SDK version ».
- **Cause probable :** la version d'Expo (le SDK) du projet ne correspond pas à celle de l'app **Expo Go**
  installée sur son iPhone. Expo Go ne gère qu'**une** version de SDK à la fois.
- **Fix pas-à-pas :**
  1. Regarde la version SDK du projet dans `package.json` (le champ `expo`, ex. `54.x`).
  2. **Ne « upgrade » jamais pour upgrader.** On **pinne** le SDK sur la version que son Expo Go supporte —
     c'est le sens de la marche. Vérifie les docs versionnées **exactes** de ce SDK
     (`https://docs.expo.dev/versions/vXX.0.0/`) avant de toucher au code.
  3. Si le projet est en avance sur son Expo Go : soit tu **redescends** le projet sur la version supportée,
     soit (plus simple) il **met à jour Expo Go** depuis l'App Store — demande-lui juste ça, c'est un clic.
  4. Aligne les libs sur le SDK avec `npx expo install --check` (il propose les bonnes versions), jamais un
     `npm install` de versions au hasard.
- **Self-check :** `npx expo start`, re-scan du QR, l'app **boot** sans écran blanc.
- **Règle d'or :** le SDK est **pinné** sur l'Expo Go du dev. On ne l'upgrade que s'il y a une vraie raison,
  jamais par réflexe.

<a id="a2"></a>
## A2 — Le paywall / l'achat intégré crashe l'app en test

- **Symptôme :** l'app plante dès qu'on ouvre le paywall, souvent seulement en test sur le tél via Expo Go
  (erreur du genre « native module … is null » / « RNPurchases not found »).
- **Cause probable :** RevenueCat (les achats intégrés) est un **module natif**. Il **n'existe pas** dans
  Expo Go — donc l'appeler là-bas plante. C'est normal, pas un bug de code.
- **Fix pas-à-pas :**
  1. En dev / Expo Go, **stubbe** le paywall : détecte l'absence du module natif et affiche un écran
     bouchon (« Premium — testé sur build réel ») au lieu d'appeler RevenueCat.
  2. Le **vrai** paywall ne se teste que sur un **build EAS / TestFlight** (là le module natif existe).
  3. Ne conclus jamais « le paywall est cassé » à partir d'Expo Go : c'est le mauvais environnement pour ça.
- **Self-check :** l'app boot et navigue sans crash en Expo Go (paywall stubbé), et l'achat réel se valide
  plus tard sur TestFlight en sandbox.
- **Lien :** voir aussi [E1](#e1) (Missing Metadata) et [E2](#e2) (premium serveur).

<a id="a3"></a>
## A3 — Le lien « reset mot de passe » de l'email ne fait rien

- **Symptôme :** l'utilisateur clique le lien de réinitialisation reçu par mail, et ça n'ouvre pas l'app /
  ne se passe rien, **alors que le code semble correct**.
- **Cause probable :** le deep-link (le lien qui ouvre directement l'app) **ne fonctionne qu'en build
  standalone** (EAS / TestFlight / App Store). En **Expo Go** ou dev-client, le schéma d'URL de l'app n'est
  pas enregistré, donc le lien tombe dans le vide.
- **Fix pas-à-pas :**
  1. Vérifie que le **scheme** de l'app et l'URL de redirection Supabase (Auth → URL Configuration) sont
     bien cohérents.
  2. **Ne débogue pas ça dans Expo Go** — c'est attendu qu'il ne marche pas là. Teste le reset sur un
     **vrai build** (EAS/TestFlight).
  3. Explique-le au user : « le lien de reset ne marche que dans la vraie app installée, pas dans l'aperçu
     de test — on le validera sur TestFlight ».
- **Self-check :** demande de reset → email reçu → clic ouvre bien l'app sur l'écran « nouveau mot de passe »,
  **sur un build standalone**.

<a id="a4"></a>
## A4 — « Je peux ni scroller ni swiper » (scrollables imbriqués RN)

- **Symptôme :** sur un écran, plus rien ne défile ni ne glisse — typiquement un carrousel horizontal paginé
  avec du contenu qui doit défiler **verticalement** dedans, ou une liste sous un `GestureHandlerRootView`.
  Le user dit « ça bouge pas », « je peux ni scroller ni swiper ».
- **Cause probable :** deux scrollables imbriqués (ou un scrollable sous gesture-handler) se **disputent le
  geste** du doigt — chacun croit que c'est pour lui, du coup **aucun** ne bouge. Piège React Native connu,
  pas un défaut de son app en soi.
- **Fix pas-à-pas :**
  1. Importe le `ScrollView` / `FlatList` de **`react-native-gesture-handler`** (PAS celui de
     `react-native`) pour les scrollables concernés : c'est la version qui **coopère** dans l'arbitrage des
     gestes.
  2. Pager horizontal + lecture verticale = **axes orthogonaux** (OK nativement avec les bons composants) :
     pager en `horizontal pagingEnabled` (RNGH), **chaque page à largeur fixe** (`useWindowDimensions`) ET
     **hauteur bornée** — sinon le scroll interne ne se crée jamais.
  3. **Ne copie PAS** les hacks `activeOffsetX` / `PanGestureHandler` trouvés au hasard : ils visent le cas
     co-orienté (même axe), pas l'orthogonal — ici ils empirent souvent le problème.
- **Self-check :** sur le tél (`/preview`), le carrousel **glisse** horizontalement ET le contenu **défile**
  verticalement dans chaque page.

<a id="a5"></a>
## A5 — « Unable to resolve module » / le bundling plante (Metro)

- **Symptôme :** au lancement (`expo start`) ou en cours de route, écran rouge / « Unable to resolve module 'X' »,
  « Module not found », ou le bundling s'arrête net — souvent **juste après** un ajout/suppression de lib ou un
  changement de branche.
- **Cause probable :** Metro (l'outil qui assemble ton app) s'appuie sur un **cache** qui ne reflète plus l'état
  réel des fichiers/dépendances — ou la lib citée n'est **pas installée**. 9 fois sur 10 c'est le cache, pas ton code.
- **Fix pas-à-pas :**
  1. **Relance en vidant le cache** — le réflexe n°1 : `npx expo start -c` (le `-c` purge le cache Metro). Ça règle
     la grande majorité des « unable to resolve ».
  2. Si le module cité est une **vraie lib** absente : installe-la **avec** `npx expo install <lib>` (jamais un
     `npm install` au hasard — voir [A6](#a6)), puis relance avec `-c`.
  3. Si ça persiste : **doublon de versions** dans `node_modules` (deux copies d'une même lib, typiquement `react`
     ou `react-native`). Fais un **clean install** (voir [F3](#f3)) puis relance `-c`.
  4. Vérifie qu'un import ne pointe pas vers un **chemin/une casse** faux (`./Utils` vs `./utils` — sensible à la
     casse sur les vrais builds, même si ça « passe » sur ta machine).
- **Self-check :** `npx expo start -c` → le bundling va à **100 %** et l'app **boot** sans écran rouge.

<a id="a6"></a>
## A6 — Conflit de dépendances / une lib incompatible avec le SDK

- **Symptôme :** un `npm install` crache des erreurs `ERESOLVE` / « unable to resolve dependency tree » / « peer
  dependency conflict », ou l'app plante au boot après avoir ajouté une lib « en dernière version ».
- **Cause probable :** une lib a été installée dans une **version qui ne colle pas au SDK Expo pinné**. Chaque SDK
  Expo attend des versions **précises** de `react`, `react-native` et de ses libs — une version au hasard casse l'arbre.
- **Fix pas-à-pas :**
  1. **La règle d'or : `npx expo install <lib>` — jamais `npm install <lib>`** pour tout ce qui touche
     Expo/React Native. `expo install` choisit **la version compatible avec ton SDK** ; `npm install` prend la
     dernière, souvent trop en avance.
  2. Pour **réaligner** tout ce qui a dérivé : `npx expo install --check` liste ce qui est hors-cadre et propose les
     bonnes versions → applique ce qu'il propose.
  3. **Ne force pas** l'install (`--force` / `--legacy-peer-deps`) pour « faire passer » : ça masque le conflit et le
     renvoie au runtime. On corrige la version, on ne la cache pas.
  4. Rappel : on ne **change pas le SDK** pour accommoder une lib — le SDK reste pinné sur l'Expo Go du dev ([A1](#a1)).
- **Self-check :** `npx expo install --check` ne signale plus rien ; l'app **boot** et la lib fonctionne.

<a id="a7"></a>
## A7 — Erreurs TypeScript rouges au build (`@/...` non résolu, types manquants)

- **Symptôme :** le typecheck (`tsc --noEmit`) ou le bundle échoue sur du TypeScript : « Cannot find module '@/...' or
  its type declarations », « Cannot find name … », « could not find a declaration file for module … ».
- **Cause probable :** deux familles — (a) l'**alias de chemin** `@/*` n'est pas résolu (config `tsconfig`/babel
  incohérente), ou (b) une lib **sans types** (pas de `@types/...`).
- **Fix pas-à-pas :**
  1. **Alias `@/*` non résolu :** vérifie que `tsconfig.json` a bien le mapping — typiquement `"baseUrl": "."` +
     `"paths": { "@/*": ["src/*"] }` — **et** que Babel connaît le même alias (`babel-plugin-module-resolver` dans
     `babel.config.js`, avec le même root). Les **deux** doivent être d'accord : TS pour les types, Babel pour
     l'exécution. Si l'un manque, l'autre casse.
  2. **Types manquants pour une lib :** installe le paquet de types s'il existe (`npm i -D @types/<lib>`). S'il
     n'existe pas, ajoute une déclaration minimale (`declare module '<lib>';`) dans un `*.d.ts` du projet, plutôt
     que de laisser l'erreur traîner.
  3. **N'éteins pas** le typecheck pour « faire passer » (pas de `// @ts-nocheck` global, pas de `skipLibCheck` posé
     pour masquer un vrai trou) — corrige la cause. Le typecheck vert fait **partie de la preuve** que c'est réparé.
- **Self-check :** `tsc --noEmit` passe **sans erreur**, puis `expo export --platform ios` (le bundle) passe aussi.

<a id="a8"></a>
## A8 — Scheme / deep-link **vraiment** mal configuré dans `app.json`

- **Symptôme :** un lien censé rouvrir l'app (reset mot de passe, redirection OAuth, retour de paiement) ne fait rien
  **même dans un vrai build** (si ça ne marche **que** dans Expo Go, c'est attendu → [A3](#a3)), ou le build se plaint
  d'un `scheme` manquant.
- **Cause probable :** le **scheme** de l'app (le préfixe d'URL type `monapp://` qui permet à un lien d'ouvrir l'app)
  est **absent ou incohérent** dans `app.json` — ou l'URL de redirection déclarée côté service ne correspond pas au scheme.
- **Fix pas-à-pas :**
  1. Dans `app.json` (ou `app.config.js`), vérifie la présence d'un **`"scheme"`** unique, en minuscules
     (ex. `"scheme": "monapp"`). Sans lui, aucun deep-link ne peut cibler l'app.
  2. Fais **correspondre exactement** ce scheme partout : l'URL de redirection dans **Supabase Auth → URL
     Configuration** (ex. `monapp://reset`) **et** l'URL construite dans le code (`makeRedirectUri` / le lien de
     reset). Un seul écart et le lien tombe dans le vide.
  3. Un changement de `scheme`/`app.json` **ne se voit pas en hot-reload** : le scheme est enregistré **au build** →
     il faut **re-générer le build** natif. En Expo Go, c'est de toute façon attendu que ça ne marche pas ([A3](#a3)).
  4. Aligne aussi le `bundleIdentifier` iOS tant que tu y es (cohérence avec [D2](#d2)).
- **Self-check :** sur un **build standalone** (EAS/TestFlight), cliquer le lien ouvre l'app sur le bon écran ; le
  scheme est **identique** dans `app.json`, dans Supabase, et dans le code.

<a id="a9"></a>
## A9 — Expo Go : « Something went wrong » / l'app ne charge pas

- **Symptôme :** Expo Go affiche « Something went wrong », « Could not connect to the server », ou tourne dans le vide
  après le scan du QR — alors que le **SDK est bon** (sinon → [A1](#a1)).
- **Cause probable :** le téléphone n'arrive **pas à joindre** le serveur de dev sur ton ordi — presque toujours un
  **problème réseau** : les deux appareils ne sont pas sur le **même Wi-Fi**, un pare-feu/réseau d'entreprise bloque,
  ou le cache de connexion est vicié.
- **Fix pas-à-pas :**
  1. Vérifie l'évidence d'abord : **téléphone et ordinateur sur le même réseau Wi-Fi** (pas l'un en 4G, pas un Wi-Fi
     « invité » isolé).
  2. **Passe en mode tunnel** — le remède le plus fiable quand le réseau local coince : `npx expo start --tunnel`
     (le trafic passe par un relais, plus besoin d'être sur le même LAN). Re-scanne le QR.
  3. Si ça reste bloqué : **vide le cache** (`npx expo start -c`, cf. [A5](#a5)) et **relance Expo Go** (ferme-le
     complètement, ré-ouvre).
  4. Un écran d'erreur avec une **stacktrace JS** (pas un souci de connexion) ? Alors ce n'est pas ça : lis le
     message → c'est un bug de bundling ([A5](#a5)) ou de code.
- **Self-check :** re-scan du QR (au besoin en `--tunnel`) → l'app **charge et boot** sur le téléphone.

---

# B. Tokens & secrets

<a id="b1"></a>
## B1 — 401 / 403 / « unauthorized » / « invalid token »

- **Symptôme :** une commande vers Supabase, Vercel, GitHub ou Expo/EAS renvoie `401`, `403`, « unauthorized »,
  « bad credentials » ou « token expired ».
- **Cause probable :** le token utilisé est **expiré**, **révoqué**, ou n'a **pas le bon scope** (les
  permissions). Un token « lecture seule » ne peut pas déployer ; un token d'un autre projet ne marche pas.
- **Fix pas-à-pas :**
  1. Identifie **quel** service répond 401/403 (le message ou l'URL le dit).
  2. **Ne redemande pas au user de « débugger »** — dis-lui simplement de **régénérer** le token, avec le
     **lien exact** et **les scopes exacts** :
     - **Supabase** — Access token : `https://supabase.com/dashboard/account/tokens` (Management API). Pour
       les clés projet : Project Settings → API (garde la clé **service_role** côté serveur uniquement,
       jamais dans l'app — voir [B2](#b2)).
     - **Vercel** — `https://vercel.com/account/tokens` (scope : accès au bon projet/team).
     - **GitHub** — PAT **classic** (on impose le classic dans toute La Recette, cf. `/setup` §a) :
       `https://github.com/settings/tokens` → *Generate new token (classic)* → cocher `repo` + `workflow`.
       (Un fine-grained marche aussi mais expose des *permissions* au lieu des *scopes* `repo`/`workflow` —
       source de confusion ; on s'en tient au **classic** partout pour la cohérence.)
     - **Expo / EAS** — `https://expo.dev/accounts/[compte]/settings/access-tokens`.
  3. Il te colle le nouveau token → tu remplaces la variable d'environnement / le secret **côté serveur** et
     tu retentes.
  4. **Piège sandbox connu :** dans un environnement sandboxé, une requête portant un token peut être
     **bloquée** au niveau réseau (ce n'est pas le token qui est mauvais). Si tout indique un token sain
     mais que ça bloque, teste hors-sandbox ou signale-le.
- **Self-check :** relance la commande d'origine → plus de 401/403.
- **Ne jamais :** logger le token en clair, ni le mettre dans une URL/query string.

<a id="b2"></a>
## B2 — Un secret risque d'être publié dans l'app (ou push bloqué « secret detected »)

- **Symptôme :** une clé sensible (OpenAI, service_role Supabase, clé API tierce) est référencée avec le
  préfixe `EXPO_PUBLIC_`, ou un hook/scan bloque un commit/push (« secret detected »).
- **Cause probable :** **tout ce qui est préfixé `EXPO_PUBLIC_` est embarqué en clair dans le bundle de
  l'app** — donc **public**, extractible par n'importe qui. Un secret là-dedans est une fuite.
- **Fix pas-à-pas :**
  1. **Bannis** `EXPO_PUBLIC_` pour tout secret. `EXPO_PUBLIC_` = uniquement pour des valeurs **non
     sensibles** (URL publique, clé **anon** Supabase prévue pour le client).
  2. Tout vrai secret (clé OpenAI, service_role, clés de paiement serveur) passe par une **edge function**
     Supabase (un mini-serveur côté Supabase) : l'app appelle la fonction, la fonction détient le secret,
     le secret ne quitte jamais le serveur.
  3. Si un secret a **déjà** été committé/publié : considère-le **compromis** → **révoque-le et régénère-le**
     immédiatement (voir [B1](#b1) pour les liens), puis purge-le du code.
  4. Le hook de scan qui a bloqué le push a **bien fait son travail** — ne le contourne pas, corrige la
     cause.
- **Self-check :** grep du bundle / du repo → aucune clé secrète ; les appels sensibles passent par l'edge
  function ; l'app fonctionne toujours.

---

# C. Supabase (backend, auth, base de données)

<a id="c1"></a>
## C1 — « infinite recursion detected in policy » (RLS)

- **Symptôme :** une requête sur une table renvoie « infinite recursion detected in policy for relation … ».
- **Cause probable :** une **policy RLS** (la règle qui dit qui a le droit de lire/écrire une ligne) **se
  référence elle-même** — ex. la policy de la table `X` interroge la table `X` pour décider, ce qui
  redéclenche la policy… en boucle.
- **Fix pas-à-pas :**
  1. Repère la policy fautive (le message nomme la relation).
  2. **Casse la boucle :** ne fais pas la policy relire la même table de façon récursive. Deux options :
     - Simplifie la condition pour qu'elle s'appuie sur `auth.uid()` / une colonne directe, sans re-query
       la table protégée.
     - Ou déplace la logique dans une **fonction `security definer`** (une fonction qui s'exécute avec des
       droits élevés et **contourne la RLS** pendant son check), et appelle-la depuis la policy. C'est le
       remède standard pour les vérifications d'appartenance (ex. « est-ce que je suis membre de ce groupe »).
  3. Applique la migration corrigée, jamais un patch à la main dans le dashboard sans le committer.
- **Self-check :** rejoue la requête qui plantait → plus de récursion ; et vérifie qu'un user ne voit **que**
  ses propres lignes (la sécurité n'a pas été ouverte en grand pour « faire marcher »).

<a id="c2"></a>
## C2 — « Network request failed » à l'inscription / connexion

- **Symptôme :** au signup/login, l'app affiche « Network request failed ».
- **⚠️ Ordre de diagnostic — NE l'inverse PAS :** ce message a **deux causes très différentes** — l'une
  **bloquante** (backend en pause), l'autre **bénigne** (réseau transitoire). **Vérifie la cause bloquante
  D'ABORD.** Si tu conclus « c'est transitoire » sans avoir écarté la pause, tu rassures le user (« ça va
  repasser tout seul ») alors que son backend est **mort** — mal-diagnostic classique.

- **Étape 1 (à faire AVANT tout) — Le projet Supabase est-il EN PAUSE ?**
  Le **free tier** Supabase **met le projet en pause après ~7 jours d'inactivité**. Un backend en pause **ne
  répond plus** → toutes les requêtes d'auth échouent en « network request failed ». Ce n'est **pas**
  transitoire, ça ne se « réessaie » **pas** tout seul.
  - Regarde le **statut du projet** (dashboard Supabase / Management API) : s'il est **Paused/Inactive**,
    c'est ça — pas le réseau.
  - **Fix :** réveille le projet (**Restore / Resume** dans le dashboard, voir [C4](#c4)), puis explique au
    user : « Ton backend s'était mis en veille (offre gratuite, après ~7 jours sans activité) — je viens de
    le rallumer, réessaie. » Si l'app dort souvent, envisage un ping périodique pour le garder éveillé.

- **Étape 2 (SEULEMENT si le backend est confirmé UP et que ça échoue encore) — là c'est du transitoire.**
  Flakiness réseau/DNS (le tél passe wifi↔4G, DNS lent, coupure d'une seconde) ; on le prend à tort pour un
  bug de code.
  - Vérifie aussi que l'URL et la clé **anon** sont bonnes, qu'une requête simple répond.
  - **Fix :** assure-toi qu'un **retry automatique** est en place sur l'appel d'auth (une 2e tentative
    silencieuse absorbe la quasi-totalité de ces cas). Ne pars **pas** en chasse d'un bug fantôme dans le
    code d'auth : le backend est sain.
  - **Au user :** « Pas de panique — c'était un hoquet réseau passager, pas un défaut de l'app. On réessaie
    automatiquement et ça passe. »

- **Self-check :** statut du projet = **Active** (pas Paused) **et** retry en place → le signup passe.
- **Règle :** ne conclus « transitoire » **qu'après** avoir écarté la pause. L'ordre inverse laisse le user
  sur un backend mort en croyant que « ça va se réparer tout seul ».

<a id="c3"></a>
## C3 — Après inscription, pas de session : l'onboarding renvoie à la connexion

- **Symptôme :** l'utilisateur s'inscrit, mais il n'est pas connecté derrière — l'onboarding le renvoie à
  l'écran de login, comme si le compte n'existait pas.
- **Cause probable :** la **confirmation d'email** est **activée** dans Supabase Auth. Du coup, après le
  signup, **aucune session** n'est créée tant que l'email n'est pas confirmé → l'onboarding, qui attend une
  session immédiate, casse.
- **Fix pas-à-pas :**
  1. **Garde l'autoconfirm activé** (confirmation d'email **désactivée**) tant qu'un rework de l'onboarding
     n'a pas été fait. Supabase Auth → Providers/Email → « Confirm email » **off**.
  2. N'active PAS la vérification d'email « pour faire propre » sans avoir d'abord retravaillé le flux
     (gestion d'un état « en attente de confirmation », pas de dépendance à une session immédiate). Sinon tu
     casses l'onboarding.
- **Self-check :** un signup tout neuf → l'utilisateur arrive **connecté** dans l'app, l'onboarding se
  déroule sans retomber sur le login.

<a id="c4"></a>
## C4 — Impossible de créer un projet Supabase / « project limit reached »

- **Symptôme :** à la création d'un projet Supabase, refus / « you have reached the project limit ».
- **Cause probable :** le **free tier** Supabase est **plafonné à 2 projets actifs** par organisation. Un 3e
  ne peut pas être créé tant qu'un des deux tourne.
- **Fix pas-à-pas :**
  1. Explique-le simplement : « Supabase gratuit permet 2 backends actifs à la fois — on est à la limite. »
  2. Options, à lui faire trancher : **réutiliser** un projet existant (si c'est le même app), **mettre en
     pause** un projet inutilisé (ça libère un slot), ou passer un projet en payant s'il veut plus.
  3. **Attention :** un projet en pause (ou inactif longtemps) peut expliquer un [C2](#c2) « network failed » —
     un backend en pause ne répond pas.
- **Self-check :** un slot est libre → la création du nouveau projet passe.

<a id="c5"></a>
## C5 — Une edge function ne se déploie pas / renvoie 500 / CORS / « secret manquant »

- **Symptôme :** le déploiement d'une edge function échoue, ou l'app appelle la fonction et reçoit un **500**, une
  erreur **CORS** (« blocked by CORS policy »), ou la fonction se plaint d'un « secret manquant » / « API key not set ».
- **Cause probable :** trois classiques — (a) un **secret serveur** attendu par la fonction (clé IA, service_role)
  n'est **pas défini** côté Supabase, (b) les **en-têtes CORS** manquent dans la réponse, ou (c) une erreur de code
  non catchée fait planter la fonction en 500.
- **Fix pas-à-pas :**
  1. **Secret manquant (le plus fréquent) :** la clé ne va **ni** dans le code **ni** dans un `EXPO_PUBLIC_`
     ([B2](#b2)) — elle se pose comme **secret Supabase** : `supabase secrets set NOM_CLE=valeur` (ou dashboard →
     Edge Functions → Secrets). La fonction la lit avec `Deno.env.get("NOM_CLE")`. **Redeploie** ensuite
     (`supabase functions deploy <nom>`).
  2. **CORS :** renvoie les en-têtes CORS sur **toutes** les réponses **et** gère la requête **OPTIONS** (le
     preflight) avec `Access-Control-Allow-Origin` / `-Headers` / `-Methods`. Sans le OPTIONS traité, l'app est
     bloquée **avant même** d'appeler la fonction.
  3. **500 :** enveloppe la logique dans un `try/catch`, **loggue l'erreur** (visible dans dashboard → Edge Functions
     → Logs) et renvoie un message clair au lieu de laisser exploser. Lis le log : il **nomme** la vraie cause.
  4. **Deploy qui échoue :** vérifie que tu es **linké au bon projet** (`supabase link`) et que le token Management
     est sain ([B1](#b1)).
- **Self-check :** `supabase functions deploy <nom>` passe ; un appel de l'app renvoie **200** avec le bon résultat ;
  aucun secret n'est côté client.

<a id="c6"></a>
## C6 — Une migration SQL échoue (« already exists », clé étrangère, policy en double)

- **Symptôme :** l'application d'une migration s'arrête sur « relation … already exists », « column … already exists »,
  « policy … already exists », ou « violates foreign key constraint » / « relation … does not exist ».
- **Cause probable :** deux familles — (a) l'**ordre** est faux : on référence une table/colonne (clé étrangère)
  **avant** qu'elle existe, ou (b) on **recrée** un objet déjà présent (table, colonne, policy) parce que la migration
  a été rejouée.
- **Fix pas-à-pas :**
  1. **« already exists » (objet en double) :** rends la migration **idempotente** — `CREATE TABLE IF NOT EXISTS`,
     `ADD COLUMN IF NOT EXISTS`, et pour une policy, `DROP POLICY IF EXISTS <nom> ON <table>;` **avant** le
     `CREATE POLICY`. Une migration doit pouvoir se rejouer sans exploser.
  2. **Ordre des tables / clés étrangères :** crée la table **référencée** (le parent) **avant** la table qui la
     pointe. Dans un même fichier, ordonne les `CREATE TABLE` correctement ; au besoin, ajoute la contrainte FK
     **après** via `ALTER TABLE … ADD CONSTRAINT`.
  3. **N'édite pas** une migration déjà appliquée en prod pour la « corriger » — crée une **nouvelle** migration qui
     applique le correctif. On avance, on ne réécrit pas l'historique.
  4. **Committe** le fichier de migration (jamais un patch à la main dans le dashboard non versionné — même principe
     qu'en [C1](#c1)).
- **Self-check :** la migration s'applique **de bout en bout** sans erreur ; les tables/policies attendues existent ;
  la RLS protège toujours (un user ne voit que ses lignes).

---

# D. EAS (builds cloud) & App Store Connect

<a id="d1"></a>
## D1 — Le build EAS échoue sur « credentials » / « provisioning profile »

- **Symptôme :** `eas build` s'arrête sur une erreur de credentials, certificat, ou provisioning profile.
- **Cause probable :** un souci de certificats/signature Apple, ou un **bundle identifier** incohérent entre
  le projet et App Store Connect.
- **Fix pas-à-pas :**
  1. **Laisse EAS gérer les credentials** (le mode par défaut « managed » où EAS crée et stocke les
     certificats/profils). Ne pars pas gérer les certificats Apple à la main — c'est la source d'erreurs.
  2. Vérifie que le **bundle id** dans `app.json`/`app.config` est **identique** à celui de l'app sur App
     Store Connect (voir [D2](#d2)).
  3. Le premier build demande une **connexion Apple** (2FA) — c'est un des rares clics que seul le user peut
     faire : guide-le, ne tente pas de l'automatiser.
  4. Relance le build en laissant EAS régénérer les creds si besoin.
- **Self-check :** `eas build` va au bout et produit un `.ipa` ; le bundle id correspond à l'app ASC.

<a id="d2"></a>
## D2 — « Bundle ID already exists » / déjà pris sur App Store Connect

- **Symptôme :** à la création de l'app dans App Store Connect, « bundle ID already exists » ou impossible de
  réutiliser l'identifiant.
- **Cause probable :** un **bundle identifier doit être unique dans tout l'écosystème Apple**. Celui choisi
  est déjà utilisé (par lui avant, ou par quelqu'un d'autre).
- **Fix pas-à-pas :**
  1. Choisis un bundle id **unique en reverse-DNS** : `com.<sonnom>.<nomapp>` (ex. `com.tonorg.tonapp`). Évite
     les génériques (`com.app.monapp`).
  2. Mets-le à jour **partout de façon cohérente** : `app.json`/`app.config`, App Store Connect, RevenueCat,
     et les creds EAS ([D1](#d1)).
  3. Un bundle id ne se **renomme pas** une fois l'app publiée — autant le fixer bien du premier coup.
- **Self-check :** l'app se crée dans ASC avec le nouvel id ; le même id est identique dans le projet et le
  build.

<a id="d3"></a>
## D3 — « Agreements not signed » — impossible de soumettre l'app

- **Symptôme :** dans App Store Connect, une bannière « Agreements not signed » / des contrats en attente, et
  l'app ne peut pas être ajoutée à la review / soumise.
- **Cause probable :** les **contrats** Apple (Paid Apps / accords développeur) et/ou les **infos fiscales et
  bancaires** ne sont **pas signés/complétés** dans App Store Connect. Apple bloque toute soumission tant que
  ce n'est pas fait.
- **Fix pas-à-pas :** c'est **100% côté user** (ce sont des accords légaux, seul le titulaire du compte peut
  signer). Guide-le, écran par écran :
  1. `https://appstoreconnect.apple.com` → **Business / Agreements, Tax, and Banking**.
  2. **Signer** l'accord en attente (Paid Apps si l'app a des achats).
  3. Compléter les **infos fiscales** et les **coordonnées bancaires** (obligatoire pour tout ce qui
     encaisse, y compris les abos).
  4. Attends que le statut passe à « Active ».
- **Rassure :** « Rien de cassé côté app — c'est juste un papier légal à signer chez Apple, 5 minutes. Je te
  montre où cliquer. »
- **Self-check :** le statut des Agreements est **Active** → l'app peut être ajoutée à la review.

<a id="d4"></a>
## D4 — `eas.json` mal configuré / mauvais profil de build

- **Symptôme :** `eas build` s'arrête tout de suite avec « invalid eas.json », un profil de build introuvable, ou le
  build part avec la **mauvaise config** (mauvais profil, mauvaise variable). Différent d'un souci de certificats
  ([D1](#d1)).
- **Cause probable :** le fichier **`eas.json`** (qui décrit tes profils : `development`, `preview`, `production`) est
  **absent, mal formé, ou le profil demandé n'existe pas** — EAS ne sait donc pas comment builder.
- **Fix pas-à-pas :**
  1. Vérifie que **`eas.json` existe à la racine** et est du **JSON valide** (pas de virgule en trop, accolades bien
     fermées) — un JSON cassé fait échouer avant même de builder.
  2. Assure-toi que le **profil que tu lances existe** : `eas build --profile production` suppose une entrée
     `"production"` sous `"build"`. Sinon, crée-la ou vise le bon nom.
  3. Vérifie que tu ne **mélanges pas les profils** : `production` doit viser un build de store
     (`"distribution": "store"`), `preview` un build interne.
  4. En cas de doute, laisse **`eas build:configure`** régénérer un `eas.json` propre plutôt que de bricoler à
     l'aveugle.
  5. Un **fingerprint** qui change / un build qui veut re-signer, c'est **normal** quand une dépendance native ou la
     config a changé — laisse EAS gérer les creds ([D1](#d1)), ne force pas à la main.
- **Self-check :** `eas build --profile <nom>` **démarre** sans erreur de config et va au bout ; le profil utilisé est
  bien celui voulu.

<a id="d5"></a>
## D5 — `eas submit` bloqué par la connexion Apple / le code 2FA

- **Symptôme :** au moment d'envoyer le build à Apple (`eas submit`), ça bloque sur une **connexion Apple**, un
  **code à 6 chiffres (2FA)**, ou « invalid credentials » / « app-specific password required ».
- **Cause probable :** la soumission doit s'**authentifier chez Apple**, et cette étape exige un **facteur humain**
  (le code 2FA reçu sur l'iPhone du dev), ou un **mot de passe d'application** dédié. Rien n'est cassé : c'est une
  porte qu'Apple garde volontairement humaine.
- **Fix pas-à-pas :** c'est un des rares moments où **seul le user peut agir** — guide-le, n'essaie pas d'automatiser :
  1. Il se connecte avec son **Apple ID** (celui du compte développeur) quand EAS le demande.
  2. Le **code 2FA** arrive sur ses appareils Apple → il le colle dans le terminal. (Le code est temporaire, ne le
     stocke jamais.)
  3. Si Apple réclame un **app-specific password** : il en génère un sur `https://appleid.apple.com` → Connexion et
     sécurité → Mots de passe des apps, et le colle.
  4. Prérequis souvent oublié : les **Agreements** doivent être signés côté Apple, sinon la soumission refuse ([D3](#d3)).
  5. Une fois soumis, la suite (TestFlight, review) se passe **dans App Store Connect** — pas de nouvelle 2FA à
     chaque commande.
- **Au user :** « Apple demande juste que **toi** tu confirmes que c'est bien ton compte — un code va arriver sur ton
  iPhone, tu me le colles, et je reprends. »
- **Self-check :** `eas submit` va au bout ; le build apparaît dans **App Store Connect / TestFlight**.

<a id="d6"></a>
## D6 — Quota de builds gratuits EAS atteint (« build limit reached »)

- **Symptôme :** `eas build` refuse de partir avec « build limit reached », « you've used all your free builds », ou
  une file d'attente qui renvoie vers une offre payante.
- **Cause probable :** l'offre **gratuite** d'EAS inclut un **nombre limité de builds par mois**. Le quota épuisé, plus
  de build gratuit avant le **reset mensuel** (ou un passage en payant). Rien de cassé — juste un plafond d'usage.
- **Fix pas-à-pas :**
  1. Explique-le simplement : « Les builds cloud gratuits sont limités par mois, et on a atteint la limite. »
  2. **Ne brûle pas** de builds en diagnostic — c'est exactement le sens du plafond « aucun build EAS sans "oui"
     explicite » de la boucle de réparation. Ici chaque build compte double.
  3. Options à faire **trancher au user** (c'est son argent) : **attendre le reset** mensuel du quota, ou **passer à
     un plan payant** EAS s'il doit builder maintenant.
  4. En attendant, avance sur tout ce qui **ne coûte pas de build** : typecheck, bundle, smoke-test en Expo Go
     ([A2](#a2) rappelle ce qui se teste sans build).
- **Au user :** « On a utilisé les builds cloud gratuits du mois. Soit on attend le renouvellement, soit tu passes sur
  un forfait payant EAS si tu veux builder tout de suite — à toi de voir, je ne lance rien qui coûte sans ton
  feu vert. »
- **Self-check :** un build ne repart que **volontairement** (quota renouvelé ou plan payé) et avec le **"oui"
  explicite** du user.

<a id="d7"></a>
## D7 — App rejetée par Apple pour crash / lenteur au lancement (perf)

- **Symptôme :** Apple refuse l'app en review pour un motif de **stabilité/performance** : « app crashed on launch »,
  « the app exhibited … bugs », lenteur, écran figé au démarrage (souvent Guideline 2.1 — Performance).
- **Cause probable :** sur l'appareil/réseau du testeur Apple, l'app **crashe ou reste bloquée au lancement** —
  typiquement un appel réseau qui échoue sans filet, un état non géré, ou un cas jamais testé sur un **vrai build**
  (pas en Expo Go).
- **Fix pas-à-pas :**
  1. **Reproduis d'abord sur un vrai build**, pas en Expo Go : le crash de review vient d'un **build standalone**
     (TestFlight). Installe le build et refais le parcours de lancement.
  2. **Blinde le démarrage :** aucun crash si le **réseau est absent/lent** (le testeur peut être hors-ligne un
     instant) — `try/catch`, états de chargement, valeurs par défaut. Une app doit **booter même sans réseau**.
  3. Rejoue le **cœur métier de bout en bout** ([G1](#g1)) : « démarre, ne crashe pas » ne suffit pas, le parcours
     principal doit tourner. **Prouve-le par le smoke-test runtime** (app-core-patterns §5, via `/preview`), pas
     juste « ça compile ».
  4. Vérifie les **comptes démo / identifiants de review** donnés à Apple : un login qui échoue chez le testeur passe
     pour un « crash ».
  5. Pour répondre à Apple proprement (nouvelle build + note de résolution), enchaîne avec **`/rejected`**.
- **Self-check :** sur un **vrai build**, l'app **boote sans crash même sans réseau**, le parcours principal se déroule,
  et le compte démo fonctionne — **avant** de re-soumettre.
- **Lien :** cœur métier cassé → [G1](#g1) ; le paywall ne se teste pas en Expo Go → [A2](#a2).

---

# E. RevenueCat & premium (abonnements)

<a id="e1"></a>
## E1 — Abo « Missing Metadata » / pas « Ready to Submit »

- **Symptôme :** dans App Store Connect / RevenueCat, l'abonnement reste « Missing Metadata » et ne passe
  jamais « Ready to Submit ».
- **Cause probable :** la **localization du groupe d'abonnement** (ou un champ obligatoire de l'abo) est
  **incomplète**. Apple exige que le groupe d'abos et chaque abo aient toutes leurs métadonnées.
- **Fix pas-à-pas :**
  1. Dans ASC → l'app → **Subscriptions** → le **groupe d'abonnement** : complète la **localization du
     groupe** (nom d'affichage). *(En production, c'est précisément le point qui bloque le plus souvent tout le groupe.)*
  2. Pour **chaque** abo : nom d'affichage, description, **durée**, **prix** (par territoire), et une
     **capture de review** si demandée.
  3. Vérifie que rien ne reste en jaune/incomplet.
- **Self-check :** l'abo affiche **« Ready to Submit »** ; RevenueCat voit bien le produit.
- **Lien :** le crash du paywall en dev est un sujet **différent** → [A2](#a2).

<a id="e2"></a>
## E2 — Un user a payé mais reste en gratuit (le premium ne se débloque pas)

- **Symptôme :** l'utilisateur achète l'abo, mais l'app le considère toujours comme gratuit ; ou le premium
  « saute » à la réouverture.
- **Cause probable :** l'app décide du premium **côté client seul**, ce qui n'est ni fiable ni sécurisé. La
  **vérité du premium doit venir du serveur**.
- **Fix pas-à-pas :**
  1. Mets en place / vérifie le **webhook RevenueCat → Supabase** : à chaque événement d'achat/renouvellement,
     le webhook fait un **upsert** de `is_premium` sur le profil de l'utilisateur, côté serveur.
  2. L'app **lit** `is_premium` depuis le serveur (source de vérité), et ne se fie pas uniquement à l'état
     local du SDK.
  3. Vérifie que l'endpoint du webhook est bien configuré dans RevenueCat et qu'il répond (logs de la
     fonction).
  4. Pour **débloquer un user précis** en attendant (support), on peut mettre `is_premium = true` sur son
     profil côté serveur — mais la vraie correction, c'est le webhook.
- **Self-check :** un achat sandbox déclenche le webhook → `is_premium` passe à `true` en base → l'app
  débloque le premium, et il **persiste** après redémarrage.

---

# F. Git & environnement de travail

<a id="f1"></a>
## F1 — « J'ai perdu mon travail » / les fichiers semblent revenus en arrière

- **Symptôme :** des changements récents semblent avoir disparu, ou le code ne ressemble plus à ce qui était
  attendu.
- **Cause probable :** **mauvaise branche git.** On est probablement sur une autre branche/un autre checkout —
  le travail n'est pas perdu, il est juste sur une autre branche.
- **Fix pas-à-pas :**
  1. **Avant toute panique et avant d'éditer**, vérifie : `git branch --show-current` et `git status`.
  2. Si c'est la mauvaise branche → reviens sur la bonne (`git checkout <branche>`). Regarde `git stash list`
     et `git reflog` si un changement semble égaré : git perd très rarement quelque chose.
  3. **Habitude préventive :** toujours confirmer la branche courante **avant** de commencer à modifier des
     fichiers.
- **Rassure :** « Ton travail n'est pas perdu — on était juste sur la mauvaise branche. Je te remets dessus. »
- **Self-check :** `git branch --show-current` = la bonne branche ; les changements attendus sont bien là.

<a id="f2"></a>
## F2 — « 'gh' / 'node' / 'git' n'est pas reconnu » (outil manquant sur une machine vierge)

- **Symptôme :** une commande échoue avec « 'gh' n'est pas reconnu en tant que commande interne… » (Windows)
  / « command not found: node » (Mac), ou l'équivalent pour `git`, `npm`, `npx`, `eas`. Typique du **tout
  premier pas** d'un débutant sur une machine neuve où rien n'est encore installé.
- **Cause probable :** l'outil n'est **pas installé** (ou pas dans le PATH). Rien de cassé — il manque juste
  une brique de base. Normal la première fois.
- **Fix pas-à-pas :** identifie l'OS, installe le **strict nécessaire**, une chose à la fois. Ne noie pas le
  user sous 5 installations d'un coup — donne-lui LA seule à faire maintenant.
  - **Node.js** (fournit `node`, `npm`, `npx`) — la base de tout : `https://nodejs.org` → version **LTS**.
    Mac (Homebrew) : `brew install node`. Windows : l'installeur `.msi` du site, ou `winget install
    OpenJS.NodeJS.LTS`.
  - **Git** (`git`) — `https://git-scm.com/downloads`. Mac : `brew install git` (souvent déjà là via les
    Xcode Command Line Tools : `xcode-select --install`). Windows : `winget install Git.Git`.
  - **GitHub CLI** (`gh`) — `https://cli.github.com`. Mac : `brew install gh`. Windows : `winget install
    GitHub.cli`. Après l'install : `gh auth login` pour le connecter (un des rares moments où tu le guides).
  - **EAS CLI** (`eas`) — s'installe via npm une fois Node présent : `npm install -g eas-cli`.
  - **Piège classique :** après une install, **rouvre le terminal** — le PATH n'est pris en compte qu'au
    redémarrage du terminal. Sinon on croit à tort que « ça n'a pas marché ».
- **Au user :** « Il manquait juste un outil de base sur ta machine, c'est normal la première fois. Je te
  donne LE seul truc à installer (un lien, un clic), et je m'occupe du reste. »
- **Self-check :** `node -v` / `git --version` / `gh --version` répondent une version → on relance la
  commande qui plantait.

<a id="f3"></a>
## F3 — Node/npm : mauvaise version, `EACCES`, `node_modules` corrompu

- **Symptôme :** l'install ou le lancement échoue sur « unsupported engine » / « requires Node >= X », des erreurs
  **`EACCES` / permission denied**, ou des plantages incohérents après un `npm install` (modules « installés » mais
  introuvables).
- **Cause probable :** trois classiques du poste de dev — (a) une **version de Node** trop vieille/trop récente,
  (b) des **permissions** cassées (souvent un `npm` lancé en `sudo`/root par le passé), ou (c) un **`node_modules`
  corrompu** (install interrompue, changement de branche).
- **Fix pas-à-pas :**
  1. **Version de Node :** vise la **LTS** ([F2](#f2) pour l'install), vérifie `node -v`. Si le projet exige une
     version précise, utilise un gestionnaire de versions (**nvm** sur Mac/Linux, **nvm-windows** sur Windows)
     plutôt que de jongler à la main.
  2. **`node_modules` douteux → clean install** (le remède le plus sûr) : supprime `node_modules` **et** le lockfile,
     puis réinstalle.
     - Windows (PowerShell) : `Remove-Item -Recurse -Force node_modules, package-lock.json` puis `npm install`.
     - Mac/Linux : `rm -rf node_modules package-lock.json && npm install`.
     - Sur un projet Expo, réaligne ensuite avec `npx expo install --check` ([A6](#a6)).
  3. **`EACCES` / permissions :** **ne « répare » jamais avec `sudo npm install`** — c'est justement ce qui casse les
     permissions au départ. La bonne voie : réinstaller Node proprement (LTS via l'installeur officiel ou nvm), pour
     que npm écrive dans un dossier utilisateur, pas système.
  4. **Rouvre le terminal** après tout changement de version/PATH (piège classique, cf. [F2](#f2)).
- **Au user :** « C'était l'atelier, pas ta maison : un outil mal rangé sur la machine. Je remets Node et les modules
  au propre et on relance. »
- **Self-check :** `node -v` = une version LTS attendue ; un `npm install` propre passe sans `EACCES` ; l'app boot.

---

# G. Cœur métier & UX (le fond, pas la plomberie)

<a id="g1"></a>
## G1 — Le cœur métier ne fait pas ce que dit l'APP-SPEC

- **Symptôme :** l'app **démarre, ne crashe pas, se déploie** — mais elle ne fait pas *le bon truc*. « Mes
  recettes disparaissent », « le total est faux », « quand je valide, rien ne se passe / ça repart à zéro »,
  « le parcours ne se boucle pas ». **Aucune erreur rouge** : c'est du **fonctionnel cassé**, pas de la
  plomberie (ni token, ni RLS, ni SDK).
- **Cause probable :** un écart entre l'**APP-SPEC** (le comportement attendu) et le code — l'un des trois :
  mauvais **modèle de données**, **état** mal géré (perdu, non persisté, mal remis à zéro), ou **parcours
  qui ne se boucle pas** (une étape ne mène pas à la suivante, une action ne sauvegarde pas). La plomberie
  va bien ; c'est le **fond** qui diverge de la spec.
- **Méthode de diagnostic FONCTIONNEL (pas juste technique) :**
  1. **Relis l'APP-SPEC** et écris le comportement attendu en une phrase : « quand l'utilisateur fait X, il
     doit obtenir Y, et Z doit être sauvegardé. » C'est ta **référence de vérité**.
  2. **Trace le parcours réel de bout en bout** (le *user flow*), pas juste la ligne qui plante : écran →
     action → ce qui est censé être **écrit** (état / base) → écran suivant → ce qui est **relu**. Repère
     **où** le réel décroche de la spec.
  3. **Isole la couche qui diverge :**
     - **Modèle de données** — ce qui est stocké ne peut pas représenter ce que la spec demande (champ
       manquant, mauvaise clé, relation absente, une liste **écrasée** au lieu d'être complétée).
     - **État** — la donnée existe mais est **perdue** : pas persistée, reset au mauvais moment, pas
       rechargée au retour sur l'écran, mauvais scope de state.
     - **Parcours** — chaque brique marche isolément mais l'**enchaînement ne boucle pas** (le « valider »
       ne renvoie pas où il faut, l'étape finale ne réécrit pas dans la liste de départ).
  4. **Vérifie l'hypothèse par la donnée, pas à l'œil :** regarde ce qui est **réellement** en base / en
     storage après l'action (une ligne bien écrite ? la bonne valeur ?). Le comportement visible ment
     souvent ; la donnée, non.
  5. **Corrige la cause de fond** (le modèle, la persistance, le branchement du parcours) — **pas** un
     pansement visuel qui masque l'écart.
- **Anti-boucle :** si après **~3 hypothèses de fond distinctes** le comportement ne colle toujours pas à la
  spec, **arrête de deviner** (plafond global — recette-core §4) : montre le parcours au user en `/preview`
  pour le voir ensemble, ou escalade via la **passerelle support** (« Quand vraiment bloqué »). Jamais 6
  essais qui brûlent le budget.
- **Self-check :** rejoue le **parcours complet** décrit par la spec (pas juste « ça ne crashe plus ») → le
  résultat attendu Y est bien là **et** persiste après redémarrage / retour sur l'écran.
- **Au user :** « L'app tournait bien techniquement, mais à un endroit elle ne faisait pas exactement ce qui
  était prévu — je l'ai recollée à ce que ton app est censée faire. Refais l'action, tu devrais voir le bon
  résultat maintenant. »

---

# H. Vercel & landing (le site web, pas l'app mobile)

<a id="h1"></a>
## H1 — Le déploiement de la landing (Vercel) échoue

- **Symptôme :** le déploiement Vercel de la landing / des pages légales échoue — build rouge « Build failed »,
  « Environment Variable … is missing », une erreur de compilation Next.js, ou le site se déploie mais renvoie
  **404 / page blanche**.
- **Cause probable :** trois classiques — (a) une **variable d'environnement** attendue au build n'est **pas définie**
  dans Vercel, (b) une **vraie erreur de build Next.js** (type, import cassé), ou (c) la **racine du projet** (Root
  Directory) est mal réglée quand la landing vit dans un **sous-dossier** du repo.
- **Fix pas-à-pas :**
  1. **Lis le log de build Vercel** — il **nomme** la cause en clair (variable manquante, fichier introuvable, erreur
     TS). On corrige ce qu'il dit, pas au hasard.
  2. **Env var manquante :** ajoute-la dans **Vercel → Project → Settings → Environment Variables** (environnement
     Production), puis **redeploie**. **Aucun secret** dans une variable préfixée `NEXT_PUBLIC_` (elle part dans le
     navigateur — même logique que `EXPO_PUBLIC_`, [B2](#b2)).
  3. **Mauvaise racine (monorepo) :** si la landing est dans un sous-dossier (ex. `landing/`), règle
     **Root Directory = `landing`** dans les settings Vercel, sinon Vercel build la racine et ne trouve pas le site.
  4. **Erreur de build Next :** reproduis **en local** avec `npm run build` (le même build que Vercel) — bien plus
     rapide que d'attendre le cloud. Corrige l'erreur TS/import, re-teste en local, **puis** redeploie.
  5. **404 après déploiement :** re-vérifie le **domaine/la route** et que le build a bien produit des pages (pas une
     sortie vide) ; souvent, c'est encore la Root Directory (point 3).
- **Self-check :** `npm run build` passe **en local**, puis le déploiement Vercel est **vert** et l'URL de prod affiche
  la landing en **HTTPS**. (Les pages légales en HTTPS sont **bloquantes** pour la review Apple — un site cassé peut
  faire recaler l'app.)

---

# Self-checks (comment tu prouves qu'une panne est vraiment réparée)

Selon le domaine, la vérif minimale avant de dire « c'est réparé » :

- **App / code :** `tsc --noEmit` (typecheck) **et** `expo export --platform ios` (le bundle passe), puis
  **boot** de l'app sans écran blanc ni crash.
- **Backend :** la requête/migration qui plantait repasse ; la RLS protège toujours (un user ne voit que ses
  lignes).
- **Auth :** un signup neuf arrive **connecté**, un login marche, le retry absorbe le transitoire.
- **Build / store :** `eas build` va au bout ; les statuts ASC (Agreements, abo) sont verts.
- **Premium :** un achat sandbox se reflète en base **et** persiste au redémarrage.
- **Landing / web :** `npm run build` passe en local, le déploiement Vercel est vert, l'URL de prod s'ouvre en HTTPS
  (pages légales incluses).

Si le self-check échoue → tu n'as pas réparé : reboucle **une** fois, sinon « Quand vraiment bloqué ».

---

# Quand tu es VRAIMENT bloqué (jamais de cul-de-sac)

Tu arrives ici dès que **l'un** de ces plafonds est atteint (pas seulement le premier) :

- **Par-fix :** 2 tentatives max sur le même fix (voir la boucle de réparation).
- **GLOBAL :** **~3 hypothèses distinctes max** sur le même problème. Même si chaque piste te paraît
  « nouvelle », au-delà de 3 tu **arrêtes de deviner** — c'est ce plafond global qui protège vraiment
  l'argent du user (rien n'empêchait sinon d'enchaîner 10 fix différents). Détail : recette-core §4.
- **Coût :** **aucun build EAS de diagnostic ni dépense d'API en boucle sans un "oui" explicite** du user
  (un build **coûte** : dis ce que ça coûte, attends le oui).
- **Hors de ton contrôle :** le blocage dépend d'une action Apple / légale que seul le user peut faire.

On **s'arrête proprement** — jamais de 4e, 5e essai qui brûle les tokens et l'argent du user. Et si tu ne
peux pas livrer le 100 %, **livre la version réduite assumée** (contrat de dégradation, recette-core §4)
plutôt qu'un cul-de-sac.

### 1. Stop propre + message humain au user

Format constitution, sans stacktrace brute :
> « Là je bute sur un truc que je ne peux pas régler tout seul de mon côté. Rien n'est cassé
> définitivement. Voici en une phrase ce qui coince : *[explication simple]*. Le plus rapide maintenant,
> c'est d'envoyer un petit rapport au support — je te l'ai préparé, tu n'as qu'à le coller. »

### 2. Prépare le rapport support ET dépose-le en fichier (tu le rédiges, il n'a qu'à l'envoyer)

Rédige ce bloc en langage clair, **sans secrets** (jamais de token, clé ou mot de passe dedans — masque-les
en `***`) :

```
RAPPORT LA RECETTE
- Ce que je voulais faire : <la commande / l'objectif, ex. "publier l'app">
- Ce qui se passe : <le symptôme, en clair>
- Message d'erreur exact : <copié tel quel, secrets masqués>
- Quand : <à quelle étape / depuis quand>
- Ce qui a déjà été tenté : <fix 1, fix 2, hypothèse 3, résultat de chacun>
- Environnement : <OS Mac/Windows, version SDK Expo, service concerné>
- Ce qui reste vert / marche encore : <pour cadrer le problème>
```

**Écris ce rapport dans un fichier `SUPPORT-REQUEST.md` à la racine du dossier de son app** (secrets
masqués). C'est le **fallback qui marche toujours**, même si les liens ci-dessous ne sont pas encore
configurés : le user repart avec un **livrable concret**, jamais les mains vides.

### 3. La passerelle support — elle pointe TOUJOURS vers un endroit réel

« Colle ce rapport ici → [rien] » est le cul-de-sac **interdit**. Donne-lui un endroit **concret** où
envoyer le `SUPPORT-REQUEST.md` (voir recette-core §5) :

- **X (le plus rapide) :** DM à **@minosdevs** (https://x.com/minosdevs) — réponse en perso.
- **Email (secours) :** `support@minosdevs.app`

> Le fichier `SUPPORT-REQUEST.md` reste le filet qui garantit que le user n'est **jamais** dans un
> cul-de-sac, même en cas de souci d'email.

Dis-lui, en clair : « J'ai déposé un fichier `SUPPORT-REQUEST.md` dans le dossier de ton app. Envoie-le sur
le Discord de La Recette (ou à l'email support) — c'est tout ce qu'il faut, je reprends la main dès qu'on a
la réponse. » Ne le laisse **jamais** sans cette prochaine action.

### 4. NOTE le bug dans `journal.md`

Si c'était un **bug inédit** (pas déjà dans cette base) — que tu l'aies résolu **ou** escaladé — ajoute une
entrée dans `$CLAUDE_PROJECT_DIR/.claude/skills/doctor/journal.md` au format donné en tête de ce fichier. C'est le mécanisme qui rend La
Recette plus solide à chaque client : le prochain qui tombe dessus aura le fix directement dans la base.

---

# Rappels non négociables (constitution)

- **Jamais de stacktrace brute** au user : rassure → explique en 1 phrase → corrige toi-même ou donne LA
  seule action.
- **Jamais de boucle infinie :** 2 tentatives max **par fix** ET ~3 hypothèses distinctes max **au global**
  sur un même problème ; **aucun build EAS de diagnostic sans « oui » explicite** (ça coûte). Au-delà, on
  escalade proprement (passerelle support concrète : Discord / email / `SUPPORT-REQUEST.md`) ou on livre la
  version réduite assumée (contrat de dégradation).
- **Fais TOUT ce qui est automatisable** toi-même ; ne fais agir l'humain que pour ce que lui seul peut
  faire (coller un token, clic Apple 2FA, signer un contrat, trancher une décision).
- **Confirme l'irréversible/coûteux** avant d'agir (soumettre à Apple, dépenser de l'API, supprimer, publier).
- **Jamais de cul-de-sac :** toujours une prochaine action ou la passerelle support.
- **Un bug inédit résolu → dans `journal.md`.** Toujours.
