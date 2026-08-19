# Lume — landing page

Page statique unique (`index.html` + `thanks.html`), sans build, pensée pour couvrir le champ
**Support URL** obligatoire d'App Store Connect. Même palette que l'app (fond noir, accent
menthe) mais projet complètement indépendant de `src/` — rien ici n'est buildé ni importé par
Expo.

Le formulaire de contact utilise **Netlify Forms** (`data-netlify="true"`) : aucun backend,
aucune adresse email codée en dur dans la page. Les soumissions arrivent dans le dashboard
Netlify du site.

## Déployer

Trois façons, du plus simple au plus classique :

**1. Drag & drop (le plus rapide pour un premier déploiement)**
Va sur https://app.netlify.com/drop et dépose le dossier `web/` tel quel. Netlify te donne
une URL `https://<nom-aléatoire>.netlify.app` immédiatement.

**2. Connecter le repo GitHub (déploiement auto à chaque push)**
Sur app.netlify.com → "Add new site" → "Import an existing project" → sélectionne ce repo.
Netlify lit `netlify.toml` à la racine (`publish = "web"`) automatiquement — aucune config à
saisir à la main.

**3. Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --dir=web           # preview
netlify deploy --dir=web --prod    # production
```

## Après déploiement

- Colle l'URL Netlify (`https://....netlify.app`, ou ton domaine si tu en connectes un) dans le
  champ **Support URL** d'App Store Connect.
- Va dans Netlify → *Site settings → Forms → Form notifications* pour recevoir un email à
  chaque soumission du formulaire de contact (sinon, les messages restent visibles uniquement
  dans le dashboard Netlify).
