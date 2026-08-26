---
name: ui-kits
description: >
  La bibliothèque de LOOKS CURÉS de La Recette — pas un dump de composants génériques (c'est ça
  qui fait « vibe-codé IA »), mais 3 kits complets et cohérents (thème clair+sombre + jeu d'écrans +
  onboarding-questionnaire + paywall assortis). Charge ce skill dès que l'utilisateur touche au
  DESIGN de son app : commande /ui, choisir/changer le look, la palette, l'accent, le thème, le style,
  « ça fait trop IA », « rends ça plus premium/épuré/chaleureux », clair/sombre. À appliquer AVANT ou
  pendant le scaffold Expo pour poser une identité visuelle unique dès le départ.
---

# UI Kits — des looks curés, jamais du vibe-codé

> **Le piège n°1 d'une app buildée par IA** : le look « générique IA ». Cartes fades, dégradé violet
> partout, 4 couleurs qui se battent, aucune direction. Un œil entraîné le repère en 2 secondes → l'app
> a l'air d'un template gratuit → personne ne paie.
>
> **La parade** : on ne pose JAMAIS des composants génériques. On applique **un kit** — une identité
> visuelle complète et cohérente, décidée d'avance, où chaque écran, l'onboarding et le paywall parlent
> la même langue. Trois règles non négociables :
>
> 1. **UN seul accent.** Monochrome (gris + noir/blanc) + **une** couleur d'action. Jamais deux couleurs
>    vives qui rivalisent. La couleur, c'est un outil de hiérarchie, pas de décoration.
> 2. **Cohérence radicale.** Un rayon, une échelle d'espacement, une famille typo, un jeu de tokens
>    sémantiques — partout. Si un écran a des coins à 8px et un autre à 20px, c'est cassé.
> 3. **Le kit décide, pas l'improvisation.** On choisit un kit, on applique ses tokens, on ne
>    « bricole » pas une couleur au feeling écran par écran.

---

## Ce que `/ui` fait (le flux)

`/ui` n'assomme pas le débutant avec un color-picker. Il pose **3 questions max**, en déduit un kit,
puis **applique tout** (thème + variantes onboarding/paywall) au scaffold Expo et lance le typecheck.

**Q1 — Ton univers ?** (ça choisit le kit par défaut)
- « Un outil, du sérieux, de la productivité, du pro » → **Linear-minimal** (le défaut maison).
- « Quelque chose d'immersif, de contemplatif, de premium, du beau qui respire » → **iOS-native frost**.
- « Du contenu, du lifestyle, de l'humain, du chaleureux, un magazine » → **Warm editorial**.

**Q2 — Une couleur d'accent en tête ?** (sinon on garde celle du kit — elles sont déjà réglées pour bien
rendre en clair ET sombre). On accepte un mot (« bleu », « vert forêt ») ou un hex. On dérive
automatiquement la version claire (dark) et le `accentSoft`.

**Q3 — Clair, sombre, ou les deux ?** Par défaut **les deux** (le système iOS bascule tout seul). On ne
retire jamais un mode sans raison.

Puis Claude, **tout seul** :
1. écrit `src/constants/theme.ts` avec les tokens du kit (structure ci-dessous) ;
2. pose les composants de base du kit (`Button`, `Card`, `Input`, `Screen`, `Sheet`, nav) dans `src/ui/components` ;
3. branche la **variante d'onboarding-questionnaire** et la **variante de paywall** assorties au kit ;
4. lance `tsc --noEmit` (+ bundle si demandé) et montre un aperçu.

> On peut **rechanger** de kit à tout moment (`/ui` → « plutôt le chaleureux »). Comme tout passe par les
> tokens sémantiques, re-thémer = réécrire un seul fichier, pas 40 écrans.

---

## Le contrat de tokens (commun à tous les kits)

Chaque kit remplit **exactement** cette forme (on nomme par le RÔLE, jamais par la couleur). C'est le
même squelette que le `src/constants/theme.ts` éprouvé en production — les écrans consomment `colors.text`, jamais `#111`.

```ts
// src/constants/theme.ts  — SOURCE UNIQUE DE VÉRITÉ du look. On modifie ICI.
export const Colors = {
  light: {
    background: '…',        // fond de l'écran
    surface: '…',           // carte / feuille posée sur le fond
    surfaceElevated: '…',   // carte au-dessus d'une carte (modale, menu)
    text: '…',              // texte principal
    textSecondary: '…',     // texte secondaire (sous-titres)
    textMuted: '…',         // texte tertiaire (légendes, placeholders)
    accent: '…',            // LA couleur d'action (boutons, liens, sélection)
    accentSoft: '…',        // fond d'accent à faible opacité (badge, état sélectionné)
    border: '…',            // filets de séparation
    success: '…',           // validation
    danger: '…',            // erreur / destructif
    overlay: '…',           // voile derrière une modale
  },
  dark: { /* mêmes clés, valeurs nuit */ },
} as const;

export const Radius   = { sm: 0, md: 0, lg: 0, xl: 0, full: 9999 };   // ← réglé par le kit
export const Spacing  = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 };
export const FontSize = { caption: 12, footnote: 13, body: 16, callout: 18, title3: 22, title2: 28, title1: 34 };
export const Fonts    = { /* réglé par le kit (system-ui / serif custom) */ };
```

Un hook `useTheme()` (déjà dans le scaffold, dans `@/hooks/use-theme`) renvoie `Colors[mode]` selon le
thème système — c'est celui que les archétypes clonés consomment (`const theme = useTheme()` → `theme.accent`,
`theme.text`…). **Aucun composant n'écrit une couleur en dur** — sinon le mode sombre casse et l'app
redevient « vibe-codée ».

---

# Kit 1 — Linear-minimal  ·  *le défaut maison*

> **Ambiance** : silencieux, dense, précis. Noir/blanc + gris + **un** indigo. Rayons serrés, filets fins,
> quasi zéro ombre, typo système nette. C'est le langage de Linear / Vercel / Raycast : ça respire le
> « logiciel sérieux ». **C'est le goût par défaut du proprio — en cas de doute, c'est celui-là.**
>
> **Pour quel type d'app** : productivité, outils, dashboards, finance, dev-tools, tracking, B2B, tout ce
> qui doit inspirer confiance et sobriété.

### Tokens

```ts
Colors = {
  light: {
    background: '#FCFCFD',  surface: '#FFFFFF',  surfaceElevated: '#F7F7F8',
    text: '#111114',  textSecondary: '#5B5B66',  textMuted: '#8A8A94',
    accent: '#5E6AD2',  accentSoft: 'rgba(94,106,210,0.10)',
    border: 'rgba(17,17,20,0.08)',
    success: '#3FA46A',  danger: '#E5484D',  overlay: 'rgba(10,10,12,0.45)',
  },
  dark: {
    background: '#08090A',  surface: '#101114',  surfaceElevated: '#17181B',
    text: '#F7F8F8',  textSecondary: 'rgba(255,255,255,0.62)',  textMuted: 'rgba(255,255,255,0.40)',
    accent: '#7C89F7',  accentSoft: 'rgba(124,137,247,0.16)',
    border: 'rgba(255,255,255,0.09)',
    success: '#4CC38A',  danger: '#FF6369',  overlay: 'rgba(0,0,0,0.66)',
  },
}
Radius   = { sm: 6, md: 10, lg: 14, xl: 20, full: 9999 };   // ← serré, « logiciel »
Fonts    = { sans: 'system-ui', mono: 'ui-monospace', serif: 'ui-serif' };
```

- **Typo** : `system-ui` (SF Pro sur iOS). Titres en **600/700**, tracking légèrement négatif (`-0.2`)
  sur les gros titres ; corps en 400. Les **chiffres/metadata en `mono`** (dates, compteurs, IDs) — c'est
  la signature Linear.
- **Espacement** : dense mais aéré aux bons endroits ; padding carte `three` (16), gap listes `two` (8).

### Composants clés
- **Button** : plein `accent` texte blanc, rayon `md` (10), **pas d'ombre**, `:pressed` = opacité 0.85.
  Variante `ghost` = fond transparent + `border` 1px + texte `text`.
- **Card** : `surface`, `border` 1px, rayon `lg` (14), **ombre quasi nulle** (`shadowOpacity 0.04`).
- **Input** : fond `surfaceElevated`, `border` 1px, rayon `md`, focus = `border: accent`.
- **Nav** : header fin sans grosse ombre, titre 17/600 ; tab bar minimaliste, icône active en `accent`.
- **Segmented control** (toggle) pour les bascules (ex. période d'abo) — très « app pro ».

### Onboarding-questionnaire assorti
Une **question par écran**, plein écran, **zéro emoji, zéro illustration** — juste du type. Barre de
progression **fine** (2px) en haut. Grande question en 28/700, options en cartes à filet fin ; l'option
choisie prend `border: accent` + `accentSoft` en fond. Bouton **Continuer** épinglé en bas, plein `accent`.
Rythme : rapide, sec, respectueux du temps.

### Paywall assorti
Monochrome, **un seul** CTA `accent`. Liste de bénéfices avec petits checks fins. Bascule
**hebdo / annuel** en segmented control ; prix affiché **grand, en `mono`** (jamais de prix hardcodé —
seul le prix réel StoreKit, cf. skill revenuecat). Lien texte **« Restaurer les achats »** + liens minus­cules
**Conditions · Confidentialité**. Aucun dégradé criard, aucune fausse urgence clignotante.

---

# Kit 2 — iOS-native frost  ·  *cinématique translucide*

> **Ambiance** : premium, immersif, apaisant. Une **photo de fond cinématique** + des surfaces **frost**
> (verre dépoli, `BlurView`) sur les écrans « signature » (hub, auth, onboarding), et des **surfaces
> solides** partout ailleurs pour la lisibilité. Accent **bleu clair de lune**. C'est un langage
> cinématique et contemplatif — le beau qui respire. Le mode **sombre** (ciel nocturne) est la signature ;
> le clair en est l'aube douce.
>
> **Pour quel type d'app** : spiritualité, méditation, wellness, journaling, méteo/nature, tout ce qui
> gagne à être contemplatif et « cher ».

### Tokens (éprouvés en production)

```ts
Colors = {
  light: {
    background: '#F2F2F6',  surface: '#FFFFFF',  surfaceElevated: '#FFFFFF',
    text: '#1C1C1E',  textSecondary: '#6B6B70',  textMuted: '#9A9AA0',
    accent: '#2F6FE6',  accentSoft: 'rgba(47,111,230,0.12)',
    border: 'rgba(0,0,0,0.08)',
    success: '#2FA36B',  danger: '#D9544D',  overlay: 'rgba(0,0,0,0.40)',
  },
  dark: {
    background: '#0C0C0F',  surface: '#1C1D22',  surfaceElevated: '#26272D',
    text: '#F2F2F7',  textSecondary: 'rgba(255,255,255,0.62)',  textMuted: 'rgba(255,255,255,0.40)',
    accent: '#5E9CFF',  accentSoft: 'rgba(94,156,255,0.18)',
    border: 'rgba(255,255,255,0.10)',
    success: '#5BC08C',  danger: '#FF6B61',  overlay: 'rgba(0,0,0,0.66)',
  },
}
Radius   = { sm: 8, md: 14, lg: 22, xl: 32, full: 9999 };   // ← doux, apaisant
Fonts    = { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' };
```

- **La règle frost, précise** : les écrans **hub / auth / onboarding** posent une image `CinematicBackdrop`
  plein écran + des cartes `BlurView` (`intensity` 30–50, `tint` selon le mode) avec un filet blanc à 10%.
  **Tous les autres écrans** (listes, réglages, détail) utilisent les surfaces **solides** ci-dessus — le
  frost partout tue la lisibilité et rame. La photo et le dégradé de ciel sont **codés en dur** sur ces
  3 écrans, ils n'utilisent pas les tokens de surface.
- **Typo** : titres contemplatifs en **serif** (`ui-serif`) ; UI courante en `system-ui`. Radius généreux.

### Composants clés
- **FrostCard** : `BlurView` + overlay `rgba(255,255,255,0.06)` + filet 1px, rayon `lg`/`xl`.
- **CinematicBackdrop** : `<ImageBackground>` plein écran + voile dégradé (lisibilité du texte blanc).
- **Button** : plein `accent`, texte blanc, rayon `full` ou `lg` ; sur frost, variante verre + bord blanc.
- **Screen** : hors écrans-signature, fond `background` solide + cartes `surface`.
- **Sheet** modale : coins `xl` (32), poignée, fond `surfaceElevated`.

### Onboarding-questionnaire assorti
Cartes **frostées** posées sur la photo cinématique, **titres en serif** contemplatifs, **aucun emoji**.
Transitions douces, progression discrète. Le ton est calme, pas « growth-hacky ». (Voir aussi le skill
`app-onboarding` : questionnaire → valeur perçue → paywall.)

### Paywall assorti
Feuille **frost** montée sur la photo, accent **bleu**, titre serif. Bénéfices en liste sobre, essai gratuit
mis en avant si présent, prix réel StoreKit, **Restaurer** + liens légaux. L'ambiance reste sereine — on
vend par le beau et la valeur, pas par la pression.

---

# Kit 3 — Warm editorial  ·  *chaleureux, humain, magazine*

> **Ambiance** : chaud, éditorial, généreux. Fond **papier crème**, encre profonde, **serif** de titrage
> à fort caractère, accent **terracotta**. Beaucoup d'air, de grandes images, des interlignes larges — ça
> lit comme un beau magazine, pas comme un tableur.
>
> **Pour quel type d'app** : contenu, recettes, lecture, voyage, lifestyle, food, communauté, journal
> intime, tout ce qui est humain et raconte une histoire.

### Tokens

```ts
Colors = {
  light: {
    background: '#FBF7F0',  surface: '#FFFFFF',  surfaceElevated: '#FFFDF9',
    text: '#24201B',  textSecondary: '#6B6157',  textMuted: '#9C9186',
    accent: '#C2603B',  accentSoft: 'rgba(194,96,59,0.12)',
    border: 'rgba(36,32,27,0.10)',
    success: '#4E8D5B',  danger: '#C0453B',  overlay: 'rgba(36,32,27,0.42)',
  },
  dark: {
    background: '#17130F',  surface: '#211C17',  surfaceElevated: '#2A241E',
    text: '#F3ECE1',  textSecondary: 'rgba(243,236,225,0.66)',  textMuted: 'rgba(243,236,225,0.42)',
    accent: '#E0865C',  accentSoft: 'rgba(224,134,92,0.18)',
    border: 'rgba(243,236,225,0.12)',
    success: '#6FB77E',  danger: '#E4776B',  overlay: 'rgba(0,0,0,0.62)',
  },
}
Radius   = { sm: 10, md: 16, lg: 24, xl: 34, full: 9999 };   // ← moelleux, généreux
Fonts    = { serif: 'Fraunces_600SemiBold', sans: 'system-ui', mono: 'ui-monospace' };
```

- **Typo** : **titres en serif de caractère** — charger p.ex. `@expo-google-fonts/fraunces` (ou Newsreader /
  Source Serif). Corps en `system-ui` à interligne large (`lineHeight` ~1.6). Les gros titres portent
  l'app : gros, serré, éditorial.
- **Espacement** : généreux (`four`/`five` entre blocs). Grandes images en pleine largeur, coins `lg`.

### Composants clés
- **Button** : plein `accent` (terracotta), texte crème, rayon `full`, très légère ombre chaude.
- **Card** : `surface`, rayon `lg` (24), image en tête + titre serif + méta discrète.
- **PullQuote / Callout** : bloc `accentSoft` avec filet gauche `accent` — touche éditoriale.
- **Screen** : fond `background` crème ; en-têtes de section en serif.
- **Chips / tags** : `accentSoft`, texte `accent`, rayon `full`.

### Onboarding-questionnaire assorti
Cartes chaleureuses, **titre-question en serif**, copie amicale et humaine (pas de jargon growth). Une
image d'ambiance possible en tête. Ton accueillant, comme une invitation. Progression douce.

### Paywall assorti
Éditorial : titre serif fort, un **témoignage / preuve sociale** courte, bénéfices en liste aérée, CTA
terracotta `full`. Prix réel StoreKit, **Restaurer** + liens légaux. On vend par l'histoire et l'usage,
pas par la peur.

---

## Garde-fous (à relire avant de livrer un écran)

- **Un seul accent.** Si un deuxième vif apparaît « pour faire joli », on le retire.
- **Zéro couleur en dur** dans les composants : tout passe par `useTheme()` / les tokens.
- **Un seul rayon, une seule échelle d'espacement, une seule famille typo** dans toute l'app.
- **Clair ET sombre testés** — un token sombre oublié = tache noire/blanche = look cassé.
- **Pas d'emoji décoratif** dans l'UI de production (ni dans l'onboarding). Des icônes cohérentes, oui.
- **Le paywall et l'onboarding suivent le kit** — jamais un écran de vente « template » collé qui jure
  avec le reste. C'est là que le vibe-codé se voit le plus.
- **Aperçu avant de conclure** : `tsc --noEmit` vert, puis montrer l'écran. Un kit ne « rend » vraiment
  que sur l'appareil — proposer `/preview` pour valider sur iPhone.

> Un kit bien appliqué, c'est ce qui fait dire « attends, t'as codé ça ?! ». Un kit ignoré, c'est la
> première chose qu'un acheteur reproche. **Le look n'est pas de la déco — c'est la crédibilité.**
