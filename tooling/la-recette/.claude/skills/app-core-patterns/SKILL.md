---
name: app-core-patterns
description: >
  Le CŒUR MÉTIER d'une app — la feature qui varie d'une idée à l'autre et que rien d'autre
  ne construit. Ce skill dit comment bâtir ce cœur À PARTIR de l'APP-SPEC, en partant d'un
  ARCHÉTYPE éprouvé (list-crud : liste+détail+CRUD · ai-feed : feed+génération IA ·
  tracker-streak : tracker/streak · timer-session : timer/séance · quiz-reco : quiz→reco ·
  realtime-chat : chat temps réel · browse-catalog : catalogue+favoris) cloné depuis
  `$CLAUDE_PROJECT_DIR/templates/archetypes/`, puis adapté à l'idée exacte.
  Charge ce skill pendant la phase « Features / Cœur métier » de /build, dès qu'on doit
  construire la fonctionnalité principale d'une app, choisir un archétype, ou câbler le
  « moment magique » écran par écran. C'est le chantier n°1 : sans lui, l'app compile mais
  ne FAIT rien.
---

# App Core Patterns — construire le cœur métier depuis des archétypes

> **Le trou que ce skill bouche.** Le scaffold pose le squelette (nav, thème, i18n), le
> backend pose l'auth et les comptes, le paywall pose la vente. Mais **la feature centrale
> — celle qui fait que l'app EST cette app-là** — n'est construite nulle part ailleurs.
> Et « ça compile » ne prouve JAMAIS que ça marche. Ce skill construit ce cœur, vite et
> fiable, en **clonant un archétype** proche de l'idée puis en l'adaptant, et en le
> **prouvant par un smoke-test** (l'app boote, on fait le parcours, la donnée persiste).

## 0. Constitution

Applique **recette-core**. Tu parles à un débutant : tu construis TOUT toi-même, tu ne lui
demandes que les décisions produit (quels champs, quel ton). Zéro jargon nu. Tu avances
seul, tu montres le résultat, tu ne dis « ça marche » qu'après l'avoir **prouvé**.

## 1. La méthode en 4 temps (toujours la même)

1. **Lis le « moment magique »** dans `APP-SPEC.md` (l'action principale, section « moment
   magique » / « action principale » + la liste des écrans v1). C'est ta cible : le plus
   court chemin pour que l'utilisateur ressente la valeur.
2. **Mappe l'idée vers l'archétype le plus proche** (tableau §2). La plupart des apps sont
   **un archétype**, parfois **deux composés** (ex. un feed IA *plus* une bibliothèque
   CRUD des favoris). On ne réinvente pas : on part du squelette le plus proche.
3. **Clone le template** depuis `$CLAUDE_PROJECT_DIR/templates/archetypes/<archétype>/` dans l'app, puis
   **adapte** (renomme l'entité, remplace les champs, branche la nav, ajoute les clés
   i18n FR **et** EN, adapte les tables/edge). Détails d'adaptation dans le README de
   chaque archétype et §4 ici.
4. **Prouve par le smoke-test** (§5) : typecheck + bundle **puis** un test runtime sur les
   critères d'acceptation de l'archétype, dérivés du moment magique. Tant que le parcours
   principal n'est pas coché, la feature **n'est pas finie** — « vert » ne veut pas dire
   « ça compile », ça veut dire « ça marche ».

> Ordre dans /build : l'archétype se **choisit en tête de build** — il fixe le **modèle de
> données** (tables) que la phase *Backend* provisionne, ET les **écrans** que la phase
> *Features* câble. Donc : Backend crée les tables de l'archétype, puis Features clone et
> branche les écrans dessus.

## 2. Mapper une idée arbitraire vers un archétype

| L'idée ressemble à… | Archétype | Template |
|---|---|---|
| « une liste de choses que je gère » (recettes, notes, contacts, tâches, collection, wishlist, inventaire) | **list-crud** | `$CLAUDE_PROJECT_DIR/templates/archetypes/list-crud/` |
| « je saisis quelque chose, l'IA me rend un résultat » (générateur de texte/idées, assistant, coach qui répond) | **ai-feed** | `$CLAUDE_PROJECT_DIR/templates/archetypes/ai-feed/` |
| « je coche chaque jour et je garde une série » (habitude, routine, check-in humeur, objectif quotidien) | **tracker-streak** | `$CLAUDE_PROJECT_DIR/templates/archetypes/tracker-streak/` |
| « je lance une séance chronométrée » (focus/Pomodoro, méditation, respiration, sport, lecture) | **timer-session** | `$CLAUDE_PROJECT_DIR/templates/archetypes/timer-session/` |
| « je capture une photo/audio + une note et je les retrouve » (journal, food log, avant/après, souvenirs) | **media-journal** | *(voir §3.5 : list-crud + média)* |
| « je réponds à quelques questions, on me fait une reco » (quiz d'onboarding, diagnostic, matching, quiz de perso) | **quiz-reco** | `$CLAUDE_PROJECT_DIR/templates/archetypes/quiz-reco/` |
| « des gens s'écrivent en direct » (messagerie 1:1, chat de support, DM d'une communauté) | **realtime-chat** | `$CLAUDE_PROJECT_DIR/templates/archetypes/realtime-chat/` |
| « je parcours/cherche/filtre une bibliothèque et je garde des favoris » (recettes, workouts, produits, lieux) | **browse-catalog** | `$CLAUDE_PROJECT_DIR/templates/archetypes/browse-catalog/` |

**Comment choisir quand plusieurs collent :** prends l'archétype qui porte le **moment
magique**, pas les features secondaires. Une app de méditation avec favoris = le magique
est le **timer** → `timer-session` d'abord, la liste de favoris viendra en list-crud léger.

**Rien ne colle exactement ?** Prends le plus proche et **adapte** — les archétypes sont
des points de départ, pas des cages. Un « suivi de poids avec graphique » = `tracker-streak`
(une valeur/jour au lieu d'une coche) ou `list-crud` (une liste de mesures) selon que le
magique est *la série* ou *l'historique*. Décris ton choix au client en une phrase.

## 3. Les archétypes en détail

Chaque archétype liste : le **moment magique**, les **écrans**, les **hooks**, la **couche
données** (tables + repo), et les **critères d'acceptation** (le smoke-test). Le code réel
est dans `$CLAUDE_PROJECT_DIR/templates/archetypes/<archétype>/` (voir son README pour les points d'adaptation).

### 3.1 `list-crud` — liste + détail + CRUD

- **Moment magique** : je crée une entrée qui m'appartient, je la retrouve, la modifie, la
  supprime — ça persiste.
- **Écrans** : liste (`items-list-view`), détail/édition (`item-detail-view`), création
  modale (`item-form-view`).
- **Hooks** (`use-items`) : `useItems`, `useItem(id)`, `useCreateItem`, `useUpdateItem`,
  `useDeleteItem` — React Query, clés scopées par user, **mutations optimistes** + rollback.
- **Données** : table `items` (RLS `user_id = auth.uid()`), `items-repository` (le seul à
  parler à Supabase ; `select` de colonnes ciblées, jamais `*` sur la liste).
- **Acceptation** : boote sur l'état vide → crée → apparaît sans recharger → **survit à un
  kill/relance** → édite → supprime → un autre compte ne voit rien (RLS).

### 3.2 `ai-feed` — feed + génération IA

- **Moment magique** : j'écris une demande, l'IA me rend un résultat utile, il s'ajoute à
  mon feed.
- **Écrans** : feed (`feed-view`), composition (`generate-view`), détail (`creation-detail-view`).
- **Hooks** : `use-creations` (feed, favori, suppression) + `use-generate` (enchaîne appel
  IA → sauvegarde → rafraîchit le feed) ; l'appel réseau est isolé dans `generate.ts`.
- **Données** : table `creations` (RLS) + `generation_events` (verrouillée, rate-limit) ;
  **Edge Function `generate`** = seule porte vers l'IA, **clé server-only**, anti-injection,
  timeout 20 s, sortie JSON stricte.
- **Acceptation** : boote sur feed vide → génère (loader → résultat en tête) → **persiste**
  → une demande abusive/vide ne plante pas (message clair, pas de spinner infini) →
  **aucune clé IA dans le bundle** (`grep sk-` / `OPENAI` vide dans `src/`).
- **Rappels Apple** : écran de **consentement IA nommant OpenAI** (5.1.2) ; pages légales
  nommant OpenAI. Domaine sensible (santé/finance) → contenu bordé, pas de conseil dangereux (1.4).

### 3.3 `tracker-streak` — suivi / streak / habitude

- **Moment magique** : je coche « fait aujourd'hui » et ma **série grandit** sous mes yeux.
- **Écrans** : liste (`habits-list-view`, coche + streak par ligne), détail
  (`habit-detail-view`, streak en grand + 7 derniers jours).
- **Hooks** (`use-habits`) : fusionne habitudes + coches en `HabitWithStats` (streak +
  doneToday calculés) ; `useToggleToday` **optimiste** (le streak bouge à l'appui).
- **Données** : `habits` + `habit_entries` (une coche/jour, **UNIQUE(habit_id, day)** →
  cocher est idempotent). Calculs purs isolés dans `streak.ts`.
- **Acceptation** : crée une habitude (streak 0) → coche aujourd'hui (**streak → 1 instantané**)
  → **survit au kill/relance** → décoche (série redescend juste) → détail cohérent.

### 3.4 `timer-session` — minuteur / séance

- **Moment magique** : je lance une séance, le temps défile, à la fin elle **rejoint mon
  historique**.
- **Écrans** : timer (`timer-view`, presets + start/pause/resume/reset), historique
  (`history-view`).
- **Hooks** : `use-timer` (minuteur **fiable basé sur l'heure de fin** — juste même après
  un passage en arrière-plan) + `use-sessions` (historique).
- **Données** : table `sessions` (RLS) ; la séance est enregistrée à la fin.
- **Acceptation** : boote sur le timer → démarre (défile régulier) → pause/reprise sans
  saut → fin → séance **dans l'historique** → **persiste** au kill → arrière-plan/retour =
  temps cohérent.

### 3.5 `media-journal` — capture média / journal

- **Moment magique** : je capture une **photo (+ note/date)** et je la retrouve dans mon
  journal.
- **Base de code** : c'est un **list-crud** dont l'entité porte une image → **clone
  `$CLAUDE_PROJECT_DIR/templates/archetypes/list-crud/`** et ajoute la couche média (ci-dessous). Pas de
  template séparé : on capitalise sur le CRUD éprouvé.
- **Écrans** : journal (liste avec vignette), entrée (photo + note + date), capture.
- **Couche média (l'adaptation clé)** :
  - **Capture** via **`expo-image-picker`** (compatible **Expo Go** : galerie ET appareil
    photo). *(Ne PAS partir sur un scanner de documents / recadrage natif absent d'Expo Go —
    cf. flag de faisabilité de `/new`.)*
  - **Stockage** : uploade le fichier dans un **bucket Supabase Storage privé** ; ne garde
    en base (`entries`) que le **chemin** + la note + la date. Sers l'image via une **URL
    signée** courte. **Jamais** l'image brute en base.
  - **Permissions** : demande la permission au bon moment avec un **texte d'usage** clair
    (`NSCameraUsageDescription` / `NSPhotoLibraryUsageDescription` dans `app.json`) — sinon
    rejet Apple 5.1.1.
- **Acceptation** : boote sur journal vide → capture une photo → l'entrée apparaît avec sa
  vignette → **persiste** au kill (l'image se recharge via URL signée) → suppression retire
  l'image → un autre compte ne voit rien (RLS + bucket privé).

### 3.6 `quiz-reco` — questionnaire → reco personnalisée

- **Moment magique** : je réponds à quelques questions (une par écran, barre de progression)
  et je reçois **MA** reco, faite pour moi — qui persiste.
- **Écrans** : questionnaire pas-à-pas (`quiz-view`, progression + retour arrière), résultat
  (`result-view`, la reco + « recommencer »).
- **Hooks** : `use-quiz` (machine à états LOCALE : étape, réponses, progress, reset) +
  `use-quiz-result` (lecture/sauvegarde du résultat, React Query). Le **calcul est pur** et
  isolé dans `reco.ts` (`computeReco` déterministe, testable) ; le contenu (questions, choix,
  poids, recos) vit dans `questions.ts`.
- **Données** : table `quiz_results` (RLS) — `outcome_id` + `answers` (jsonb). **Pur Expo Go.**
- **Acceptation** : boote sur Q1 → chaque choix avance et fait progresser la barre → retour
  arrière sans perte → dernière réponse ⇒ écran résultat cohérent → **persiste** au kill →
  « recommencer » repart de zéro → un autre compte ne voit pas mon résultat (RLS).
- **Complément** : c'est le **moteur** questions→reco ; pour la mécanique de conversion de
  l'onboarding, compose avec le skill `app-onboarding`.

### 3.7 `realtime-chat` — messagerie temps réel

- **Moment magique** : le message de l'autre **apparaît tout seul**, en direct ; le mien part
  instantanément (optimiste) et se confirme sans accroc.
- **Écrans** : liste des conversations (`conversations-view`, autre participant + aperçu),
  fil (`chat-view`, bulles + composer + modération).
- **Hooks** : `use-conversations` (liste + `start_conversation`) + `use-messages` (le cœur :
  historique + **souscription Supabase Realtime** `postgres_changes` + envoi optimiste avec
  réconciliation anti-doublon et retry). **Compatible Expo Go** (WebSocket, aucun natif).
- **Données** : `conversations` + `conversation_participants` + `messages`, **RLS par
  participant** via `is_participant` (SECURITY DEFINER, anti-récursion) ; RPC
  `start_conversation` (1:1 par email) et `list_my_conversations` ; `messages` ajoutée à la
  publication `supabase_realtime`. Modération : `reports` + `blocks`.
- **Acceptation** (à 2 comptes) : A écrit à B → bulle instantanée chez A → **arrive tout seul**
  chez B sans refresh → **persiste** au kill → hors-ligne = « non envoyé » + retry → appui long
  = **signaler/bloquer** (bloqué ⇒ messages masqués par RLS) → un tiers ne voit rien.
- **Rappel Apple 1.2 (BLOQUANT)** : contenu entre utilisateurs ⇒ **signaler + bloquer +
  modération sous ~24 h + CGU tolérance zéro**. Le squelette pose report/block ; le traitement
  des signalements et les CGU sont à **cocher dans la Definition-of-Done** avant toute soumission.

### 3.8 `browse-catalog` — parcourir / chercher / filtrer + favoris

- **Moment magique** : j'explore un catalogue soigné, je **cherche**, je **filtre** par
  catégorie, et je **garde mes favoris** d'un cœur instantané.
- **Écrans** : catalogue (`catalog-view`, recherche + puces de filtre + puce Favoris + cartes
  à cœur), détail (`catalog-detail-view`, infos + tags + favori).
- **Hooks** : `use-catalog` (liste **filtrée côté serveur** — `ilike` recherche + `eq`
  catégorie — clé de cache par filtres, contenu public non scopé user) + `use-favorites`
  (ids favoris + toggle **optimiste**).
- **Données** : `catalog_items` (lecture **publique** aux connectés, **seedable**, non écrit
  depuis l'app) + `favorites` (RLS owner, PK `(user_id, item_id)`). Catégories dans `catalog.ts`.
  **Pur Expo Go.**
- **Acceptation** : boote sur le catalogue semé → la recherche réduit la liste → une puce
  filtre par catégorie → détail OK → cœur **instantané** + filtre Favoris → favoris
  **persistent** au kill → un autre compte voit le même catalogue mais **pas mes favoris** (RLS).

## 4. Adapter un archétype à l'idée (la checklist)

1. **Renomme l'entité** partout : fichiers (`items-repository` → `recipes-repository`),
   types, **clés de cache** (`['items', uid]` → `['recipes', uid]`), routes (`/item/...`).
2. **Remplace les champs** métier dans : la **migration SQL**, `types.ts`, le **repository**
   (colonnes des `select`/`insert`) et les `TextField`/affichages des écrans.
3. **i18n FR *et* EN** : chaque texte affiché passe par `t('...')`. Ajoute les clés dans
   `src/lib/i18n/locales/fr.ts` **et** `en.ts` — **jamais** une chaîne en dur (le snippet de
   clés est dans le README de l'archétype). Clés identiques des deux côtés.
4. **Branche la navigation** : ajoute l'onglet dans `src/app/(tabs)/_layout.tsx` (libellé +
   icône **SF Symbol**, pas d'emoji) et déclare les routes modales dans `src/app/_layout.tsx`.
5. **Respecte le thème** : aucune couleur en dur — passe par `useTheme()` et les tokens
   (`accent`, `text`, `surface`, `border`, `textMuted`, `surfaceElevated`…). Clair ET sombre.
6. **RLS non négociable** : toute table a `enable row level security` + une policy owner.
   Toute clé tierce (IA) vit **côté serveur** (edge function), jamais en `EXPO_PUBLIC_`.
7. **Composer deux archétypes** : garde chaque cœur dans **sa** feature (`src/features/x`,
   `src/features/y`), sa migration, ses clés de cache, son onglet. Ne les entremêle pas —
   deux slices propres valent mieux qu'un fourre-tout.

## 5. Prouver la feature — le smoke-test runtime (pas juste « ça compile »)

Une feature n'est **verte** que si les deux passent :

1. **Statique** : `tsc --noEmit` **et** `expo export --platform ios` (typecheck + bundle).
2. **Runtime** — le smoke-test. Lance `/preview` (Expo Go sur l'iPhone du client) et
   **coche une checklist d'acceptation dérivée du moment magique** (celle de l'archétype,
   §3, reformulée pour l'idée) :
   - l'app **boote** sur le bon écran (pas d'écran blanc, pas de crash) ;
   - je **parcours le chemin principal** de bout en bout (l'action magique aboutit) ;
   - la **donnée persiste** : après **kill + relance**, ce que j'ai créé est toujours là ;
   - les **états** loading / vide / erreur s'affichent proprement (jamais de blanc ni de
     spinner infini) ;
   - **hors-ligne** : pas de crash, message clair.

   Ce qui ne se teste QUE sur un build réel (paywall/IAP natif, deep-link, push) est **noté
   « à valider sur TestFlight »**, pas coché comme prouvé (ça, c'est la GATE 2b).

Si un critère échoue → **corrige-toi** (consulte `$CLAUDE_PROJECT_DIR/.claude/skills/doctor` au besoin), relance. On ne
passe pas à la suite sur un cœur métier qui « a l'air bon » mais qu'on n'a pas vu marcher.

## 6. Le contrat de dégradation (quand une feature ne peut pas être fiable)

Si une partie du moment magique dépend d'une capacité **hors de portée fiable** de la stack
(module natif absent d'Expo Go — carte, scan/OCR, Bluetooth, temps réel/multijoueur, ML
on-device, paiement marchand ; cf. **flag de faisabilité de `/new`**), on ne livre **jamais
un bouton mort**. On livre une **version réduite ASSUMÉE et cohérente** (ex. saisie manuelle
au lieu du scan ; photo de galerie au lieu d'un scanner de docs ; liste au lieu d'une carte),
on la **consigne dans `PROGRESS.md`**, et on la **surface au client comme décision produit**
(« Pour la v1 je fais X au lieu de Y, voici pourquoi ; Y demanderait un build spécial »). Le
cœur reste **utile et complet dans son périmètre réduit** — jamais un moignon qui plante.

## 7. Ce que tu rends après la phase Features

Un cœur métier **construit et prouvé** : les écrans du moment magique câblés sur des données
réelles, la checklist d'acceptation cochée en `/preview`, l'archétype et les adaptations
notés dans `PROGRESS.md`. Puis la suite naturelle : paywall, landing, assets, puis l'audit
(GATE 2a). Tu ne prononces jamais « prêt à soumettre » ici — c'est l'auditeur, plus tard.
