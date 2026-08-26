---
description: Construit ton app A→Z en full-auto (repo, backend, app, paywall, landing, assets) puis l'audite jusqu'à zéro bloquant.
---

# /build — la boucle full-auto, A→Z (GATE 2a à la fin)

C'est le cœur de La Recette. Tu construis l'app **entière** à partir de l'`APP-SPEC.md`, en **full-auto**,
sans babysitting. La personne peut fermer son PC et revenir : la boucle est **reprenable**. À la fin, un
**auditeur** prouve que le code est vraiment complet (**GATE 2a**, sans Apple). Tu expliques tout au fur et
à mesure en langage simple, mais tu **avances tout seul**.

> **Le cœur métier d'abord, pas juste le décor.** Le scaffold, le backend, le paywall et la landing sont
> les MÊMES pour toutes les apps. Ce qui fait que c'est *cette* app-là, c'est **le cœur métier** (le
> « moment magique » de la spec). Il a sa propre phase (Phase 3), il part d'un **archétype** cloné depuis
> `$CLAUDE_PROJECT_DIR/templates/archetypes/`, et on ne le déclare fini qu'après un **smoke-test runtime** — pas parce que
> « ça compile ».

## 0. Constitution + pré-vol
Applique **recette-core**. Avant de démarrer, vérifie :
1. `.recette/secrets.env` existe et les comptes sont verts (sinon → `/setup`).
2. `APP-SPEC.md` existe et est **verrouillé** (sinon → `/new`, GATE 1). Ne construis JAMAIS sans spec.
3. Charge les skills métier au fil des phases : **expo-ios-app**, **supabase-backend**,
   **app-core-patterns** (le cœur métier — Phase 3), **revenuecat-subscriptions**, **nextjs-landing**,
   **ui-kits**, **seo-geo**, **assets** (icône/splash — Phase 6), et **definition-of-done** pour l'audit final.
4. **Choisis l'archétype** du cœur métier dès maintenant (skill **app-core-patterns**) : mappe le
   « moment magique » de la spec vers l'archétype le plus proche (`$CLAUDE_PROJECT_DIR/templates/archetypes/`). Ce choix fixe
   **le modèle de données** que la Phase Backend provisionne ET **les écrans** que la Phase Features câble.
   Note l'archétype retenu dans `PROGRESS.md`.
   > **Note archétype** : `media-journal` **n'a pas de dossier propre** dans `$CLAUDE_PROJECT_DIR/templates/archetypes/` —
   > c'est **`list-crud` + une couche média** (photo/audio/upload) posée par-dessus. Clone `list-crud`,
   > puis ajoute la couche média ; ne cherche pas un template `media-journal/` (il n'existe pas).

## 1. La règle de reprise : PROGRESS.md + phases idempotentes
Tu tiens un fichier `PROGRESS.md` à la racine de l'app. **Après CHAQUE phase réussie**, tu y écris l'état
(phase cochée + ce qui a été créé + les identifiants générés : nom du repo, `project-ref` Supabase, projet
Vercel, etc.). Au lancement de `/build`, tu **relis PROGRESS.md** et tu **reprends là où ça s'est arrêté**.

**Idempotence — critique :**
- Ne recrée jamais une ressource déjà notée dans PROGRESS.md. Avant de créer, **vérifie l'existence**.
- ⚠️ **Supabase = 2 projets max** sur le plan gratuit. Si un projet est déjà lié à cette app dans
  PROGRESS.md, **réutilise-le**. Ne provisionne jamais un doublon.
- Idem GitHub (ne recrée pas le repo), Vercel (réutilise le projet), RevenueCat.

## 2. Self-verify après chaque phase (non négociable)
Après chaque phase qui touche du code, tu lances la **boucle de vérif** et tu ne coches la phase que si
elle passe :
- **Typecheck** : `npx tsc --noEmit`
- **Bundle** : `npx expo export --platform ios` (prouve que l'app *build* vraiment, pas juste qu'elle
  compile en types).
Si ça casse → tu **corriges toi-même** (au besoin via le skill **doctor**), tu relances, tu ne passes à la
phase suivante qu'au vert. Jamais de « je continue en espérant que ça marche ».

> ⚠️ **« Vert » ne veut PAS dire « ça compile ».** Typecheck + bundle prouvent seulement que le code
> *build*. Pour la phase **Features** (le cœur métier), « vert » = typecheck + bundle **ET** un
> **smoke-test runtime** : l'app **boote**, on **navigue le parcours principal** de bout en bout, et la
> **donnée se persiste** (elle survit à un kill/relance). Tu le fais via `/preview` (Expo Go), en cochant
> une **checklist d'acceptation dérivée du moment magique** de la spec (celle de l'archétype, cf. skill
> **app-core-patterns** §5). Une feature qui compile mais ne fait rien n'est **pas** verte.

## 3. Confirmer avant le coûteux / l'irréversible
Tu avances seul, SAUF pour ce qui **coûte de l'argent** ou est **difficile à défaire** : provisionner des
ressources cloud, un premier build EAS (temps machine — pipeline/CI EAS : skill **eas-workflows**), tout ce
qui consomme du crédit OpenAI. Pour ça :
une phrase sur la conséquence → un « oui » clair → tu lances. Le reste (scaffold, code, config), tu le fais
sans demander.

## 4. Les phases (dans l'ordre, chacune idempotente + self-vérifiée)

**Phase 0 — Infra (les 3 comptes cloud).**
Crée le **repo GitHub privé** (via `gh`), le **projet Supabase** (Management API — ou réutilise celui de
PROGRESS.md), le **projet Vercel** (pour la landing). Note tous les identifiants dans PROGRESS.md. Explique
en une phrase à quoi sert chaque brique.

**Phase 1 — Scaffold Expo (le squelette de l'app).**
Monte l'app selon le skill **expo-ios-app** : Expo Router, TypeScript, thème clair/sombre, i18n FR/EN,
archi en couches (`app/ features/ services/ ui/ lib/ constants/`). Appuie-toi sur les skills Expo officiels
bundlés : **expo-project-structure** (arborescence du projet) + **expo-router** (routing par fichiers, tabs,
modals, headers). **PINNE le SDK Expo** sur celui que supporte l'Expo Go du device (piège n°1) et écris un
`AGENTS.md`/`CLAUDE.md` qui le rappelle. **En cas de conflit entre un skill Expo (qui suppose le dernier SDK)
et le SDK pinné, le PIN gagne** (cf. `expo-ios-app` §« Skills Expo officiels »). Applique un **kit UI** de
base (skill **ui-kits**) pour que ça ne ressemble pas à du vibe-code. Self-verify.

**Phase 2 — Backend (comptes + données + IA).**
Via **supabase-backend** : auth e-mail/mot de passe, tables + **RLS activé partout**, migrations
versionnées, et — si l'app a de l'IA — une **Edge Function** proxy (la clé OpenAI vit **uniquement** côté
serveur, jamais dans le bundle) avec quota + rate-limit. **Suppression de compte in-app** (RPC
`delete_current_user`) si l'app a des comptes. **Les tables métier viennent de l'archétype choisi** (§0.4) :
applique sa migration `db/` (celle du template) + celle des autres archétypes si l'app en compose deux.
Self-verify.

**Phase 3 — Features / Cœur métier (LA feature qui fait l'app).**
Via **app-core-patterns**. C'est la phase qui construit le **moment magique** — sans elle, l'app compile
mais ne FAIT rien. Marche à suivre, **écran par écran depuis le moment magique de l'APP-SPEC** :
1. **Clone l'archétype** retenu (§0.4) depuis `$CLAUDE_PROJECT_DIR/templates/archetypes/<archétype>/` dans l'app (fichiers
   `feature/*` → `src/features/<domaine>/`, routes `app/*` → `src/app/*`, edge/migration aux bons endroits).
2. **Adapte** : renomme l'entité, remplace les champs par ceux de la spec, branche l'onglet + les routes,
   ajoute les clés **i18n FR *et* EN**, adapte le prompt de l'edge function si IA. (Détails : README de
   l'archétype + app-core-patterns §4.) **Aucune chaîne en dur, aucune couleur en dur, RLS partout.**
3. **Compose** si l'app a deux cœurs (ex. feed IA + bibliothèque de favoris) : une feature propre par cœur,
   pas de fourre-tout.
4. **Contrat de dégradation** : si une partie du magique dépend d'une capacité hors de portée fiable
   (flag de faisabilité de `/new`), livre une **version réduite ASSUMÉE et cohérente** (jamais un bouton
   mort), note-la dans `PROGRESS.md` et surface-la au client comme décision produit.
5. **Self-verify = smoke-test runtime** (§2, non négociable) : typecheck + bundle **puis** `/preview` avec
   la **checklist d'acceptation** de l'archétype cochée (boote → parcours principal → la donnée persiste
   après kill/relance → états loading/vide/erreur → hors-ligne géré). Tant que le parcours n'est pas coché,
   la phase n'est **pas** verte.

**Phase 4 — Paywall (si monétisation).**
Via **revenuecat-subscriptions** : entitlement + offering, écran paywall (prix + durée + renouvellement
auto + liens Conditions/Confidentialité), **bouton « Restaurer les achats » sur chaque surface d'achat**,
webhook RevenueCat → `profiles.is_premium` (vérité serveur). Rappelle que le paywall **ne se teste qu'en
build réel** (RevenueCat est natif, no-op propre en Expo Go). Self-verify.

**Phase 5 — Landing SEO/GEO déployée.**
Via **nextjs-landing** : hero (la punchline de l'APP-SPEC) + features + CTA App Store, et surtout les
**pages légales** `/privacy` `/terms` `/support` en **HTTPS 200 nommant les tiers** (OpenAI/Supabase/
RevenueCat/Apple) — bloquant pour Apple. Applique le skill **seo-geo** (metadata, OG, sitemap, AnswerBlock/
FAQ). Pour le **rendu visuel premium (anti-slop, jamais « vibe-codé »)**, applique le skill
**design-taste-frontend** (Taste Skill) : lis le brief, énonce le « design read », choisis la direction, et
passe son **pre-flight qualité** AVANT de livrer. Génère aussi un **lot de démarrage d'environ 10 articles
de blog** (via **auto-blog**), dérivés du thème + des mots-clés de l'APP-SPEC — pour que le site ait du
contenu SEO/GEO **dès le lancement** (jamais un blog vide). Puis déploie sur **Vercel**. Note l'URL dans PROGRESS.md.

**Phase 6 — Assets (un débutant ne sait pas les faire → tu les génères).**
Via **assets** (`$CLAUDE_PROJECT_DIR/scripts/generate-assets.mjs`) : **icône + splash + favicon** générés depuis un SVG composé
au kit UI et branchés (fini l'icône Expo par défaut) — 100 % automatisable, sans device. OG image pour la
landing. Self-verify que l'app boote avec ces vrais assets. *(Les **screenshots App Store** « fidèles à la
vraie app » exigent de vraies captures du build/device réel → ils se font en `/app-store`, GATE 2b — pas
ici.)*

## 5. GATE 2a — l'auditeur (code complet, sans Apple)
Quand toutes les phases sont vertes (dont le **smoke-test runtime** du cœur métier), **ne dis pas « c'est
prêt »** sur une impression. Lance l'agent **`auditor`** (son id exact) en mode adversarial (skill **definition-of-done**) :
son job est de **trouver ce qui manque et ce qu'Apple rejetterait**. Il rend une todo scorée `✅ / ⚠️ / ⛔`.
1. Tout ce qui est **du code**, tu le **corriges seul**, puis tu relances l'audit.
2. Ce qui ne dépend **que de l'humain** (compte démo, décision de contenu) → tu le **surfaces avec la
   marche à suivre exacte**.
3. Tu **re-runs jusqu'à zéro `⛔` et zéro `⚠️`**. Alors seulement le **code est complet** (GATE 2a).

Tant qu'il reste un `⛔`, l'app **n'est pas prête** — dis-le clairement, avec le plan pour fermer chaque
point. Jamais de « c'est bon ! » optimiste qui finit en rejet Apple.

> **GATE 2a ≠ « publiée ».** GATE 2a = **le code est complet et l'app tourne** (testée en Expo Go, cœur
> métier prouvé, audit vert côté code). La validation **sur un vrai build** — TestFlight, achats/IAP réels
> en sandbox, deep-links, App Store Connect, puis « Add for Review » — c'est la **GATE 2b**, la phase
> suivante (`/app-store`, skill **app-store-launch** ; pour le build & submit EAS et les profils `eas.json`,
> appuie-toi sur le skill Expo officiel **eas-app-stores**). Ne confonds jamais les deux : « ton app est
> construite et testée » (2a) n'est pas « ton app est sur l'App Store » (2b).

## 6. Communiquer pendant la boucle
- Au début : annonce le plan en une phrase (« Je construis tout : les comptes cloud, l'app, le backend, le
  paywall, le site, les images. Je t'explique au fur et à mesure, tu n'as rien à faire. »).
- Après chaque phase : une ligne simple sur **ce qui vient d'être fait** et **ce qui vient après**.
- Si une phase casse et que tu ne peux pas réparer après des essais raisonnables : **stop propre**,
  explication simple, LA prochaine action ou la passerelle `/doctor`. Jamais de boucle infinie qui brûle
  ses tokens ou son argent.

## 7. Fin de build (GATE 2a atteinte)
Quand l'audit est 100 % vert : récapitule en langage humain (« ton app est **construite et testée** : le
cœur (le moment magique) marche pour de vrai, le site est en ligne, et côté code tout respecte les règles
Apple »). Sois honnête sur ce qui reste : la publication (build réel, TestFlight, achats en sandbox,
soumission) = l'étape suivante, la **GATE 2b**. Propose **la suite naturelle** : « On la regarde ensemble
sur ton iPhone ? Je lance `/preview`. » Puis, quand elle te plaît, `/app-store` pour la publier (GATE 2b).
