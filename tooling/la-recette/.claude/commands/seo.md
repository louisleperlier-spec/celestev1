---
description: Audite et corrige le référencement (SEO) et la citabilité par les IA (GEO) d'une page de ta landing.
argument-hint: "[page ou URL à auditer, ex. /fr/dua-anxiete]"
---

# /seo — audit + correction SEO / GEO d'une page

Rend une page de ta landing **trouvable par Google** et **citable par les IA** (Bing/Google AI, ChatGPT).
Tu audites, tu **corriges toi-même** ce qui peut l'être, et tu redéploies.

Page ciblée : **$ARGUMENTS** (si vide : audite la page d'accueil, ou propose la liste des pages et laisse
choisir).

## 0. Constitution
Applique **recette-core**. Tu ne rends pas un rapport théorique : tu **appliques les corrections**. Parle en
résultats (« les gens te trouveront mieux sur X »), pas en jargon SEO nu.

## 1. Déléguer au skill
Charge le skill **seo-geo** et suis-le. L'audit couvre au minimum :

**SEO (moteurs classiques)**
- `<title>` unique + `meta description` incitative, dans la bonne langue.
- Un seul `<h1>`, hiérarchie Hn logique, contenu réellement utile (pas mince).
- Open Graph + Twitter card + image OG, favicon.
- `sitemap.xml`, `robots.txt`, URLs propres, `hreflang` EN/FR (pages bilingues liées entre elles).
- Vitesse/mobile : pas d'image énorme, layout responsive.

**GEO (se faire citer par les IA)**
- **AnswerBlock** en tête : une réponse directe, factuelle, citable, à la question de la page.
- **FAQ** avec schéma `FAQPage` (JSON-LD) auto-généré depuis le frontmatter.
- Données structurées pertinentes (Article, Product/SoftwareApplication pour l'app).
- `llms.txt` à jour listant les pages/articles clés.

**Mesure réelle (pour que « 100 % optimisé » soit un chiffre, pas une promesse)**
- **Core Web Vitals** : PageSpeed Insights API sur l'URL de prod (ou Lighthouse en local sur le build).
  Budget mobile : LCP ≤ 2,5 s · CLS ≤ 0,10 · INP ≤ 200 ms · score Perf ≥ 90 · score SEO = 100.
- **Accessibilité** : axe-core (`npx @axe-core/cli <URL>`) → **0** violation `critical`/`serious` (a11y ≥ 95).
- **Images** : tout en `next/image` (`alt`, `width/height` ou `fill`, `priority` sur le hero) ; **image OG
  1200×630 présente** (un `summary_large_image` sans image = carré vide au partage).
- Le détail des commandes et des budgets est dans le skill `seo-geo` (section « Passe de MESURE »).

## 2. Corriger
Applique directement les correctifs dans le code de la page (frontmatter, composants, metadata). Ne laisse
pas de « à faire » que tu pourrais faire toi-même. Ce qui relève d'une **décision humaine** (reformuler une
promesse produit, choisir un mot-clé cible) → propose une option par défaut et demande validation en une
question.

## 3. Vérifier + déployer
- Le build de la landing passe après tes changements.
- **Re-mesure** (PageSpeed/Lighthouse + axe) : les scores repassent **au-dessus du budget** — c'est la
  preuve du gain, à annoncer en chiffres avant/après (pas juste « c'est mieux »).
- Redéploie (logique de `/deploy` côté site) et **teste l'URL en 200**.
- Optionnel : rappelle qu'on peut soumettre la page à Google Search Console / Bing Webmaster pour accélérer
  l'indexation.

## 4. Reporter
Récap en langage humain : ce qui n'allait pas, ce que tu as corrigé, l'effet attendu (« ta page a maintenant
une réponse que les IA peuvent citer, et Google comprend mieux de quoi elle parle »). Propose la suite :
`/blog` pour créer du contenu qui pointe vers cette page.
