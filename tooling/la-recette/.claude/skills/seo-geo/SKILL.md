---
name: seo-geo
description: >
  Le SEO **et** le GEO (Generative Engine Optimization : se faire CITER par les moteurs IA — ChatGPT,
  Perplexity, Google AI Overviews, Bing Copilot) de la landing d'une app, selon une méthode éprouvée en
  production. Charge ce skill dès qu'on parle de référencement, SEO, GEO, « se faire citer par les IA »,
  metadata/OG, sitemap, robots.txt, données structurées / schema JSON-LD, FAQPage, AnswerBlock, ou dès
  qu'on tape /seo (audit + correction d'une page existante). Fournit les patterns de code réels pour
  Next.js App Router (bilingue FR/EN, light+dark).
---

# SEO + GEO — être trouvé par Google ET cité par les IA

> Deux jeux, une seule méthode.
> - **SEO** (classique) : Google t'indexe et te classe → clics organiques.
> - **GEO** (nouveau, décisif en 2026) : quand quelqu'un demande à **ChatGPT / Perplexity / Google AI
>   Overviews / Bing Copilot** « quelle app pour X ? », le moteur **cite ta page** dans sa réponse.
>
> Les moteurs IA ne « classent » pas des liens : ils **extraient des réponses citables**. On écrit donc
> des pages qui répondent **directement, factuellement, en une phrase**, avec les bonnes données
> structurées — et on se fait citer. **Méthode validée en production** (une paire de pages EN+FR :
> `<AnswerBlock>` en tête + `faq:` → FAQPage schema → citations).

> **Ce skill CONSOMME le socle, il ne le crée pas.** `components/answer-block.tsx`,
> `components/json-ld.tsx`, `lib/schema.ts` et `lib/blog.ts` sont posés par le skill **`nextjs-landing`**
> (le propriétaire du scaffold). Les blocs de code ci-dessous sont donnés **pour référence** (savoir ce
> que tu manipules) — **ne les redéfinis pas** dans une page. Si le socle manque, retourne d'abord à
> `nextjs-landing`, sinon le build casse.

---

## Les 5 piliers (dans l'ordre de priorité)

1. **`<AnswerBlock>` en HAUT de page** — une réponse directe et citable à la question de l'utilisateur.
2. **Frontmatter `faq:`** → **JSON-LD `FAQPage`** généré automatiquement (la source n°1 de citations IA).
3. **Metadata complètes** — title / description / canonical / hreflang / **OpenGraph** / Twitter.
4. **Données structurées** — `Organization`, `SoftwareApplication`, `Article` (blog), `BreadcrumbList`.
5. **Fichiers d'indexation** — `sitemap.xml` (dynamique), `robots.txt`, image OG, **`llms.txt`**.

---

## Pilier 1 — `<AnswerBlock>` : le bloc que les IA citent

**Placé tout en haut du contenu** (juste sous le H1). C'est une réponse **auto-portée** : un moteur IA peut
la copier telle quelle sans lire le reste. Règles d'écriture (elles font toute la différence) :

- **La 1re phrase répond directement** à la question titre. Pas d'intro, pas de « De nos jours… ».
- **40–60 mots**, factuel, une entité nommée par phrase (le nom de l'app, la plateforme, le prix, l'usage).
- **Auto-suffisant** : compréhensible hors contexte (les IA découpent en chunks).
- **Pas de survente** : un ton neutre et informatif se fait citer ; un ton pub se fait ignorer.

```tsx
// components/answer-block.tsx  — Server Component (App Router)
// ⚠️ Fichier POSÉ par le skill nextjs-landing. Montré ici pour référence — ne pas recréer.
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
      {/* Le H2 = la question exacte que tape l'utilisateur (bon pour l'extraction) */}
      <h2 className="text-lg font-semibold tracking-tight">{question}</h2>
      {/* La réponse citable : 1re phrase = réponse directe, 40–60 mots */}
      <div className="mt-2 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}
```

```tsx
// Usage en tête d'une page ou d'un article
<AnswerBlock question="Quelle app pour s'endormir plus vite le soir ?">
  <strong>TonApp</strong> est une app iOS qui t'aide à t'endormir plus vite grâce à une routine du soir
  guidée. Gratuite au départ, elle propose un abonnement Premium. Elle marche hors-ligne et te rappelle
  quand couper les écrans. Disponible sur l'App Store.
</AnswerBlock>
```

> Le `data-answer-block` sert d'ancre d'audit (`/seo` vérifie qu'il existe et qu'il est bien le 1er bloc).

---

## Pilier 2 — `faq:` → schema `FAQPage` automatique

Le **FAQPage** est le plus fort levier GEO : structuré, factuel, découpé en Q/R — c'est du prêt-à-citer.
Le pattern : la FAQ vit dans le **frontmatter** (ou le dictionnaire i18n), et **un seul helper** génère à
la fois l'UI et le JSON-LD, pour qu'ils ne divergent jamais.

```ts
// lib/schema.ts  — helpers de données structurées (POSÉ par nextjs-landing ; référence seulement)
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
    publisher: {
      "@type": "Organization",
      name: config.brand,
      url: config.siteUrl,
    },
  };
}
```

```tsx
// components/json-ld.tsx  — API UNIQUE du site (POSÉ par nextjs-landing) : <JsonLd data={…} />
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify échappe naturellement < et & problématiques ici
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

> ⚠️ **Une seule signature, partout : `<JsonLd data={…} />`.** L'objet schema est construit en amont
> (via `lib/schema.ts`) puis passé en `data`. Le composant ne connaît **rien** au dictionnaire i18n.
> N'utilise **jamais** la variante `<JsonLd d={dict} locale={…} />` (schema bâti dans le composant) :
> elle **casse le build dès qu'on ajoute un blog** (un article passe un `data`, pas un `d`). `seo-geo` et
> `auto-blog` sont alignés sur `data={…}` — c'est le contrat.

```tsx
// Dans une page/article : UI + schema depuis la MÊME source `faq`
import { JsonLd } from "@/components/json-ld";
import { faqPageSchema } from "@/lib/schema";
import { Faq } from "@/components/faq";

const faq = [
  { q: "Faut-il savoir coder ?", a: "Non. Tu expliques ton idée, Claude écrit tout le code." },
  { q: "Faut-il un Mac ?", a: "Non. Tout passe par le cloud ; un PC Windows suffit." },
];

<>
  <JsonLd data={faqPageSchema(faq)} />
  <Faq items={faq} />   {/* même tableau → UI et schema toujours synchronisés */}
</>
```

> **Règle d'or** : l'UI FAQ et le JSON-LD FAQPage **doivent** provenir du même tableau. Un schema qui
> décrit une FAQ absente de la page = **spam structuré** aux yeux de Google → sanction. Le skill
> `auto-blog` respecte ça d'office (le `faq:` du frontmatter alimente les deux).

---

## Pilier 3 — Metadata complètes (App Router)

Chaque route exporte des metadata via `generateMetadata` : title, description, **canonical**, **hreflang**
(FR/EN), OpenGraph, Twitter. C'est la base SEO + le rendu propre quand la page est partagée.

```tsx
// app/[locale]/blog/[slug]/page.tsx
import type { Metadata } from "next";
import { config } from "@/lib/config";
import { getPost } from "@/lib/blog";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; slug: string }> },
): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPost(locale, slug);
  const url = `${config.siteUrl}/${locale}/blog/${slug}`;

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: url,
      languages: {
        fr: `${config.siteUrl}/fr/blog/${slug}`,
        en: `${config.siteUrl}/en/blog/${slug}`,
      },
    },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      siteName: config.brand,
      locale: locale === "fr" ? "fr_FR" : "en_US",
      images: [{ url: `${url}/opengraph-image`, width: 1200, height: 630 }],
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      creator: config.x.handle,
    },
  };
}
```

Racine, à définir une fois dans `app/layout.tsx` : `metadataBase: new URL(config.siteUrl)` (rend toutes les
URLs OG absolues) + `title.template` (`%s · La Recette`).

### Image OpenGraph générée (pas de fichier à dessiner)

```tsx
// app/[locale]/blog/[slug]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { getPost } from "@/lib/blog";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG({ params }: { params: { locale: string; slug: string } }) {
  const post = await getPost(params.locale, params.slug);
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "flex-end", padding: 72, background: "#0a0a0c", color: "#fafafa",
        fontSize: 64, fontWeight: 700,
      }}>
        <div style={{ fontSize: 26, opacity: 0.7, marginBottom: 16 }}>La Recette · Blog</div>
        <div style={{ lineHeight: 1.1 }}>{post.title}</div>
      </div>
    ),
    { ...size },
  );
}
```

---

## Pilier 4 — Données structurées de site

Sur la **home** : un `@graph` `Organization` + `SoftwareApplication` (+ `FAQPage` de la home).
Sur chaque **article** : `Article` + son `FAQPage`. Sur les pages profondes : `BreadcrumbList`.
Tous injectés via le même `<JsonLd data={…} />`. (`lib/schema.ts` ci-dessus fournit les usines.)

---

## Pilier 5 — sitemap, robots, llms.txt

```ts
// app/sitemap.ts  — DYNAMIQUE : inclut la home ET tous les articles, FR+EN
import type { MetadataRoute } from "next";
import { config } from "@/lib/config";
import { locales } from "@/lib/i18n";
import { getAllSlugs } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const home = locales.map((l) => ({
    url: `${config.siteUrl}/${l}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: l === "fr" ? 1 : 0.9,
    alternates: { languages: { fr: `${config.siteUrl}/fr`, en: `${config.siteUrl}/en` } },
  }));

  const posts = (await getAllSlugs()).flatMap(({ slug, date }) =>
    locales.map((l) => ({
      url: `${config.siteUrl}/${l}/blog/${slug}`,
      lastModified: new Date(date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: {
          fr: `${config.siteUrl}/fr/blog/${slug}`,
          en: `${config.siteUrl}/en/blog/${slug}`,
        },
      },
    })),
  );

  return [...home, ...posts];
}
```

```ts
// app/robots.ts
import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    // On ACCUEILLE les crawlers IA (GPTBot, PerplexityBot, Google-Extended…) : c'est le canal GEO.
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${config.siteUrl}/sitemap.xml`,
    host: config.siteUrl,
  };
}
```

**`public/llms.txt`** — un résumé Markdown de l'app pour les LLM (qui est le produit, pour qui, prix, FAQ
courte, résumé EN). Fichier statique, prêt-à-citer. Génère-le à partir de l'APP-SPEC (nom, pitch, cible,
prix, 3-5 Q/R clés).

---

## Passe de MESURE — rendre « 100 % optimisé » mesurable, pas déclaratif

Le goal promet « 100 % optimisé ». Une checklist cochée à la main ne le prouve pas : il faut **mesurer**
avec un outil, contre un **budget chiffré**. Cette passe est obligatoire dans `/seo` (et avant un launch).

### 1) Core Web Vitals — PageSpeed Insights (prod) ou Lighthouse (local)

Sur une **URL en ligne**, préfère l'API **PageSpeed Insights** (données Lighthouse + terrain CrUX, aucune
install) :

⚠️ **Syntaxe selon ton shell** — `curl -s` + `${VAR:+…}` est du bash ; dans PowerShell `curl` est un alias
d'`Invoke-WebRequest` (comportement différent), utilise plutôt `Invoke-RestMethod`.

**bash (Mac/Linux)** :
```bash
# Mesure mobile (le pire cas, celui que Google indexe). Clé PSI facultative mais recommandée (quota).
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&category=performance&category=accessibility&category=seo&url=<URL_DE_PROD>${PSI_KEY:+&key=$PSI_KEY}" \
  > psi.json
```

**PowerShell (Windows)** :
```powershell
$psiKey = ""   # optionnel : ta clé PageSpeed Insights
$keyParam = if ($psiKey) { "&key=$psiKey" } else { "" }
Invoke-RestMethod "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&category=performance&category=accessibility&category=seo&url=<URL_DE_PROD>$keyParam" | ConvertTo-Json -Depth 30 | Out-File psi.json -Encoding utf8
```
Dans les deux cas, lire ensuite : `lighthouseResult.categories.{performance,accessibility,seo}.score` et
`lighthouseResult.audits.{largest-contentful-paint,cumulative-layout-shift,total-blocking-time}`.

En **local** (avant deploy), Lighthouse CLI sur le build de prod :

```bash
npx --yes lighthouse <URL_LOCALE> --only-categories=performance,accessibility,seo \
  --form-factor=mobile --output=json --output-path=./lh.json --quiet --chrome-flags="--headless"
```

**Budget Core Web Vitals** (mobile — on échoue si dépassé, on ne « conseille » pas) :

| Métrique | Cible (vert) | Bloquant si |
| --- | --- | --- |
| **LCP** (Largest Contentful Paint) | ≤ 2,5 s | > 4,0 s |
| **CLS** (Cumulative Layout Shift) | ≤ 0,10 | > 0,25 |
| **INP / TBT** (interactivité) | INP ≤ 200 ms · TBT ≤ 200 ms | INP > 500 ms |
| **Score Performance** Lighthouse | ≥ 90 | < 70 |
| **Score SEO** Lighthouse | = 100 | < 90 |

Corrections les plus fréquentes quand ça dépasse : image hero trop lourde (→ `next/image`, voir plus bas),
police bloquante (`next/font` avec `display: "swap"`), JS client inutile (garder des **Server Components**,
pas de `"use client"` sur des sections statiques), dimensions d'images manquantes (→ CLS).

### 2) `next/image` — la règle qui tient le LCP et le CLS

- **Toute image de contenu passe par `next/image`** (jamais `<img>` brut) : format moderne (AVIF/WebP),
  `srcset` responsive et lazy-loading **automatiques**.
- L'image **hero / above-the-fold** : `priority` (préchargée, pas lazy) → protège le LCP.
- **Toujours `width`/`height`** (ou `fill` + conteneur dimensionné) → réserve la place → **CLS ≈ 0**.
- `alt` **réel et descriptif** (SEO + accessibilité). Décoratif → `alt=""`.
- L'image OG (`opengraph-image.tsx`, générée via `next/og`) est vérifiée **présente et 1200×630** — un
  `summary_large_image` sans image = carré vide au partage (couvert par le socle `nextjs-landing`).

### 3) Accessibilité — mini-audit axe-core

Un score d'accessibilité pourri plombe aussi le SEO (Google le mesure). Passe **axe-core** sur la page
rendue et **corrige** les violations `serious`/`critical` :

```bash
# Sur une URL (locale ou prod) : audit axe headless, sortie JSON.
npx --yes @axe-core/cli <URL> --exit --save axe.json
# (Le score Accessibility de PageSpeed/Lighthouse ci-dessus est un doublon rapide si tu ne veux qu'un chiffre.)
```

**Budget accessibilité** : **0** violation `critical` ou `serious`. Points les plus courants à corriger :
contraste de texte insuffisant, `alt` manquant, hiérarchie de titres cassée (plusieurs `<h1>` ou sauts de
niveau), champ de formulaire sans `label`, `lang` de `<html>` absent/faux, cibles tactiles trop petites,
absence de focus visible au clavier. Score Accessibility Lighthouse visé : **≥ 95**.

> Résultat : « 100 % optimisé » devient un **chiffre reproductible** (scores PSI/Lighthouse + 0 violation
> axe), pas une affirmation. `/seo` **applique** les correctifs puis **re-mesure** pour prouver le gain.

---

## `/seo` — le workflow d'audit + correction

`/seo` (optionnellement `/seo <url|route>`) prend une page **existante**, la note, et **corrige seul** les
manques. Étapes :

1. **Récupère** la page (route locale ou URL live) + son HTML rendu.
2. **Audite** contre la checklist ci-dessous ; produit un rapport `✅ / ⚠️ / ⛔`.
3. **Mesure** (passe obligatoire ci-dessus) : PageSpeed/Lighthouse (Core Web Vitals + budget) + axe-core
   (accessibilité) + présence/format de l'image OG. Compare aux budgets chiffrés.
4. **Corrige tout ce qui est code** (composant absent, schema manquant, metadata trous, image en `<img>` →
   `next/image`, contrastes, hiérarchie de titres, LCP/CLS…).
5. **Vérifie + re-mesure** : `next build` passe, le JSON-LD est valide (parse sans erreur, types corrects),
   l'OG rend, et les scores **repassent au-dessus du budget** (preuve du gain, pas une promesse).
6. **Résume** en langage humain ce qui a été réparé, avec les **chiffres avant/après**, + propose `/deploy`.

### Checklist d'audit

- [ ] **`<AnswerBlock>` présent** et **1er bloc** sous le H1, 40–60 mots, 1re phrase = réponse directe.
- [ ] **`FAQPage` JSON-LD** présent **et** aligné avec la FAQ visible (mêmes Q/R, ≥ 3 items).
- [ ] **`<title>`** unique, ≤ 60 car., contient l'entité + le bénéfice ; **description** 140–160 car.
- [ ] **canonical** correct + **hreflang** FR/EN croisés (`alternates.languages`).
- [ ] **OpenGraph** complet (type, url, title, description, image 1200×630) + **Twitter** `summary_large_image`.
- [ ] **`metadataBase`** défini (URLs OG absolues) + `title.template`.
- [ ] **Données structurées** : `Organization` + `SoftwareApplication` (home) / `Article` (blog), valides.
- [ ] **`sitemap.xml`** inclut la page (+ articles) ; **`robots.txt`** autorise et pointe le sitemap.
- [ ] **`llms.txt`** présent et à jour.
- [ ] **Un seul H1** ; hiérarchie H2/H3 propre ; **`lang`** de l'`<html>` correct par locale.
- [ ] **Images** via `next/image` (`alt` réel, `width/height` ou `fill`, `priority` sur le hero) ; image OG 1200×630 présente.
- [ ] **Core Web Vitals** mesurés dans le budget (LCP ≤ 2,5 s · CLS ≤ 0,10 · INP ≤ 200 ms · Perf ≥ 90 · SEO = 100).
- [ ] **Accessibilité** : 0 violation axe `critical`/`serious` (score Lighthouse a11y ≥ 95).
- [ ] **HTTPS** + pas de contenu mixte ; liens internes entre pages (maillage).

> `/seo` ne « conseille » pas dans le vide — il **applique** les correctifs puis prouve que le build passe.
> Ce qui dépend de l'humain (un vrai texte de réponse à valider, une image) est surfacé avec la marche à
> suivre exacte. Cohérent avec le skill `auto-blog`, qui pose déjà AnswerBlock + `faq:` d'office.
