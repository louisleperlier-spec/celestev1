# NÉA — Coaching sportif IA

App iOS/Android (Expo, React Native, TypeScript, Expo Router). Langue : **français, tutoiement**.

## Sources de vérité

1. `docs/NEA-cahier-des-charges.md` : cahier des charges complet (produit, stack, règles de calcul, monétisation, plan de construction).
2. `prototype/nea-app.html` : prototype web = **référence visuelle et fonctionnelle exacte** (écrans, couleurs, textes). Toute la logique (`buildPlan()`, charges, calories, VFC, XP) est dans sa section `<script>`.
3. `src/data/` : données du prototype déjà extraites et typées (voir ci-dessous) ; ne pas les recopier depuis le HTML.

**Règle** : ne rien inventer qui n'est pas dans le prototype ou le cahier des charges. En cas de doute, demander. Code propre et typé (`strict`).

## Avancement (section 12 du cahier des charges)

- [x] 1. Base : projet Expo, structure, design system, données extraites, images en fichiers, `CLAUDE.md`
- [x] 2. Onboarding complet + `buildPlan`
  - paywall (étape 11) et création de compte (étape 5) viendront entre « C'est parti » et l'accueil ; le bouton « J'ai déjà un compte » de l'accueil arrivera avec les comptes (étape 5)
- [x] 3. Onglets Accueil, Programme, Calendrier, détail de séance, fiche exercice
  - les boutons vers des écrans pas encore construits appellent `bientot()` (`src/components/app/bientot.ts`) : à remplacer au fil des étapes
  - `isPremium()` renvoie `false` jusqu'à l'étape 11 (`src/lib/premium.ts`)
- [ ] 4. Séance en cours + récap
- [ ] 5. Supabase (comptes, sauvegarde, suppression)
- [ ] 6. Apple Santé
- [ ] 7. Vélo
- [ ] 8. Notifications
- [ ] 9. Coach IA (Edge Function)
- [ ] 10. Ligue
- [ ] 11. NÉA Plus (RevenueCat)
- [ ] 12. Analytics, polish, accessibilité, performance
- [ ] 13. TestFlight + App Store

## Structure

```
src/
  app/              routes Expo Router (un fichier = un écran, _layout = navigateur)
    bienvenue.tsx   accueil (vidéo d'Axel)
    onboarding/     prenom, objectifs, niveau, lieu, rythme, profil, sante, coach (8 écrans) + preparation
    (tabs)/         accueil.tsx, programme.tsx (?vue=calendrier) + barre d'onglets
    seance/[jour]   détail d'une séance de la semaine · catalogue/[id] : séance prête · plan/[id] : programme
    reglages.tsx    « Modifier » du calendrier · design.tsx : écran de vérification du design system
  components/ui/    design system (Text, BigNumber, Button, Card, SelectableCard, Icon, Glow, RadialBackground, Toast, Screen)
  components/app/  TabBar, Sheet, ExerciceSheet, PlanifierSheet, ZoneBar, Detail (en-tête, hero, tags…), Rows, CoachFace, Kcal, Thumb
  components/onboarding/  ObScaffold (barre 1/8…8/8), choix (.goal, .big2, .chip, .opt, .hq, .ackb, .warn), ordre des étapes
  lib/plan.ts       buildPlan et calculs (portage fidèle du prototype, fonctions pures)
  lib/semaine.ts    semaine, séances du catalogue ajoutées (catSession, sessionForDay, nextSession)
  lib/charges.ts    charge conseillée (loadFor), itemLine, zone de reps · lib/xp.ts : série, niveaux, rangs, boosts
  store/profil.ts   état utilisateur Zustand sauvegardé (AsyncStorage, clé nea2) + usePlan(), useSemaine()
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
`streak`, `lvlInfo`, `rankOf` sont portés **à l'identique** du prototype.
Toute modification doit garder `npm run comparer-plan` à 0 différence : ce script exécute le code d'origine
de `prototype/nea-app.html` et compare : buildPlan sur 3 888 profils, loadFor sur ~92 000 exercices, catSession sur
les 41 séances × 3 intensités × 4 poids, streak et lvlInfo.
`src/lib/*` n'importe pas `@/data` (qui charge les images) pour rester exécutable avec Node.

## Design system

- Toujours passer par `@/theme` (jamais de couleur en dur dans un écran).
- Polices : utiliser `<Text weight="black">` etc. ; sur RN chaque graisse est une famille Inter distincte (`fonts.*`), `fontWeight` seul ne suffit pas.
- Cartes radius 16, boutons pilule hauteur 52, sélection = bordure rose + `glow()`.
- Couleurs ponctuelles du CSS du prototype dans `ui` (`@/theme`) ; `mix()` et `alpha()` pour `color-mix`.
- Lueurs : `<Glow>` (dégradé radial SVG) ou `<RadialBackground>`, jamais de `textShadow` coloré (rectangle sur iOS).
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

Lancer typecheck et lint avant de considérer une tâche terminée.

@AGENTS.md
