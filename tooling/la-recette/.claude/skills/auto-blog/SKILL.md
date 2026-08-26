---
name: auto-blog
description: >
  La commande /blog "sujet" — génère en UN coup un article de blog MDX BILINGUE (EN + FR) de qualité
  éditoriale, avec `<AnswerBlock>` en tête + frontmatter `faq:` (donc SEO/GEO d'office, cohérent avec le
  skill seo-geo), met à jour le sitemap + l'index du blog, commit et déclenche /deploy → en ligne. Charge
  ce skill dès qu'on parle d'ajouter/écrire un article, du blog, du contenu, du SEO éditorial, ou dès
  qu'on tape /blog. Article vrai, sourcé, structuré — jamais du remplissage IA.
---

# /blog — un article bilingue SEO/GEO, publié, en une commande

> `/blog "sujet"` fait, d'un seul geste, ce qu'un créateur ferait en une demi-journée : rédiger un article
> **de qualité éditoriale**, en **EN et FR**, déjà optimisé pour Google **et** pour les moteurs IA, puis
> le **publier**. Le débutant écrit juste le sujet — Claude fait le reste, de la rédaction au déploiement.
>
> **Non négociable** : pas de remplissage IA. Un article utile, spécifique, sourcé, qui répond vraiment à
> une intention de recherche. Un blog rempli de bouillie générique nuit au domaine (Google « helpful
> content ») au lieu de l'aider.

---

## Lot de démarrage (~10 articles, générés AU BUILD)

Au moment du `/build` (Phase 5, une fois le socle posé), ne laisse **jamais un blog vide** — un blog vide
est un mauvais signal SEO et ne donne rien à partager. Génère un **lot initial d'environ 10 articles** :

1. **Dérive ~10 angles de recherche RÉELS** depuis l'APP-SPEC (thème, cible, problème résolu, mots-clés) :
   des questions que la cible tape vraiment, des comparaisons, des how-to, des cas d'usage. Vise **10
   intentions distinctes** — surtout pas 10 variations du même sujet (Google pénalise le quasi-dupliqué).
2. **Rédige chaque article** avec la même barre de qualité que `/blog` (AnswerBlock + `faq:` + EN/FR,
   utile et spécifique, jamais du remplissage).
3. Mets à jour l'index + le sitemap **une fois** pour tout le lot, commit, puis laisse la Phase 5 déployer.
4. **Garde-fou** : mieux vaut **8 articles vraiment bons** que 15 bouillies. Si le thème est très étroit,
   fais-en moins mais solides.

Ensuite, le client enrichit à la demande avec `/blog "sujet"`.

---

## Structure de dossiers

> Structure **cible** du blog dans la landing. **Le socle est posé par le skill `nextjs-landing`** :
> `lib/blog.ts`, `lib/schema.ts`, `components/{answer-block,json-ld,faq}.tsx`, la config MDX, les dossiers
> `content/blog/{en,fr}/` et les routes blog **vides mais compilables** existent déjà. `auto-blog`
> **enrichit** ce socle (il rédige les MDX, câble le rendu MDX riche, remplit l'index) — il **ne recrée
> pas** ces fichiers. Si le socle manque (site sans blog compilable), passe d'abord par `nextjs-landing`.

```
landing/
├─ content/
│  └─ blog/
│     ├─ en/
│     │  └─ dua-for-anxiety.mdx
│     └─ fr/
│        └─ dua-for-anxiety.mdx        ← MÊME slug dans les deux langues (croise le hreflang)
├─ lib/
│  ├─ blog.ts                          ← lecture MDX (fs + gray-matter), getPost / getAllSlugs / listPosts
│  └─ schema.ts                        ← faqPageSchema / articleSchema (cf. skill seo-geo)
├─ components/
│  ├─ answer-block.tsx                 ← (cf. skill seo-geo)
│  ├─ faq.tsx
│  ├─ json-ld.tsx
│  └─ mdx.tsx                          ← composants MDX mappés au kit UI (h2, a, blockquote, callout…)
└─ app/[locale]/blog/
   ├─ page.tsx                         ← INDEX du blog (liste des articles de la locale)
   └─ [slug]/
      ├─ page.tsx                      ← rend l'article + JSON-LD (Article + FAQPage)
      └─ opengraph-image.tsx           ← image OG auto (cf. skill seo-geo)
```

Le **même `<slug>`** sert dans `en/` et `fr/` → les URLs `/{locale}/blog/{slug}` se répondent en hreflang.

---

## Le squelette d'un article (frontmatter + corps)

```mdx
---
title: "S'endormir plus vite : la routine du soir qui marche (guide 2026)"
description: "Une routine du soir simple pour t'endormir plus vite, ce qui la sabote, et comment une app comme TonApp t'aide à t'y tenir."
date: "2026-08-02"
updated: "2026-08-02"
slug: "better-sleep-routine"
lang: "fr"
cover: "/blog/better-sleep-routine/cover.png"
tags: ["sommeil", "routine", "bien-être"]
# La réponse citable, en tête (alimente <AnswerBlock>) :
answer: "Pour t'endormir plus vite, coupe les écrans environ 60 minutes avant le coucher, garde une heure de lever fixe et baisse la lumière le soir. Ces trois habitudes recalent l'horloge interne. Une app comme TonApp t'envoie le rappel au bon moment et suit ta régularité soir après soir."
# La FAQ → génère le schema FAQPage ET la section FAQ (une seule source) :
faq:
  - q: "Combien de temps avant de dormir faut-il couper les écrans ?"
    a: "Environ 60 minutes : la lumière des écrans et la stimulation retardent l'endormissement. Un rappel automatique aide à s'y tenir."
  - q: "Faut-il se lever à la même heure le week-end ?"
    a: "Oui : une heure de lever fixe, même le week-end, est le levier le plus efficace pour recaler l'horloge interne."
  - q: "Une app peut-elle aider ?"
    a: "Oui : TonApp te rappelle l'heure de coupure des écrans, suit ta régularité et te montre ta progression semaine après semaine."
---

<AnswerBlock question="Comment s'endormir plus vite le soir ?">
  {frontmatter.answer}
</AnswerBlock>

## Ce qui t'empêche de dormir

Corps de l'article… (voir « barre de qualité » plus bas)

## La routine du soir qui marche

### Couper les écrans une heure avant

…

## Comment t'y tenir chaque soir

…

<Faq items={frontmatter.faq} />
```

- **`answer`** et **`faq`** vivent dans le frontmatter → l'AnswerBlock et le FAQPage schema sont **d'office**
  (cohérence totale avec le skill `seo-geo`). Pas de schema orphelin : la `<Faq>` affichée = le `faq:`.
- Composants MDX (`answer-block.tsx`, `mdx.tsx`) sont **thémés au kit UI** actif (cf. skill `ui-kits`) —
  l'article ne « jure » pas avec la landing.

### Rendu de l'article (App Router)

```tsx
// app/[locale]/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getPost, getAllSlugs } from "@/lib/blog";
import { JsonLd } from "@/components/json-ld";
import { articleSchema, faqPageSchema } from "@/lib/schema";

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.flatMap(({ slug }) =>
    (["fr", "en"] as const).map((locale) => ({ locale, slug })),
  );
}

export default async function BlogPost(
  { params }: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await params;
  const post = await getPost(locale, slug).catch(() => null);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-2xl px-5 py-16">
      {/* API UNIQUE du site : <JsonLd data={…} /> (jamais la variante d={…} locale={…}, elle casse le build). */}
      <JsonLd data={{ "@context": "https://schema.org", "@graph": [
        articleSchema({ ...post, locale }),
        faqPageSchema(post.faq),
      ] }} />
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
      {post.content /* MDX compilé */}
    </article>
  );
}
```

`generateMetadata` (title/description/canonical/hreflang/OG) : voir skill `seo-geo`.

---

## Le workflow exact de `/blog "sujet"`

1. **Cadrer l'intention.** Depuis le sujet, déterminer la **requête cible** et l'**intention** (info /
   comparatif / how-to), l'**angle** propre à l'app, et le **slug** (kebab-case, EN, stable). Si le sujet
   est flou, poser **une** question, pas trois.

2. **Rédiger l'anglais d'abord** (`content/blog/en/<slug>.mdx`), à la barre de qualité ci-dessous :
   frontmatter complet (title/description/date/slug/lang/`answer`/`faq`/tags/cover), `<AnswerBlock>` en
   tête, structure H2/H3 claire, exemples concrets, sources quand il y a un fait vérifiable, un lien
   interne vers une autre page/article, un CTA doux vers l'app en fin.

3. **Produire le français** (`content/blog/fr/<slug>.mdx`) — **même slug**. Ce n'est **pas** une traduction
   mot-à-mot : on **adapte** (tournures, exemples, ton FR naturel). Le `faq:` FR est **parallèle** à l'EN
   (mêmes questions, réponses localisées) pour que les deux FAQPage se répondent en hreflang.

4. **SEO/GEO d'office** (délégué au skill `seo-geo`) : `<AnswerBlock>` = 1er bloc, `faq:` → FAQPage,
   metadata + OG + `Article` schema. Rien à faire de plus : les composants tirent du frontmatter.

5. **Mettre à jour le sitemap** — `app/sitemap.ts` étant **dynamique** (`getAllSlugs()`), le nouvel article
   y entre tout seul au build. Vérifier juste que `getAllSlugs()` liste bien le nouveau fichier.

6. **Mettre à jour l'index du blog** — `app/[locale]/blog/page.tsx` liste via `listPosts(locale)` (tri par
   `date` décroissante). Ajouter la vignette (cover + titre + description + date). Si l'`cover` manque,
   générer une image OG-like ou réutiliser l'`opengraph-image`.

7. **Générer la cover** si absente (icône/typo au kit, pas de stock générique moche), placer sous
   `public/blog/<slug>/`.

8. **Vérifier** : `next build` passe (les deux MDX compilent, pas de frontmatter cassé), le JSON-LD parse,
   les liens internes résolvent, FR et EN se croisent en hreflang.

9. **Commit** — message clair : `blog: <slug> (EN+FR)`. **Confirmer avant de publier** (règle Constitution :
   on confirme l'irréversible/le public). Puis **déclencher `/deploy`** (git push → Vercel) → article **en
   ligne**. Annoncer les 2 URLs (`/fr/blog/<slug>` et `/en/blog/<slug>`) + proposer un `/seo` de contrôle.

---

## `lib/blog.ts` — la lecture MDX (POSÉ par `nextjs-landing` ; référence seulement)

> Ce fichier fait partie du socle créé par `nextjs-landing` (il tolère déjà 0 article : `getAllSlugs()`
> renvoie `[]` si le dossier est vide). Montré ici pour que tu saches ce que `/blog` alimente — **ne le
> recrée pas**. Tu ajoutes juste les `.mdx` dans `content/blog/{en,fr}/`.

```ts
// lib/blog.ts
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ROOT = path.join(process.cwd(), "content", "blog");
type QA = { q: string; a: string };
export type Post = {
  slug: string; lang: string; title: string; description: string;
  date: string; updated?: string; cover: string; tags: string[];
  answer: string; faq: QA[]; content: string;
};

export async function getPost(locale: string, slug: string): Promise<Post> {
  const file = path.join(ROOT, locale, `${slug}.mdx`);
  const raw = await fs.readFile(file, "utf8");
  const { data, content } = matter(raw);
  return { slug, ...(data as Omit<Post, "slug" | "content">), content };
}

export async function getAllSlugs(): Promise<{ slug: string; date: string }[]> {
  const dir = path.join(ROOT, "en"); // slugs identiques EN/FR → une langue de référence suffit
  const files = await fs.readdir(dir);
  const out = await Promise.all(
    files.filter((f) => f.endsWith(".mdx")).map(async (f) => {
      const { data } = matter(await fs.readFile(path.join(dir, f), "utf8"));
      return { slug: f.replace(/\.mdx$/, ""), date: data.date as string };
    }),
  );
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function listPosts(locale: string): Promise<Post[]> {
  const slugs = await getAllSlugs();
  return Promise.all(slugs.map(({ slug }) => getPost(locale, slug)));
}
```

(Compilation MDX : `next-mdx-remote/rsc` ou `@next/mdx` avec composants mappés au kit UI dans `mdx.tsx`.)

---

## La barre de qualité éditoriale (ce qui sépare un article d'un remplissage IA)

- **Une intention, une promesse.** L'article répond à **une** question précise, tenue dès le titre et
  l'`<AnswerBlock>`. Pas de fourre-tout.
- **Spécifique, pas générique.** Exemples concrets, chiffres, cas réels, captures/visuels quand ça aide.
  Bannir « à l'ère du numérique », « il est important de noter que », les intros creuses.
- **Sourcé quand c'est factuel.** Un fait vérifiable → une source nommée (ou un renvoi). Domaine sensible
  (santé, religion, finance) → prudence, pas d'invention (cohérent avec la Definition-of-Done, guideline
  1.4 Apple sur les infos inexactes).
- **E-E-A-T.** Une voix, un point de vue, de l'expérience réelle. Auteur nommé (`config.x.handle`).
- **Structure scannable.** H2/H3 logiques, listes, paragraphes courts. **Un seul H1** (le titre).
- **Longueur = juste ce qu'il faut** pour bien répondre (souvent 800–1500 mots), jamais gonflé pour SEO.
- **Maillage interne** : au moins un lien vers une autre page/article pertinent.
- **CTA doux en fin** vers l'app (télécharger / essayer) — informatif, pas racoleur.
- **FR ≠ traduction robotique** : ton naturel, tournures locales, exemples adaptés.

> Résultat : un article que quelqu'un lit jusqu'au bout **et** que ChatGPT/Perplexity citent — parce qu'il
> répond vraiment, avec une réponse citable en tête et un FAQPage structuré. C'est le même moteur SEO/GEO
> que le skill `seo-geo`, appliqué automatiquement à chaque `/blog`.
