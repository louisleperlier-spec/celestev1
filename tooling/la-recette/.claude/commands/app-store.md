---
description: Publie ton app sur l'App Store, écran par écran — Claude fait tout ce qui s'automatise, te guide pour les clics Apple.
---

# /app-store — soumettre à l'App Store (manuel assisté)

L'étape finale : mettre l'app sur l'App Store. Tu automatises **tout ce qui peut l'être** (build EAS, upload,
remplissage via API quand possible) et tu **tiens la main écran par écran** pour les clics Apple que lui
seul peut faire (connexion 2FA, boutons « Submit »). Apple ne laisse pas tout automatiser — tu es honnête
là-dessus et tu ne le laisses jamais bloqué devant un écran.

## 0. Constitution + skills
Applique **recette-core**. Charge les skills **app-store-launch** (tous les pièges éprouvés en production : creds EAS,
TestFlight, `ascAppId`, App Privacy, export compliance), **assets** (pour encadrer/composer les vrais
screenshots aux tailles Apple) et **definition-of-done** (la preuve, en deux portes, que l'app est prête).
Détecte sa langue et reste dedans.

> **`/app-store` est le propriétaire de GATE 2b.** La Definition-of-Done est **scindée en deux portes**
> (voir skill **definition-of-done**) : **GATE 2a — Code-complet** (sans Apple, vérifiable en quelques
> heures) est fermée par `/build` ; **GATE 2b — Validé pour soumission** (exige un vrai build EAS +
> TestFlight + un compte Apple actif, prend des jours) est fermée **ICI**. Toute cette commande = faire
> passer, un par un, les items de GATE 2b (build réel, TestFlight, abo réel, compte démo testé, App
> Privacy label, screenshots réels, export compliance, contrats ASC).

## 0bis. Quand il demande « il reste quoi ? » — l'état des lieux HONNÊTE (3 blocs)
Dès qu'il demande ce qui reste avant l'App Store (ici ou via `/status`), réponds par **3 blocs nets** —
jamais une liste où le en-attente est déguisé en « déjà géré » :

1. **✅ Fait (le code, sans Apple)** — app, backend/login, écran paywall + SDK + webhook, site, assets, conformité repérée dans le code.
2. **⏳ À faire — dépend de TON compte Apple (GATE 2b)** — liste-les comme **clairement en attente**, pas comme acquis :
   - **🟠 Abonnements / RevenueCat — EN TÊTE et JAMAIS omis.** Sois explicite : le **code** est fait (paywall, SDK, webhook testé) ✅ **mais la mise en service ne l'est pas** : créer les 2 produits d'abo dans App Store Connect, les lier à RevenueCat, coller la clé publique, **tester un vrai achat sandbox**. Ça **exige** le compte Apple → ça se fait à cette étape, pas avant. Ne le range JAMAIS sous « ce que je gère » d'une manière qui laisse croire que c'est déjà réglé.
   - build EAS réel + TestFlight, compte démo testé, App Privacy label, screenshots réels, export compliance, contrats ASC signés.
3. **🧑 Tes clics à toi** — ouvrir le compte Apple Developer (99 $/an, LE déclencheur), signer les contrats, code 2FA, bouton **Submit**.

> **Règle anti-flou (leçon d'un vrai test) :** « ce que je gère » ne veut pas dire « déjà fait ». Un item que tu feras plus tard reste un item **EN ATTENTE** à afficher comme tel. RevenueCat/abonnements en est l'exemple type : on l'annonce toujours en attente, avec son statut honnête (code ✅ / mise en service ⏳ Apple-gated).

## 1. GATE — GATE 2a d'abord, puis on ouvre GATE 2b
D'abord, **vérifie que GATE 2a est verte** : relance l'audit Definition-of-Done sur le périmètre
**code-complet**. S'il reste un `⛔` côté code (feature incomplète, écran mort, secret qui fuit, mécanisme
de conformité absent), on **ne touche pas encore à Apple** — tu le corriges (ou tu renvoies vers `/build`)
et tu re-runs jusqu'au vert. On ne construit pas GATE 2b sur du code troué.

Ensuite, **ouvre GATE 2b** : à partir d'ici, chaque section ci-dessous **ferme un item de GATE 2b**. Le
motif de rejet n°1 (guideline 2.1) c'est une app incomplète — et beaucoup de ces items **ne se prouvent
que sur un vrai build** ; c'est normal que ça prenne des jours, tu le dis clairement au client.

Vérifie aussi les **prérequis côté Apple** (lui seul peut les régler — ce sont des items de GATE 2b) :
- Compte **Apple Developer Program payé (99 $/an)**.
- **Contrats signés** dans App Store Connect (*Agreements, Tax and Banking*) — sinon impossible d'ajouter
  l'app à la review. Guide-le vers l'écran si ce n'est pas fait.

## 2. Build de production (EAS, cloud) — *GATE 2b : build réel*
Via **app-store-launch** :
- `eas.json` avec les 3 profils (`development`, `preview`, `production`) + les env (Supabase URL/clé, clé
  RevenueCat publique) gravées dans chaque profil.

### 2.1 Le piège : le 1er build EAS est INTERACTIF (login Apple + 2FA dans le terminal)
Par défaut, le tout premier `eas build` doit générer le **certificat de distribution** + le **provisioning
profile**, et pour ça EAS demande une **connexion Apple avec code 2FA** — un prompt **stdin interactif**
dans le terminal. Un agent **ne peut pas remplir** ce prompt (il ne peut pas taper le code reçu sur
l'iPhone). Il faut donc **éliminer l'interactivité AVANT de lancer le build**. Deux leviers, à poser
**avant** la commande :

**a) App Store Connect API Key (`.p8`) — pour les credentials, sans login Apple.**
C'est une clé que **lui seul** génère une fois (App Store Connect → *Users and Access* → *Integrations* →
*App Store Connect API* → *Generate API Key*, rôle **App Manager** ou Admin). Elle donne 3 éléments, **déjà
prévus par `verify-secrets.mjs`** dans `.recette/secrets.env` :
- `APPLE_ASC_KEY_ID=` (le *Key ID*)
- `APPLE_ASC_ISSUER_ID=` (l'*Issuer ID*)
- `APPLE_ASC_PRIVATE_KEY_PATH=` (chemin vers le fichier `.p8` téléchargé — **hors du repo**, `*.p8` est déjà
  gitignore)

Expose-les à EAS pour le build **non-interactif** (mêmes valeurs, noms attendus par EAS) :
`EXPO_ASC_API_KEY_PATH` = le `.p8`, `EXPO_ASC_API_KEY_ID` = le Key ID, `EXPO_ASC_API_ISSUER_ID` = l'Issuer ID.

**b) Mot de passe spécifique à l'app — pour éteindre le prompt 2FA.**
Là où une connexion Apple ID reste nécessaire, l'**app-specific password** (généré sur
https://appleid.apple.com → *Connexion et sécurité* → *Mots de passe des apps*) remplace le code 2FA :
- `EXPO_APPLE_ID=` (l'e-mail Apple Developer) + `EXPO_APPLE_APP_SPECIFIC_PASSWORD=` (le mot de passe d'app).

Avec (a) et (b) posés, lance le build **sans prompt** :
```
npx eas-cli@latest build --profile production --platform ios --non-interactive --no-wait
```

### 2.2 À défaut (aucune clé API dispo) : ÉTAPE HUMAINE explicite, jamais un agent coincé
Si tu ne peux pas obtenir la clé API à ce stade, **ne lance pas** une commande interactive que tu ne pourras
pas compléter (cul-de-sac interdit). Passe la main clairement : « Ce premier build a besoin d'une connexion
Apple avec le code à 6 chiffres qui arrive sur ton iPhone — que je ne peux pas taper à ta place. **Ouvre ton
terminal, colle exactement ceci, garde ton iPhone à portée** pour le code 2FA :
```
npx eas-cli@latest build --profile production --platform ios
```
Quand il te demande de te connecter à Apple, tu tapes ton e-mail, ton mot de passe, puis le code reçu. Dis-moi
quand c'est fait, je reprends la suite. » Préviens : iPhone à portée.

- Une fois les creds générés (par l'un ou l'autre chemin), ils **vivent sur EAS** → tous les builds suivants
  sont non-interactifs. Le `buildNumber` s'auto-incrémente.
- Le build de prod ne s'installe **que via TestFlight** (signé App Store), pas en direct.

## 3. Upload + TestFlight (tester le VRAI build avant de soumettre) — *GATE 2b : TestFlight + abo réel*
- Upload : `npx eas-cli@latest submit --profile production --platform ios --latest --non-interactive`.
  Piège : `ascAppId` requis dans `eas.json` (`submit.production.ios.ascAppId`). EAS propose de générer une
  App Store Connect API Key → **Yes** (réutilisée ensuite, plus de login Apple).
- **TestFlight** (ASC → onglet *TestFlight* en haut) : attends *Ready to Test*. Si *Missing Compliance* →
  chiffrement **No** (chiffrement standard iOS = exempté).
- Piège testeur interne : le testeur doit **accepter l'invitation** (mail « invited to test » → *View in
  TestFlight*) avant de voir l'app ; pas de code à taper.
- **Teste en réel** : paywall + « Restaurer » + essai gratuit (sandbox auto, gratuit), reset mot de passe
  (deep-link), perf, flux complet. Trouve les bugs **ici**, corrige, rebuild, re-teste **avant** de soumettre.

## 4. Remplir la fiche App Store Connect (écran par écran) — *GATE 2b : compte démo, App Privacy, screenshots, agreements*
Tu prépares **tout le contenu** (nom, sous-titre, mots-clés, description, catégorie, âge) à partir de
l'`APP-SPEC.md` et tu le lui donnes prêt à coller. Tu le guides écran par écran pour :
- **Screenshots** aux bonnes tailles, **localisés**, **fidèles à la vraie app** (guideline 2.3 — pas de
  mockup trompeur). Via le skill **assets** : tu prends de **vraies captures** du build réel (ou d'Expo Go
  sur son iPhone), le script les **encadre et compose** aux tailles Apple exactes (1290×2796…) par langue,
  puis tu les places. *(Si le device manque, le skill assets bascule honnêtement en capture guidée — jamais
  de faux mockup.)*
- **App Privacy** (« nutrition label ») : rempli et **exact** vs ce que l'app collecte, cohérent avec la
  politique de confidentialité et la divulgation IA.
- **Export compliance** (chiffrement) : répondu.
- **Compte démo** (identifiants review) : fourni **et testé** — c'est le **dernier blocage classique** (le
  reviewer doit pouvoir se connecter et atteindre le paywall). Prépare un compte gratuit qui marche.
- **URLs** : Privacy Policy + Support (les pages HTTPS de la landing, testées en 200).
- **Abonnements** (si IAP) : « Ready to Submit » (piège *Missing Metadata* : screenshot de review du
  paywall + localisation du **groupe** d'abonnement) ; sélectionne le build ; notes de review claires.

## 5. Le clic final (à lui, tu confirmes) — *GATE 2b : 100 % verte*
Quand **toute la GATE 2b est verte** (build testé, abo réel OK, compte démo testé, App Privacy exact,
screenshots fidèles placés, contrats signés) : **Add for Review → Submit for Review**. C'est **irréversible** au sens où ça part chez
Apple — tu **confirmes avec lui** (« Tout est prêt et testé. Je te guide pour le clic *Submit* — on y va ? »)
puis tu l'accompagnes sur le bouton exact. Rappelle le délai de review typique (souvent 24-48 h) et qu'Apple
**peut** demander des précisions ou refuser.

## 6. Après soumission
- Explique ce qui va se passer (statuts *Waiting for Review* → *In Review* → *Approved*/*Rejected*).
- Reste dispo : si Apple rejette, il colle le message et tu lances `/rejected`. Si c'est approuvé, félicite-le
  et propose la suite (contenu `/blog`, mises à jour `/update`).
