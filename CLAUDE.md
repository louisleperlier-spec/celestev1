# NÉA — Coaching sportif IA

App iOS/Android (Expo, React Native, TypeScript, Expo Router). Langue : **français, tutoiement**.

## Sources de vérité

1. `docs/NEA-cahier-des-charges.md` : cahier des charges complet (produit, stack, règles de calcul, monétisation, plan de construction).
2. `prototype/nea-app.html` : prototype web = **référence visuelle et fonctionnelle exacte** (écrans, couleurs, textes). Toute la logique (`buildPlan()`, charges, calories, VFC, XP) est dans sa section `<script>`.
3. `src/data/` : données du prototype déjà extraites et typées (voir ci-dessous) ; ne pas les recopier depuis le HTML.

**Règle** : ne rien inventer qui n'est pas dans le prototype ou le cahier des charges. En cas de doute, demander. Code propre et typé (`strict`).

## Avancement (section 12 du cahier des charges)

- [x] 1. Base : projet Expo, structure, design system, données extraites, images en fichiers, `CLAUDE.md`
- [ ] 2. Onboarding complet + `buildPlan`
- [ ] 3. Onglets Accueil, Programme, Calendrier, détail de séance, fiche exercice
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
  components/ui/    composants de base du design system (Text, Button, Card, SelectableCard, Screen)
  theme/            tokens : couleurs, dégradés, zones cardio, typo Inter, rayons, glow
  data/             données statiques extraites du prototype (typées, voir « Données »)
assets/
  exercices/        50 illustrations <id-exercice>.webp
  coachs/           <coach>_corps.png (mascotte entière) et <coach>_tete.webp (avatar)
  deco/             podium, poses d'Axel, vidéo d'accueil v_axel.mp4
  images/           icône et écran de démarrage
docs/               cahier des charges
prototype/          nea-app.html (référence) + LISEZMOI des données
scripts/            verifier-donnees.ts
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

## Design system

- Toujours passer par `@/theme` (jamais de couleur en dur dans un écran).
- Polices : utiliser `<Text weight="black">` etc. ; sur RN chaque graisse est une famille Inter distincte (`fonts.*`), `fontWeight` seul ne suffit pas.
- Cartes radius 16, boutons pilule hauteur 52, sélection = bordure rose + `glow()`.

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
