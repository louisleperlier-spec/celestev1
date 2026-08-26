---
description: Ajoute un article de blog bilingue (EN/FR), optimisé SEO/GEO, commité et déployé — en une commande.
argument-hint: "\"le sujet de l'article\""
---

# /blog — un article bilingue SEO/GEO, publié

Écrit un article de blog utile pour ta landing, dans les **deux langues**, pensé pour être trouvé par
Google **et cité par les IA** (Bing/Google AI, ChatGPT). But : amener du trafic gratuit qui télécharge
l'app. Tout est automatique — la personne donne juste le sujet.

Sujet demandé : **$ARGUMENTS** (si vide : propose 3 sujets pertinents pour l'app à partir de l'`APP-SPEC.md`
et laisse-la en choisir un, ou en dicter un autre).

## 0. Constitution
Applique **recette-core**. Un article = **une intention de recherche** (une question précise que les gens
tapent). Tu écris pour un humain d'abord, l'optimisation vient ensuite.

## 1. Déléguer au skill de rédaction
Charge le skill **auto-blog** (et **seo-geo** pour les règles de citation) et suis-le pour produire
l'article. Grandes lignes :
- **Génère l'article MDX bilingue** : une version **EN** et une version **FR** (contenu équivalent, pas une
  traduction mot à mot maladroite), rangées au bon endroit du repo landing (ex. `content/blog/en/…` et
  `content/blog/fr/…`), avec le frontmatter attendu (titre, description, date, slug, tags).
- **SEO** : titre + meta description accrocheurs, structure Hn propre, maillage interne vers la landing/
  l'app, image OG.
- **GEO (se faire citer par les IA)** : place un **AnswerBlock** (réponse directe et citable en tête
  d'article) et une section **FAQ** dans le frontmatter (schéma `FAQPage` auto). C'est ce qui fait qu'une
  IA reprend ton contenu.
- Relie l'article au `llms.txt` / à l'index du blog si le projet en a un.

## 2. Vérifier avant de publier
- Les **deux** langues existent et sont cohérentes (mêmes sections, liens qui marchent).
- Pas de placeholder, pas de « lorem », pas de titre dupliqué avec un article existant.
- Le build de la landing passe (l'article ne casse pas le site).

## 3. Publier (commit + deploy)
Une fois l'article prêt et vérifié : commit + push sur le repo landing, puis déploiement Vercel (ou push
qui déclenche le déploiement auto). Réutilise la logique de `/deploy` pour la partie site. **Confirme
avant** si c'est la toute première publication publique ; ensuite, enchaîne.

## 4. Reporter
Donne à la personne : le **lien EN** et le **lien FR** de l'article en ligne, en une phrase (« Ton article
est publié dans les deux langues, voici les liens »). Propose la suite : « Tu veux que j'en écrive un autre
sur un sujet proche ? Ça renforce ton référencement. »
