---
name: definition-of-done
description: >
  La garantie de complétude de La Recette — la liste todo EXHAUSTIVE qui prouve qu'une app est vraiment
  prête, sans trou ni rejet Apple. Elle est SCINDÉE en deux portes honnêtes : GATE 2a (code-complet,
  vérifiable en quelques heures SANS compte Apple — ce que /build revendique) et GATE 2b (validé pour
  soumission, qui EXIGE un vrai build EAS + TestFlight + un compte Apple actif et prend des jours — ce que
  /app-store ferme). Balaye TOUTES les App Store Review Guidelines (1 Safety, 2 Performance, 3 Business,
  4 Design, 5 Legal). Charge ce skill À LA FIN de /build (pour GATE 2a), avant tout /app-store (pour
  GATE 2b), ou dès que l'utilisateur demande « est-ce fini ? / prêt ? / complet ? ».
---

# Definition of Done — l'app parfaite, prouvée en DEUX portes

> Une app n'est PAS finie parce qu'elle compile. Elle est finie quand elle passe **tout** cet audit.
> Claude ne dit jamais « c'est prêt » sur une impression — il le **prouve** avec cette liste.

## Le moteur (comment Claude s'en sert)

À la fin de `/build`, lance l'**agent auditor** en mode **adversarial** : son job n'est pas de valider,
c'est de **trouver ce qui manque et ce qu'Apple rejetterait**. Il produit une **todo scorée** :
`✅` OK · `⚠️` à corriger · `⛔` bloquant soumission.
1. Claude **corrige seul** tout ce qui est du code.
2. Ce qui ne dépend que de l'humain (compte démo, screenshots réels, contenu à trancher) → surfacé avec **la marche à suivre exacte**.
3. On **re-run** jusqu'à **zéro ⛔ et zéro ⚠️** sur la porte concernée. Alors seulement on avance.

> ⚠️ **Les guidelines Apple bougent.** Cette liste couvre le stable et les rejets fréquents. À
> l'exécution, **croise avec les guidelines live** (developer.apple.com/app-store/review/guidelines)
> et le skill d'audit App Store avant de conclure. Ne jamais affirmer « conforme » sur une version périmée.
> Chaque item marqué **(si …)** ne s'applique QUE si la condition est vraie — n'impose rien d'inutile.

## Les deux portes (la frontière honnête)

La vérité que La Recette ne cache jamais : **une partie de la conformité Apple ne se prouve QUE sur un
vrai build, un vrai abo et un vrai compte Apple** — ça prend des jours et ça ne peut pas être bâclé « en
quelques heures ». On sépare donc l'audit en deux portes claires, et on ne mélange jamais les promesses.

| Porte | Ce qu'elle prouve | Ce que ça exige | Combien de temps | Qui la ferme |
|---|---|---|---|---|
| **GATE 2a — Code-complet** | L'app est **construite, complète et saine** dans le code : elle boote, tout est atteignable, l'i18n est complète, aucun secret ne fuit, les états sont gérés, la feature centrale marche, et les points de conformité Apple sont **repérés et traités dans le code**. | Rien d'Apple. Juste la machine (typecheck + bundle + smoke-test en Expo Go). | **Quelques heures.** | **`/build`** |
| **GATE 2b — Validé pour soumission** | L'app est **réellement prête à partir chez Apple** : vrai build EAS installé via TestFlight, abo réel testé, compte démo testé, App Privacy label rempli, screenshots réels, contrats ASC signés. | Un **compte Apple Developer payé**, un **iPhone**, des **builds cloud**, et des **clics Apple**. | **Des jours** (build, propagation TestFlight, tests réels). | **`/app-store`** |

> **Règle de non-mensonge :** `/build` ne coche **QUE GATE 2a** et **annonce explicitement** que
> **GATE 2b vient après** (« ton app est complète côté code ; il reste l'étape Apple, qui prend des jours
> et demande ton compte développeur »). `/build` ne revendique **jamais** « conforme Apple / prête à
> soumettre » — seul `/app-store`, une fois GATE 2b entièrement verte, peut le dire.

---

# GATE 2a — Code-complet (sans Apple, vérifiable en quelques heures)

> Objectif : prouver, **avec la machine seule**, que l'app est entière et saine. Tout ici est vérifiable
> sans compte Apple, sans build EAS, sans TestFlight. C'est **exactement** le périmètre que `/build`
> revendique. Tant qu'un `⛔` reste ouvert ici, l'app n'est même pas « code-complète ».

## A. Complétude technique (toujours)

- [ ] `tsc --noEmit` **et** `expo export --platform ios` passent (typecheck + bundle — l'app *build* vraiment, pas juste « compile en types »).
- [ ] **Boot sans crash en Expo Go** (le paywall natif et les deep-links sont des **no-op propres** ici ; leur test réel est en GATE 2b).
- [ ] **Smoke-test de la feature centrale** : le parcours principal de l'`APP-SPEC.md` marche de bout en bout (l'app fait vraiment ce pour quoi elle existe).
- [ ] **Tous les écrans atteignables** — aucun bouton mort, aucune route cassée.
- [ ] États **loading / vide / erreur** partout (jamais d'écran blanc ni de spinner infini).
- [ ] **Hors-ligne** géré proprement (message clair, pas de crash).
- [ ] **Zéro secret dans le bundle** (aucune clé en `EXPO_PUBLIC_` autre que les clés publiques prévues ; tout tiers passe par une edge function). Vérifiable en grep sur le bundle exporté.
- [ ] Aucun **placeholder / lorem / TODO** visible par l'utilisateur.
- [ ] i18n complet (aucune chaîne en dur oubliée), FR/EN cohérent.
- [ ] **Icône + splash générés et branchés** (pas l'icône Expo par défaut) — l'app boote avec ses vrais assets. Un débutant ne les fait pas → Claude les génère (skill **assets**). *(La FIDÉLITÉ des screenshots « vraie app » est en GATE 2b.)*

## B. Conformité Apple repérée dans le CODE

> Le **balayage complet** des App Store Review Guidelines, côté code : ici on vérifie que **le code
> traite** chaque exigence (le mécanisme est présent, la mention existe, la clé est au bon endroit). Ce
> qui ne peut être **confirmé pour de vrai** que sur un compte/back Apple est marqué **→ confirmé en 2b**.

### 1. Safety (Sécurité)

- [ ] **1.1 Contenu répréhensible** — rien de diffamatoire, violent, haineux, pornographique, trompeur.
- [ ] **1.2 Contenu généré par les utilisateurs (si UGC)** ⛔ — filtrage du contenu répréhensible, **signaler**, **bloquer** un utilisateur, moyen de **contacter**, et modération. Sans ça = rejet.
- [ ] **1.3 Catégorie Enfants (si Kids)** — pas de tracking tiers, pubs adaptées, lien parental.
- [ ] **1.4 Danger physique (si médical/santé/conduite)** — pas de conseils dangereux ni d'infos médicales inexactes. Domaine sensible → **contenu verrouillé** (whitelist), l'IA n'invente pas.
- [ ] **1.5 Infos développeur** — **Support URL** valide et vivante + moyen de contact (page HTTPS de la landing).
- [ ] **1.6 Sécurité des données** — mesures raisonnables de protection.
- [ ] **1.7 Signalement d'activité criminelle (si applicable)**.

### 2. Performance

- [ ] **2.1 App complète** ⛔ — aucun bug/crash, aucune fonction inachevée, aucun contenu placeholder, tous les liens marchent. Un **compte démo** est **prévu dans le code** (un compte gratuit qui atteint le paywall). *(Le fait qu'il soit **fourni à Apple et testé** = **→ confirmé en 2b** ; c'est le motif de rejet n°1.)*
- [ ] **2.2 Pas de « beta »** — aucune mention beta/test/démo dans la version soumise.
- [ ] **2.3 Métadonnées exactes** ⛔ — description/mots-clés exacts, **aucune fonction cachée**, pas de mention d'autres plateformes (2.3.10), âge correct (2.3.6). *(Les **screenshots = vraie app**, non trompeurs = **→ confirmé en 2b**.)*
- [ ] **2.4 Compatibilité matériel** — pas de surchauffe/batterie anormale, tourne sur les appareils ciblés.
- [ ] **2.5 Exigences logicielles** :
  - [ ] **2.5.1** APIs publiques uniquement, aucune API privée.
  - [ ] **2.5.2** Pas de téléchargement de code qui change les fonctions de l'app.
  - [ ] **Privacy Manifests** ⛔ — `PrivacyInfo.xcprivacy` présent + **Required Reason APIs** déclarées (obligatoire depuis 2024). *(Les **signatures des SDK tiers** se vérifient sur le build réel = **→ confirmé en 2b**.)*

### 3. Business

- [ ] **3.1.1 Achats intégrés** ⛔ — tout bien/contenu numérique passe par **l'IAP Apple**. **Bouton « Restaurer les achats »** présent sur chaque surface d'achat. **Aucun** lien/mention de paiement externe pour contourner l'IAP.
- [ ] **3.1.2 Abonnements (si abo)** ⛔ — le paywall affiche **prix + durée + renouvellement auto** + **liens Conditions et Confidentialité**. *(Que l'abo soit **fonctionnel et rende sa valeur en réel** = **→ confirmé en 2b**, sandbox/TestFlight.)*
- [ ] **3.1.3 (si « reader »/services externes)** — respecter les règles spécifiques / entitlements.
- [ ] **3.2 Modèle économique** — honnête, pas de manipulation, pas d'usage non prévu.

### 4. Design

- [ ] **4.0 Qualité** — soigné, cohérent, respecte les Human Interface Guidelines (safe areas, tap targets, dynamic type).
- [ ] **4.1 Pas de copie** d'une app existante.
- [ ] **4.2 Fonctionnalité minimale** ⛔ — vraie app native utile, **pas un simple wrapper de site web**, pas trop simple/pauvre.
- [ ] **4.3 Pas de spam** — pas de doublon d'une app déjà publiée.
- [ ] **4.5 Services Apple** — pas d'usage détourné d'iCloud/Apple Music/etc.
- [ ] **4.8 Sign in with Apple (si login tiers Google/Facebook…)** ⛔ — proposer **une option de connexion respectueuse de la vie privée** (Sign in with Apple ou équivalent). Sans ça = rejet.

### 5. Legal

- [ ] **5.1.1 Collecte & stockage** ⛔ :
  - [ ] **Politique de confidentialité** liée dans l'app ET dans la fiche ASC, **en HTTPS**, **nommant les tiers** (OpenAI/Supabase/RevenueCat).
  - [ ] Demande de permission (photo, notif, localisation…) avec **texte d'usage** clair (`NS...UsageDescription`).
  - [ ] On ne force pas la création de compte pour des fonctions qui n'en ont pas besoin.
  - [ ] **5.1.1(v) Suppression de compte IN-APP** ⛔ — obligatoire dès qu'il y a création de compte. Oubli = rejet quasi garanti.
- [ ] **5.1.2 Usage & partage des données (si IA / analytics)** ⛔ — **consentement** à l'usage IA **nommant le prestataire** (OpenAI). Pas de partage non divulgué. Pas de collecte hors périmètre.
- [ ] **5.1.3 Santé / recherche (si applicable)** — consentement, pas de pub sur ces données.
- [ ] **5.1.5 Localisation (si géoloc)** — usage pertinent, permission au bon moment.
- [ ] **5.2 Propriété intellectuelle** — pas de marque/contenu tiers sans droits.
- [ ] **5.3 Jeux d'argent / loteries (si applicable)** — licences requises, restrictions géo.
- [ ] **5.6 Code de conduite** — pas de fausses reviews, pas de manipulation du classement.

## C. Niveau « production » (qualité premium, côté code)

- [ ] Ne ressemble PAS à du vibe-codé IA — kit UI appliqué, monochrome + 1 accent, épuré (skill **ui-kits**).
- [ ] Micro-soin : transitions, haptique, empty states rédigés, pas de texte robotique.
- [ ] i18n soignée jusque dans les détails (dates, pluriels, ton), pas de traduction machine bancale.

> **Sortie de GATE 2a :** on re-run l'auditor jusqu'à **zéro ⛔ et zéro ⚠️** sur tout ce qui précède.
> Alors Claude annonce, sans surpromettre : **« Ton app est complète côté code (GATE 2a). Il reste
> l'étape Apple — GATE 2b — qui demande ton compte développeur, un vrai build et des tests sur ton
> iPhone ; ça prend des jours. On la lance avec `/app-store`. »**

---

# GATE 2b — Validé pour soumission (exige Apple, prend des jours)

> Objectif : prouver que l'app est **réellement soumissible**. **Rien ici n'est vérifiable « en quelques
> heures » ni sans Apple** : il faut un compte Apple Developer payé, un iPhone, des builds cloud EAS, la
> propagation TestFlight, et des tests en conditions réelles. **C'est `/app-store` qui possède et ferme
> cette porte** — voir `$CLAUDE_PROJECT_DIR/.claude/commands/app-store.md`. On n'entre ici **qu'une fois GATE 2a 100 % verte**.

## D. Build réel + TestFlight (le seul endroit où ça se prouve)

- [ ] **Build EAS de production** généré (cloud) et **installé via TestFlight** (le build App Store ne s'installe **que** là).
- [ ] **Boot sans crash sur le vrai build** (pas seulement en Expo Go).
- [ ] **Paywall + « Restaurer » + essai gratuit** testés **en sandbox/TestFlight** (RevenueCat est natif : invisible en Expo Go).
- [ ] **Abo réel** : achat sandbox validé → l'entitlement débloque bien le premium (vérité serveur `is_premium`).
- [ ] **Reset mot de passe (deep-link)** testé en réel (si comptes).
- [ ] **Perf fluide sur l'appareil réel** (pas seulement en dev).

## E. App Store Connect & assets réels

- [ ] **Screenshots** aux bonnes tailles, **localisés**, **fidèles à la vraie app** (Apple 2.3 — jamais de mockup trompeur). Générés/encadrés via le skill **assets** à partir de **vraies captures** du build/Expo Go.
- [ ] **App Privacy « nutrition label »** (ASC) rempli et **exact** vs ce que l'app collecte réellement, cohérent avec la politique de confidentialité et la divulgation IA.
- [ ] **Export compliance** (chiffrement) répondu.
- [ ] **Âge / classification** de contenu correct.
- [ ] **Compte démo** (identifiants review) fourni + **testé** — *le dernier blocage classique d'une resoumission* : le reviewer doit pouvoir se connecter et atteindre le paywall.
- [ ] Nom, sous-titre, mots-clés, catégorie, description remplis et exacts (préparés depuis l'`APP-SPEC.md`).
- [ ] **URLs** Privacy Policy + Support renseignées et **testées en 200** (HTTPS).
- [ ] **Abonnements (si IAP)** en **« Ready to Submit »** dans ASC (piège *Missing Metadata* : screenshot de review du paywall + localisation du **groupe** d'abonnement).
- [ ] **Contrats & fiscalité signés** dans ASC (« Agreements ») — sinon l'app ne peut pas être ajoutée à la review.

---

**Règle d'or :** tant qu'il reste un `⛔`, la porte concernée n'est PAS franchie. Claude le dit clairement
au client, avec le plan pour fermer chaque point — **jamais** un « c'est bon ! » optimiste qui finit en
rejet Apple. Et on ne confond **jamais** « code-complet » (GATE 2a, en heures) avec « prêt à soumettre »
(GATE 2b, en jours) : promettre l'un pour l'autre, c'est exactement le mensonge que La Recette refuse.
