# NÉA — Coaching sportif IA

App iOS/Android (Expo, React Native, TypeScript, Expo Router). Langue : **français, tutoiement**.

## Sources de vérité

1. `docs/NEA-cahier-des-charges.md` : cahier des charges complet (produit, stack, règles de calcul, monétisation, plan de construction).
2. `docs/nea-app.html` : prototype web = **référence visuelle et fonctionnelle exacte** (écrans, couleurs, données `COACHES`, `PROGS`, `EXL`, `CAT`, logique `buildPlan()`).

**Règle** : ne rien inventer qui n'est pas dans le prototype ou le cahier des charges. En cas de doute, demander. Code propre et typé (`strict`).

## Avancement (section 12 du cahier des charges)

- [x] 1. Base : projet Expo, structure, design system, `CLAUDE.md`
  - [ ] Données extraites + images en fichiers → en attente de `docs/nea-app.html`
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
  data/             données statiques extraites du prototype (COACHES, PROGS, EXL, CAT)
assets/images/      icônes, mascottes, illustrations d'exercices
docs/               cahier des charges + prototype
```

Alias d'import : `@/…` → `src/…`, `@/assets/…` → `assets/…`.

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
