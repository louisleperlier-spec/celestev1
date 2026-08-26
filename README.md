# Céleste ✦

App iOS de bien-être quotidien : méditations (respiration guidée), heures miroir, carte du jour,
journal, phases de la lune. Voir `AGENTS.md` pour l'architecture et `DESIGN.md` pour la direction
artistique.

## Démarrer en développement

```bash
npm install
npx expo start
```

Scanne le QR code avec l'app **Expo Go** sur ton iPhone (SDK Expo pinné : **57** — voir `AGENTS.md`).

## Vérifier avant de livrer

```bash
npx tsc --noEmit -p tsconfig.json
npx expo export --platform ios
```

## Où en est le projet

L'app fonctionne déjà entièrement hors-ligne (respiration guidée, lune, heures miroir, carte du jour,
journal). Ce qui reste, avant une vraie soumission App Store : comptes/abonnement réels, icône et
écran de lancement définitifs, build EAS. Rien de tout ça n'est simulé en silence — voir la section
correspondante dans `AGENTS.md`.

## Le dossier `tooling/`

Contient **La Recette**, un kit Claude Code (skills + commandes `/setup`, `/build`, `/app-store`…) qui
sait construire et faire vivre ce type d'app jusqu'à sa mise en ligne. Ce n'est pas du code de
l'application — il n'est pas inclus dans le bundle.
