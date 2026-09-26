# NÉA — Coaching sportif IA

App iOS/Android (Expo, React Native, TypeScript, Expo Router). Langue : **français, tutoiement**.

## Sources de vérité

1. `docs/NEA-cahier-des-charges.md` : cahier des charges complet (produit, stack, règles de calcul, monétisation, plan de construction).
2. `prototype/nea-app.html` : prototype web = **référence visuelle et fonctionnelle exacte** (écrans, couleurs, textes). Toute la logique (`buildPlan()`, charges, calories, VFC, XP) est dans sa section `<script>`.
3. `src/data/` : données du prototype déjà extraites et typées (voir ci-dessous) ; ne pas les recopier depuis le HTML.

**Règle** : ne rien inventer qui n'est pas dans le prototype ou le cahier des charges. En cas de doute, demander. Code propre et typé (`strict`).

**Écarts validés avec le prototype** : âge minimum **14 ans partout** (`AGE_MIN`), le 13 ans de l'écran de réglages du prototype était une erreur.

**Bug du prototype corrigé** : pendant une séance, le prototype récupère les nouveaux intervalles RR avec `rr.slice(longueur avant)`,
qui ne renvoie plus rien quand sa mémoire de 300 RR est pleine (après ~4 min), donc VFC de séance à 0. L'app prend les derniers battements ajoutés.

## Avancement (section 12 du cahier des charges)

- [x] 1. Base : projet Expo, structure, design system, données extraites, images en fichiers, `CLAUDE.md`
- [x] 2. Onboarding complet + `buildPlan`
  - paywall (étape 11) et création de compte (étape 5) viendront entre « C'est parti » et l'accueil ; le bouton « J'ai déjà un compte » de l'accueil arrivera avec les comptes (étape 5)
- [x] 3. Onglets Accueil, Programme, Calendrier, détail de séance, fiche exercice
  - les boutons vers des écrans pas encore construits appellent `bientot()` (`src/components/app/bientot.ts`) : à remplacer au fil des étapes
  - `isPremium()` renvoie `false` jusqu'à l'étape 11 (`src/lib/premium.ts`)
- [x] 4. Séance en cours + récap (FC simulée en attendant Apple Santé), puis **onglet Progrès** (fidèle au prototype)
  - la notification « VFC post-entraînement » du récap arrivera avec les notifications (étape 8)
  - « Connecter un capteur » et la carte Sommeil de Progrès renvoient à Apple Santé (étape 6)
- [ ] 5. Supabase (comptes, sauvegarde, suppression) + **onglet Profil** (avec Conditions, Confidentialité et Supprimer mon compte)
  - fait et **validé sur iPhone** : projet Supabase « NÉA COACH » (Canada Central), email + mot de passe, sauvegarde auto (table `etats`), suppression réelle
    (`supprimer_mon_compte`), écran de compte, onglet Profil, Conditions, Confidentialité
  - `supabase/schema.sql` à exécuter dans SQL Editor (tables + RLS + fonction) ; valeurs publiques dans `.env`
  - reste : Sign in with Apple (compte Apple Developer), Google (Google Cloud), réinitialisation du mot de passe (lien profond)
- [ ] 6. Apple Santé
  - fait (fidèle au prototype, testable dans Expo Go) : écran **Sommeil** (`/sommeil`, vSleep : score de nuit, 7 nuits, VFC nocturne,
    mesures), saisie de la nuit (`NuitSheet`, sleepSheet), **mesure de récupération d'1 min** (`/recuperation`, vHrv, FC simulée,
    même correction des RR que la séance), cartes Nuit / Récupération de l'Accueil, carte Sommeil de Progrès, ligne Sommeil du Profil ;
    `lib/sommeil.ts` (sleepScore, lastNight, baseHrv, recovStatus, hm) comparé au prototype par `comparer-plan`
  - reste : lecture réelle d'Apple Santé (FC, VFC, sommeil, poids) et ceinture Bluetooth : modules natifs absents d'Expo Go,
    il faut un **build de développement EAS** (compte Apple Developer) ; « Connecter un capteur » et « Ceinture cardio » appellent encore `bientot('sante')`
- [ ] 7. Vélo
- [ ] 8. Notifications
- [ ] 9. Coach IA (Edge Function)
- [ ] 10. Ligue : **codée, à valider sur iPhone** (onglet fidèle à vLigue ; amis et équipes réels à la place des exemples du mode démo)
  - `supabase/ligue.sql` à exécuter dans SQL Editor (après `schema.sql`) : tables `joueurs`, `amities`, `equipes` fermées (RLS sans règle),
    tout passe par des fonctions `security definer` limitées au compte connecté (`ligue_maj`, `ligue_etat`, `ajouter_ami`, `creer_equipe`,
    `rejoindre_equipe`, `quitter_equipe`, `renommer_equipe`)
  - choix validés : ami ajouté en saisissant son code (mutuel, immédiat) ; une équipe par personne, 5 membres max, on crée la sienne ou on
    rejoint celle d'un ami ; boost Équipe x1,2 si 3 membres actifs dans la semaine ; classement « Équipes » = toutes les équipes (nom + XP)
  - sans compte : niveau, boosts, Turbo et quêtes locaux, classement réduit à soi, carte « Créer mon compte »
  - Turbo « Activer » renvoie à NÉA Plus (étape 11) ; icône `bolt` absente du prototype (éclair ajouté)
- [ ] 11. NÉA Plus (RevenueCat)
- [ ] 12. Analytics, polish, accessibilité, performance
- [ ] 13. TestFlight + App Store

## Structure

```
src/
  app/              routes Expo Router (un fichier = un écran, _layout = navigateur)
    bienvenue.tsx   accueil (vidéo d'Axel)
    onboarding/     prenom, objectifs, niveau, lieu, rythme, profil, sante, coach (8 écrans) + preparation
    (tabs)/         accueil.tsx, programme.tsx (?vue=calendrier), ligue.tsx, progres.tsx + barre d'onglets
    seance-en-cours séance guidée (séries, reps, minuteur, repos, FC simulée) puis récap
    seance/[jour]   détail d'une séance de la semaine · catalogue/[id] : séance prête · plan/[id] : programme
    sommeil.tsx     Sommeil (nuits, score, VFC nocturne) · recuperation.tsx : mesure de récupération d'1 min
    reglages.tsx    « Modifier » du calendrier · design.tsx : écran de vérification du design system
    compte.tsx      création de compte / connexion (?onb=1 en fin d'onboarding, ?mode=login|signup)
    (tabs)/profil   onglet Profil · legal/[doc] : conditions, confidentialite
  components/ui/    design system (Text, BigNumber, Button, Card, SelectableCard, Icon, Glow, RadialBackground, Toast, Screen)
  components/app/  TabBar, Sheet, ExerciceSheet, DemoSheet, PlanifierSheet, ZoneBar, LivePills, Recap, Coeur (courbe FC, zones),
                    Detail (en-tête, hero, tags…), Rows, CoachFace, Kcal, Thumb, Lvl (hexagone du niveau), confirmer,
                    BarresVFC, NuitSheet
  components/onboarding/  ObScaffold (barre 1/8…8/8), choix (.goal, .big2, .chip, .opt, .hq, .ackb, .warn), ordre des étapes
  lib/plan.ts       buildPlan et calculs (portage fidèle du prototype, fonctions pures)
  lib/semaine.ts    semaine, séances du catalogue ajoutées (catSession, sessionForDay, nextSession)
  lib/charges.ts    charge conseillée (loadFor), itemLine, zone de reps · lib/xp.ts : série, niveaux, rangs, boosts, quêtes
  lib/coeur.ts      FC et VFC simulées (Coeur.tick, rmssd, zone), hrStats · lib/premium.ts : accès NÉA Plus
  store/profil.ts   état utilisateur Zustand sauvegardé (AsyncStorage, clé nea2) + usePlan(), useSemaine(), addXp, quest, addLog
  store/seance.ts   séance en cours (non sauvegardée), mises à jour immuables (React Compiler)
  store/compte.ts   compte Supabase : inscrire, connecter, deconnecter, supprimerCompte, sauvegarde auto de l'état (+ joueur de la Ligue)
  store/mesure.ts   mesure de récupération en cours (non sauvegardée) · lib/sommeil.ts : score de nuit, VFC de référence, récupération
  store/ligue.ts    Ligue en ligne (non sauvegardée) : code ami, amis, équipe, classement ; RPC de supabase/ligue.sql
  lib/ligue.ts      semaine de la Ligue : lundiISO, xpSemaine (myWeekXp), actifSemaine, actifsEquipe (teamActiveN)
  lib/supabase.ts   client Supabase (session : lib/stockage.ts via expo-sqlite, stockage.web.ts dans le navigateur)
  theme/            tokens : couleurs, dégradés, zones cardio, typo Inter, rayons, glow
  data/             données statiques extraites du prototype (typées, voir « Données »)
assets/
  exercices/        50 illustrations <id-exercice>.webp
  coachs/           <coach>_corps.png (mascotte entière) et <coach>_tete.webp (avatar)
  deco/             podium, poses d'Axel, vidéo d'accueil v_axel.mp4
  images/           icône et écran de démarrage
docs/               cahier des charges
prototype/          nea-app.html (référence) + LISEZMOI des données
scripts/            verifier-donnees.ts, comparer-plan.ts (+ prototype-plan.cjs)
```

Alias d'import : `@/…` → `src/…`, `@/assets/…` → `assets/…`.

## Données (`@/data`)

Générées depuis `NEA-donnees-et-images.zip`, identiques aux constantes du prototype (clés d'origine conservées).

| Export | Prototype | Contenu |
|---|---|---|
| `COACHES` | `COACHES` | 6 coachs |
| `EXERCICES` | `EXL` + `NAMES` | 50 exercices |
| `SEANCES`, `SEANCES_GRATUITES` | `CAT`, `FREE_WK` | 41 séances, 3 gratuites |
| `PROGRAMMES` | `PROGS` | 3 programmes par coach (18) |
| `TEMPLATES`, `SPECIAL`, `DAYSPOS` | `TPL`, `SPECIAL`, `DAYSPOS` | modèles de séance pour `buildPlan` |
| `GROUPES`, `MATERIEL`, `LIEUX`, `GEAR`, `GOALS`, `GOALF` | `GRP`, `EQN`, `LIEUX`, `GEAR`, `GOALS`, `GOALF` | référentiels |
| `HEALTH_QUESTIONS` | `HQ` | questionnaire santé |
| `PLANS` | `PLANS` | offres NÉA Plus |
| `QUESTS`, `RANKS` | `QUESTS`, `RANKS` | ligue |
| `EXERCICE_IMAGES`, `COACH_IMAGES`, `DECO_IMAGES`, `VIDEO_ACCUEIL` | — | images dans `/assets` |

Les exercices d'une séance gardent le format du prototype `id:séries:reps:repos` (`SeanceExercice`).
Vérifier l'extraction : `npm run verifier-donnees` (6 / 50 / 41 / 18 + une image par coach et par exercice).

## Logique (`@/lib/plan`)

`buildPlan`, `recoCoach`, `estMin`, `exKcal`, `sesKcal`, `progWeek`, `progFactor`, `hrMax`, `catSession`, `loadFor`,
`streak`, `lvlInfo`, `rankOf`, la FC simulée (`HR.tick`, `rmssd`, `zone`), `hrStats`, les quêtes du jour et le sommeil (`sleepScore`,
`lastNight`, `baseHrv`, `recovStatus`, `hm`) sont portés **à l'identique** du prototype.
Toute modification doit garder `npm run comparer-plan` à 0 différence : ce script exécute le code d'origine
de `prototype/nea-app.html` et compare : buildPlan sur 3 888 profils, loadFor sur ~92 000 exercices, catSession sur
les 41 séances × 3 intensités × 4 poids, streak, lvlInfo, 40 × 400 s de FC simulée (même suite aléatoire) et 730 jours de quêtes.
`src/lib/*` n'importe pas `@/data` (qui charge les images) pour rester exécutable avec Node.

## Design system

- Toujours passer par `@/theme` (jamais de couleur en dur dans un écran).
- Polices : utiliser `<Text weight="black">` etc. ; sur RN chaque graisse est une famille Inter distincte (`fonts.*`), `fontWeight` seul ne suffit pas.
- Cartes radius 16, boutons pilule hauteur 52, sélection = bordure rose + `glow()`.
- Couleurs ponctuelles du CSS du prototype dans `ui` (`@/theme`) ; `mix()` et `alpha()` pour `color-mix`.
- Lueurs : `<Glow>` (dégradé radial SVG) ou `<RadialBackground>`, jamais de `textShadow` coloré (rectangle sur iOS).
- Avec le React Compiler, ne jamais modifier un objet d'état en place (il ne serait pas redessiné) : copies immuables, valeurs simples en props.
- Grands chiffres (poids, âge, FC, compte à rebours, prix du paywall…) : toujours `<BigNumber value unit>`. Jamais de `Text` de grande taille imbriqué dans un `Text` plus petit ni de `lineHeight` inférieur à la taille de police : sur iOS, le haut des chiffres est rogné.

## Commandes

```bash
npm install
npx expo start            # puis scanner le QR code avec l'iPhone (Expo Go)
npx tsc --noEmit          # typecheck
npx expo lint             # lint
npx expo install <pkg>    # toujours utiliser ceci pour ajouter une dépendance
```

## Publier pour tester dans Expo Go (EAS Update)

Projet EAS : `@leaderprinces-team/nea`. `runtimeVersion` = `exposdk:57.0.0` pour qu'Expo Go (SDK 57) puisse ouvrir les mises à jour.
Nécessite `EXPO_TOKEN` dans l'environnement (jamais dans le code ni dans git).

```bash
npx eas-cli@latest update --branch preview --environment preview --platform ios --non-interactive --message "…"
```

Ouvrir dans Expo Go : `exp://u.expo.dev/<projectId>/group/<updateGroupId>` (ou QR code « Preview » sur la page de la mise à jour dans le tableau de bord EAS).

`--environment` fait ignorer le `.env` local : les valeurs publiques Supabase ont donc un secours dans `src/lib/supabase.ts`.
Après chaque publication, vérifier : `strings dist/_expo/static/js/ios/*.hbc | grep -c aqmojycbnaotxrrcvxdr` (doit valoir 1).

Lancer typecheck et lint avant de considérer une tâche terminée.

@AGENTS.md
