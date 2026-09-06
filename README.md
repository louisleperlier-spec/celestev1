# Céleste ✦

**La carte de vos émotions.**

Céleste est une application web de bien-être émotionnel : une carte des
émotions interactive (inspirée de la roue de Plutchik), un journal guidé,
des statistiques de tendances et une bibliothèque de ressources
(méditations, exercices de respiration, articles, sons apaisants).

## Stack technique

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) pour le build et le serveur de développement
- [Tailwind CSS v4](https://tailwindcss.com/) pour le design system
- [React Router](https://reactrouter.com/) pour la navigation
- [Recharts](https://recharts.org/) pour les graphiques de statistiques
- [Lucide](https://lucide.dev/) pour les icônes

Les données (entrées de la carte des émotions, journal, profil) sont
persistées côté client via `localStorage` — aucun backend n'est requis
pour faire tourner l'application.

## Démarrer en local

```bash
npm install
npm run dev
```

L'application est disponible sur `http://localhost:5173`.

- `/` — page d'accueil (marketing)
- `/login`, `/signup` — authentification (démo, sans backend)
- `/app` — application : tableau de bord, carte des émotions, journal,
  statistiques, ressources, paramètres

## Build de production

```bash
npm run build
```

Le résultat est généré dans `dist/`. Un fichier `netlify.toml` est fourni
pour un déploiement direct sur Netlify (avec redirection SPA).
