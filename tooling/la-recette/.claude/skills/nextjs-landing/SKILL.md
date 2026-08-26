---
name: nextjs-landing
description: >
  Construit et déploie la landing page + les pages légales d'une app iOS en Next.js (Vercel), selon un
  playbook éprouvé en production. Utilise ce skill dès qu'on veut une landing page pour une app, un site
  marketing, les pages légales (privacy policy / terms / support), le SEO d'une app, un blog, ou déployer
  un site Next.js sur Vercel. Insiste sur les pages légales conformes App Store (HTTPS + tiers nommés) qui
  sont bloquantes pour la review Apple. C'est ce skill qui POSE tout le socle SEO/GEO (config, schema,
  AnswerBlock, blog compilable, image OG) dont dépendent les skills `seo-geo` et `auto-blog`.
---

# Next.js Landing — site, pages légales & socle SEO/GEO

La landing est un **repo séparé** de l'app (souvent branche `main`, pas `master` — vérifier
`git branch --show-current` avant d'éditer). Déploiement **Vercel**.

> **🎨 Rendu visuel = délègue au skill `design-taste-frontend` (Taste Skill, MIT).** Ce skill-ci pose la
> STRUCTURE (sections, socle SEO/GEO, pages légales, déploiement). Pour que la landing soit **belle et
> jamais « vibe-codée IA »**, charge `design-taste-frontend` : il lit le brief, énonce un « design read »
> (type de page / audience / vibe), choisit une vraie direction design (typo, espacements, couleurs,
> motion) et impose un **pre-flight qualité** avant livraison. Marie-le au **kit UI** choisi (`ui-kits`) :
> le kit donne l'ambiance, `design-taste-frontend` empêche le rendu générique.

> **Ce skill est le PROPRIÉTAIRE du socle.** Il crée `lib/config.ts`, `lib/i18n.ts`, `lib/schema.ts`,
> `components/json-ld.tsx`, `components/answer-block.tsx`, `lib/blog.ts`, la config MDX, une **route blog
> vide mais compilable**, et l'**image OpenGraph par défaut**. Les skills `seo-geo` (audit + citations IA)
> et `auto-blog` (`/blog`) **consomment** ce socle sans le redéfinir. Si tu ajoutes un blog ou une passe
> SEO sur un site qui n'a pas ce socle, **reviens ici d'abord** : sans lui, le build casse.

---

## ⚠️ Priorité n°1 : les pages légales (bloquant App Store)
Apple **clique réellement** ces liens pendant la review. Il faut :
- `/(locale)/privacy`, `/terms`, `/support` en **HTTPS 200** (un 404 = rejet).
- La **Politique de confidentialité** doit **nommer explicitement les tiers** utilisés : le prestataire IA
  (si IA), Supabase, RevenueCat, Apple. Cohérent avec l'App Privacy label + la divulgation IA in-app.
- Ces URLs sont renseignées dans App Store Connect (Privacy Policy URL sur la page App Privacy ; Support/
  Marketing URL sur la page Version ; EULA/Terms si custom).
- Mentionner l'**essai gratuit** et les conditions d'abonnement (auto-renouvellement) dans les Terms.

## Landing (conversion)
- **Hero** : le positionnement en une phrase (la même punchline que le sous-titre App Store) + CTA
  **« Download on the App Store »** (badge officiel) vers la fiche.
- Sections : le problème → la solution → 3-4 features (captures/mockups) → preuve/valeurs → CTA final.
- Design **premium, épuré, monochrome + 1 accent** (style Linear/Vercel). Pas de look
  « template IA ». Responsive mobile-first.
- Récupérer l'App ID / lien App Store une fois l'app créée dans ASC.

## Stack
- **Next.js** (App Router, v16+) + TypeScript + Tailwind (v4) + React 19. Composants serveur par défaut.
- Alias d'import `@/*` → racine du projet (`tsconfig.json` → `"paths": { "@/*": ["./*"] }`).
- Déploiement **Vercel**. HTTPS auto. Domaine custom pointé sur Vercel quand il existe.

---

## Le socle SEO/GEO — à générer À LA CRÉATION du site

Arborescence cible (ce skill la pose ; `seo-geo` et `auto-blog` s'appuient dessus) :

```
landing/
├─ lib/
│  ├─ config.ts        ← brand, siteUrl (OBLIGATOIRE), handles, offre — le SEUL fichier à éditer par app
│  ├─ i18n.ts          ← locales FR/EN + dictionnaire + getDict
│  ├─ schema.ts        ← usines JSON-LD : organization / softwareApplication / article / faqPage
│  └─ blog.ts          ← lecture MDX (getPost / getAllSlugs / listPosts) — tolère 0 article
├─ components/
│  ├─ json-ld.tsx      ← API UNIQUE du site : <JsonLd data={…} />  (voir « API JSON-LD » ci-dessous)
│  ├─ answer-block.tsx ← le bloc citable par les IA (GEO)
│  └─ faq.tsx          ← UI FAQ (même source que le FAQPage)
├─ content/blog/
│  ├─ en/.gitkeep      ← dossiers créés VIDES (le blog compile sans article)
│  └─ fr/.gitkeep
├─ app/
│  ├─ opengraph-image.tsx        ← image OG PAR DÉFAUT (home + pages légales), générée via next/og
│  ├─ sitemap.ts                 ← dynamique (home + articles)
│  ├─ robots.ts
│  └─ [locale]/
│     ├─ layout.tsx              ← metadataBase + title.template + OG/Twitter
│     ├─ page.tsx                ← home + <JsonLd data={…} />
│     ├─ privacy|terms|support/  ← pages légales
│     └─ blog/
│        ├─ page.tsx             ← INDEX blog (liste vide OK)
│        └─ [slug]/page.tsx      ← article (compile même sans MDX présent)
└─ next.config.ts                ← config MDX
```

### `lib/config.ts` — le seul fichier à personnaliser, `siteUrl` OBLIGATOIRE

`siteUrl` conditionne canonical, sitemap, hreflang, OG et `metadataBase`. **S'il est faux, tout pointe
vers le mauvais domaine et Google désindexe en silence.** On le rend donc **obligatoire et vérifié au
build** : tant qu'il n'est pas l'URL HTTPS réelle (domaine custom OU URL Vercel de prod), le build casse.

```ts
// lib/config.ts — édite CE fichier, pas le reste.
export const config = {
  brand: "TON_APP",                              // ← nom de l'app (générique : à remplir)
  // ⚠️ OBLIGATOIRE. L'URL HTTPS FINALE du site : ton domaine custom si tu l'as, sinon
  // l'URL de prod Vercel réelle (ex. https://ton-app.vercel.app) obtenue APRÈS le 1er deploy.
  // Ne laisse JAMAIS un placeholder ici (voir garde-fou plus bas).
  siteUrl: "https://REMPLACE-MOI.example",       // ← à renseigner par app
  x: { handle: "@ton_handle", url: "https://x.com/ton_handle" },
  appStoreUrl: "#",                              // lien de la fiche App Store (quand elle existe)
} as const;

export type SiteConfig = typeof config;

// Garde-fou : casse le build tant que siteUrl est un placeholder ou n'est pas en HTTPS.
if (
  !/^https:\/\//.test(config.siteUrl) ||
  /REMPLACE-MOI|example\.com|localhost|larecette/i.test(config.siteUrl)
) {
  throw new Error(
    "[config] siteUrl doit être l'URL HTTPS RÉELLE du site (domaine custom ou URL Vercel de prod). " +
      "Édite lib/config.ts. C'est bloquant : canonical/sitemap/OG en dépendent.",
  );
}
```

> **Chicken-and-egg au 1er deploy** : si tu n'as pas encore de domaine custom, tu ne connais l'URL Vercel
> qu'APRÈS un premier `vercel deploy --prod`. Flux : (1) `vercel link --yes` (cf. déploiement), (2) 1er
> `vercel deploy --prod` → récupère l'URL `*.vercel.app`, (3) colle-la dans `siteUrl`, (4) **redéploie**
> pour que canonical/sitemap/OG soient corrects. Dès que le domaine custom est branché, remets-le ici.

### `lib/i18n.ts` — locales + dictionnaire

```ts
export type Locale = "fr" | "en";
export const locales: Locale[] = ["fr", "en"];
export const defaultLocale: Locale = "fr";
export function isLocale(x: string): x is Locale {
  return (locales as string[]).includes(x);
}
// dict, Dictionary, getDict(locale) : le contenu bilingue (meta.title/description, faq.items, …).
```

### API JSON-LD — **une seule signature pour tout le site**

Le composant expose **exactement** `<JsonLd data={…} />` (l'objet schema est construit en amont via
`lib/schema.ts`). C'est **l'unique** signature : `seo-geo` et `auto-blog` l'utilisent telle quelle.

> ⚠️ **Piège de build à éviter.** Certaines vieilles landings définissent `JsonLd` avec une autre
> signature (`<JsonLd d={dict} locale={…} />`, où le schema est bâti DANS le composant). Cette variante
> **casse dès qu'on ajoute un blog** (l'article passe un `data={…}`, pas un `d`). On standardise donc sur
> `data={…}` partout, et le composant ne connaît **rien** au dictionnaire.

```tsx
// components/json-ld.tsx — API UNIQUE : <JsonLd data={…} />
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify échappe naturellement les < et & problématiques ici.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

### `lib/schema.ts` — les usines de données structurées

Toutes les pages injectent leur JSON-LD via `<JsonLd data={…} />`, l'objet venant d'ici. Home = un
`@graph` `Organization` + `SoftwareApplication` (+ `FAQPage`). Article = `Article` + son `FAQPage`.

```ts
// lib/schema.ts
import { config } from "@/lib/config";

type QA = { q: string; a: string };

export function faqPageSchema(items: QA[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: config.brand,
    url: config.siteUrl,
    sameAs: [config.x.url],
  };
}

export function softwareApplicationSchema(a: { description: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: config.brand,
    applicationCategory: "MobileApplication",
    operatingSystem: "iOS",
    description: a.description,
    url: config.siteUrl,
    ...(config.appStoreUrl !== "#" ? { downloadUrl: config.appStoreUrl } : {}),
    author: { "@type": "Person", name: config.x.handle, url: config.x.url },
  };
}

export function articleSchema(a: {
  title: string; description: string; slug: string;
  locale: string; date: string; updated?: string; image: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    inLanguage: a.locale,
    datePublished: a.date,
    dateModified: a.updated ?? a.date,
    image: [a.image],
    mainEntityOfPage: `${config.siteUrl}/${a.locale}/blog/${a.slug}`,
    author: { "@type": "Person", name: config.x.handle, url: config.x.url },
    publisher: { "@type": "Organization", name: config.brand, url: config.siteUrl },
  };
}
```

Usage sur la home (schema construit puis passé en `data`) :

```tsx
// app/[locale]/page.tsx
import { JsonLd } from "@/components/json-ld";
import { organizationSchema, softwareApplicationSchema, faqPageSchema } from "@/lib/schema";
import { getDict, isLocale, defaultLocale } from "@/lib/i18n";

const d = getDict(isLocale(locale) ? locale : defaultLocale);
<JsonLd data={{
  "@context": "https://schema.org",
  "@graph": [
    organizationSchema(),
    softwareApplicationSchema({ description: d.meta.description }),
    faqPageSchema(d.faq.items),
  ],
}} />
```

### `components/answer-block.tsx` — le bloc que les IA citent (base du GEO)

Posé ici pour que la home et les articles puissent l'utiliser. Règles d'écriture : cf. skill `seo-geo`.

```tsx
// components/answer-block.tsx — Server Component
export function AnswerBlock({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={question}
      data-answer-block
      className="mb-10 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <h2 className="text-lg font-semibold tracking-tight">{question}</h2>
      <div className="mt-2 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}
```

### `lib/blog.ts` + config MDX — un blog **vide mais compilable**

Objectif : le site compile **avec zéro article**. Les dossiers `content/blog/{en,fr}/` existent (vides, via
`.gitkeep`), `getAllSlugs()` renvoie `[]`, l'index et `generateStaticParams` gèrent la liste vide.

Dépendances à ajouter (non présentes par défaut) : `gray-matter` (frontmatter) et un compilateur MDX
(`next-mdx-remote/rsc` recommandé pour l'App Router). Annonce l'ajout de ces deux dépendances ; ne lance
pas l'install toi-même (c'est `/deploy` / l'humain qui exécute).

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

export async function getAllSlugs(): Promise<{ slug: string; date: string }[]> {
  const dir = path.join(ROOT, "en"); // slugs identiques EN/FR → une langue de référence suffit
  let files: string[] = [];
  try {
    files = await fs.readdir(dir);
  } catch {
    return []; // dossier absent → blog vide, on ne casse pas le build
  }
  const out = await Promise.all(
    files.filter((f) => f.endsWith(".mdx")).map(async (f) => {
      const { data } = matter(await fs.readFile(path.join(dir, f), "utf8"));
      return { slug: f.replace(/\.mdx$/, ""), date: data.date as string };
    }),
  );
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPost(locale: string, slug: string): Promise<Post> {
  const raw = await fs.readFile(path.join(ROOT, locale, `${slug}.mdx`), "utf8");
  const { data, content } = matter(raw);
  return { slug, ...(data as Omit<Post, "slug" | "content">), content };
}

export async function listPosts(locale: string): Promise<Post[]> {
  const slugs = await getAllSlugs();
  return Promise.all(slugs.map(({ slug }) => getPost(locale, slug)));
}
```

Routes blog **minimales mais compilables** (le rendu MDX riche est enrichi par `auto-blog`) :

```tsx
// app/[locale]/blog/page.tsx — INDEX (liste vide tolérée)
import { listPosts } from "@/lib/blog";
export default async function BlogIndex(
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const posts = await listPosts(locale);
  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
      {posts.length === 0 ? (
        <p className="mt-4 text-muted">Bientôt des articles.</p>
      ) : (
        <ul className="mt-8 space-y-6">
          {posts.map((p) => (
            <li key={p.slug}>
              <a href={`/${locale}/blog/${p.slug}`}>{p.title}</a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

```tsx
// app/[locale]/blog/[slug]/page.tsx — article (compile même avec 0 MDX)
import { notFound } from "next/navigation";
import { getAllSlugs, getPost } from "@/lib/blog";

export async function generateStaticParams() {
  const slugs = await getAllSlugs(); // [] tant qu'il n'y a pas d'article → route valide, 0 page
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
      <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
      {/* Rendu MDX + <JsonLd data={…} /> (Article + FAQPage) : enrichi par le skill auto-blog. */}
    </article>
  );
}
```

```ts
// next.config.ts — active MDX (pages .mdx du blog)
import type { NextConfig } from "next";
import createMDX from "@next/mdx";
const withMDX = createMDX();
const nextConfig: NextConfig = { pageExtensions: ["ts", "tsx", "md", "mdx"] };
export default withMDX(nextConfig);
```

### Image OpenGraph par défaut (home + pages légales) — via `next/og`

Le site déclare `twitter.card = "summary_large_image"` : il **faut** une vraie image OG, sinon le partage
affiche un carré vide. On la **génère** (aucun fichier à dessiner) au niveau racine, ce qui la propage à
**toutes** les routes qui n'en définissent pas — home ET pages légales incluses. (Les articles de blog
définissent leur propre `opengraph-image.tsx` par slug, côté `auto-blog`.)

```tsx
// app/opengraph-image.tsx — OG 1200×630 par défaut, héritée par home + /privacy + /terms + /support
import { ImageResponse } from "next/og";
import { config } from "@/lib/config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = config.brand;

export default function OG() {
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "flex-end", padding: 72, background: "#0a0a0c", color: "#fafafa",
        fontSize: 64, fontWeight: 700,
      }}>
        <div style={{ fontSize: 26, opacity: 0.7, marginBottom: 16 }}>{config.brand}</div>
        <div style={{ lineHeight: 1.1, fontSize: 48 }}>{config.brand}</div>
      </div>
    ),
    { ...size },
  );
}
```

> Next câble automatiquement `opengraph-image.tsx` dans les metadata (`openGraph.images` + le pendant
> Twitter). Tu n'as donc pas à référencer l'image à la main dans `generateMetadata`.

### `layout.tsx` — `metadataBase` + `title.template`

```tsx
// app/[locale]/layout.tsx (generateMetadata)
return {
  metadataBase: new URL(config.siteUrl),                 // rend toutes les URLs OG absolues
  title: { default: d.meta.title, template: `%s · ${config.brand}` },
  description: d.meta.description,
  alternates: {
    canonical: `${config.siteUrl}/${lang}`,
    languages: {
      fr: `${config.siteUrl}/fr`,
      en: `${config.siteUrl}/en`,
      "x-default": `${config.siteUrl}/fr`,
    },
  },
  openGraph: { title: d.meta.title, description: d.meta.description, url: `${config.siteUrl}/${lang}`,
    siteName: config.brand, type: "website", locale: lang === "fr" ? "fr_FR" : "en_US" },
  twitter: { card: "summary_large_image", title: d.meta.title, description: d.meta.description,
    creator: config.x.handle },
  robots: { index: true, follow: true },
};
```

Les pages légales exportent un `title` (ex. `"Confidentialité"`) → le `template` produit
`Confidentialité · TON_APP`, et elles héritent de l'OG par défaut.

### `sitemap.ts` / `robots.ts` — dynamiques

`sitemap.ts` liste la home (FR/EN) **et** tous les articles via `getAllSlugs()` (voir skill `seo-geo`
pour la version complète). `robots.ts` accueille les crawlers (`allow: "/"`) et pointe le sitemap. Les deux
tirent leurs URLs de `config.siteUrl` — d'où l'importance du garde-fou ci-dessus.

---

## Déploiement Vercel — link non-interactif AVANT tout deploy

Un agent ne peut pas répondre aux questions interactives de Vercel (« Link to existing project? »,
« Which scope? »…). On **lie** donc le dossier au projet en mode `--yes` (toutes les réponses par défaut),
et on **détecte** que c'est déjà fait par la présence de `.vercel/project.json`. ⚠️ **Utilise la syntaxe de
ton shell** (PowerShell sur Windows, bash sur Mac) — un `if [ … ]`/`$VAR` bash plante dans PowerShell.

**PowerShell (Windows)** :
```powershell
# Depuis le dossier landing/ :
$env:VERCEL_TOKEN = "<valeur lue depuis .recette/secrets.env>"
if (-not (Test-Path .vercel/project.json)) {
  npx --yes vercel link --yes --token $env:VERCEL_TOKEN     # zéro question, crée/lie le projet
}
npx --yes vercel deploy --prod --token $env:VERCEL_TOKEN
```

**bash (Mac/Linux)** :
```bash
# Depuis le dossier landing/ :
export VERCEL_TOKEN="<valeur lue depuis .recette/secrets.env>"
if [ ! -f .vercel/project.json ]; then
  npx --yes vercel link --yes --token "$VERCEL_TOKEN"       # --yes = zéro question, crée/lie le projet
fi
npx --yes vercel deploy --prod --token "$VERCEL_TOKEN"
```

- **Sans `.vercel/project.json`**, un `vercel deploy --prod` direct **bloque** sur des prompts → l'agent
  hang. Le `vercel link --yes` conditionnel résout ça.
- Alternative : repo GitHub connecté à Vercel → deploy auto sur push `main` (le `git push` suffit ; vérifie
  juste que le déploiement part). Le `vercel link` reste utile pour les deploys CLI manuels.
- **Après le 1er deploy**, récupère l'URL de prod, **mets-la dans `config.siteUrl`** (sinon garde-fou =
  build cassé au prochain build), puis **redéploie**. Teste que `/`, `/privacy`, `/terms`, `/support`
  répondent en **200** (un 404 légal = rejet Apple).

---

## Checklist avant launch
- [ ] `lib/config.ts` : `siteUrl` = URL HTTPS réelle (domaine custom ou Vercel), **pas de placeholder**
- [ ] Socle posé : `schema.ts`, `json-ld.tsx` (API `data={…}`), `answer-block.tsx`, `blog.ts`, MDX, blog vide compilable
- [ ] Image OG par défaut (`app/opengraph-image.tsx`) + `metadataBase` + `title.template`
- [ ] `/privacy` `/terms` `/support` en ligne, HTTPS 200, tiers nommés
- [ ] URLs collées dans App Store Connect
- [ ] Badge App Store + lien vers la fiche
- [ ] Responsive OK, favicon, OG image rend au partage
- [ ] `.vercel/project.json` présent (lien fait) ; déployé sur Vercel, domaine custom actif
