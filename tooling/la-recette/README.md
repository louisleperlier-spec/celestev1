# La Recette 🍜

**Un dossier Claude Code qui construit ton app iOS complète, de A à Z, sans coder.**
Tu le **dézippes**, tu **l'ouvres avec Claude Code**, tu **expliques ton idée** — La Recette fait le reste :
l'app + le backend + le paywall + la landing (SEO/GEO) + la préparation App Store. Puis elle **maintient**
ton app à vie (bugs, mises à jour, rejets Apple).

Cible : **débutants totaux** (vibe-coders). Fonctionne sur **Mac et Windows** (pas besoin de Mac —
les builds iOS passent par le cloud EAS). Prérequis : un ordi, un **iPhone**, un **compte Apple (99$/an)**.

> 🚀 **Nouveau client ? Commence ici → [GETTING-STARTED.md](GETTING-STARTED.md)** — dézippe, ouvre Claude Code dans le dossier, écris ton idée : ~5 min (la seule partie « technique », une fois).

---

## Le deal (à être honnête dès le départ)

- **Auto de A à Z jusqu'à "prêt à soumettre"** : app fonctionnelle + backend + paywall + landing + blog + assets.
- **Manuel guidé** : les clics Apple (2FA, "Submit") — Apple ne laisse pas automatiser ça. Claude tient la main écran par écran.
- Apple **peut rejeter** une app. Claude prévient des risques **avant** de construire.

## Les 2 boutons

```
/setup  ──►  ramasse + vérifie TOUS les secrets une seule fois
                (GitHub · Supabase free · Vercel · Expo/EAS · RevenueCat · OpenAI · Apple)
                          │  tableau vert = prêt
                          ▼
/new    ──►  idée → Claude joue le chef de produit (propose features, flag le rejetable)
             ⛔ GATE 1 : ne code pas tant que l'APP-SPEC n'est pas COMPLET
                          ▼
/build  ──►  LOOP FULL-AUTO, A→Z, reprenable (PROGRESS.md), zéro babysitting
             ⛔ GATE 2a : audit Definition-of-Done 100% vert côté CODE (sans Apple)
                          ▼
/app-store ► HANDOFF guidé : build EAS + TestFlight + fiche App Store Connect
             ⛔ GATE 2b : validé pour soumission (build réel, abo, compte démo testés)
```

## Les commandes (l'utilisateur n'a PAS à les mémoriser — il décrit, Claude route)

| Commande | Rôle |
|---|---|
| `/setup` | Branche + vérifie tous les comptes (le point critique) |
| `/new` | Idée → APP-SPEC verrouillé |
| `/build` | Build full-auto A→Z (app fonctionnelle complète) |
| `/preview` | Teste sur ton iPhone (Expo Go : lien `exp://` + QR déposé dans le dossier) |
| `/ui` | Choisir/appliquer un kit design (looks curés) |
| `/blog "sujet"` | 1 article MDX bilingue SEO/GEO + commit + deploy |
| `/seo` | Audit + fix SEO/GEO d'une page |
| `/deploy` | git + Vercel + Supabase (migrations + edge fn) en une passe |
| `/app-store` | Soumission App Store, écran par écran |
| `/fix` | "Mon app plante quand…" → Claude corrige + redéploie |
| `/update` | Nouvelle version au store |
| `/rejected` | Colle le rejet Apple → Claude corrige |
| `/doctor` | Diagnostique + répare une panne |
| `/status` | Où j'en suis dans la recette |

## Les 3 couches (le vrai squelette — le produit = le chemin qui foire)

1. **Constitution** — comment Claude se comporte face à un débutant (fait tout lui-même, zéro jargon,
   jamais de stacktrace, jamais de cul-de-sac). → `.claude/skills/recette-core`
2. **Routeur d'intention** — l'utilisateur décrit en langage flou, Claude route vers la bonne action. → `.claude/skills/recette-core`
3. **Doctor** — base de pannes (issue de vrais lancements) symptôme→diagnostic→fix + auto-réparation + journal
   qui s'enrichit à chaque client. → `.claude/skills/doctor`

## Structure du repo

```
la-recette/                     ← dézippe ce dossier, ouvre-le avec Claude Code
├─ CLAUDE.md                    ✅ bootstrap — chargé automatiquement, démarre le mode La Recette
├─ .claude/
│  ├─ settings.json             ✅ hook secret-scan (project hook PreToolUse)
│  ├─ skills/
│  │  ├─ recette-core/          ✅ constitution + routeur d'intention
│  │  ├─ definition-of-done/    ✅ complétude en 2 portes (GATE 2a/2b) + rejets Apple
│  │  ├─ doctor/                ✅ base de pannes + journal + auto-réparation
│  │  ├─ app-core-patterns/     ✅ cœur métier depuis des archétypes
│  │  ├─ expo-ios-app/          ✅ scaffold Expo (éprouvé en production)
│  │  ├─ supabase-backend/      ✅ auth + RLS + edge functions
│  │  ├─ revenuecat-subscriptions/ ✅ paywall + IAP + vérité serveur
│  │  ├─ nextjs-landing/        ✅ landing + légal + socle SEO/GEO
│  │  ├─ app-store-launch/      ✅ soumission App Store, écran par écran
│  │  ├─ app-onboarding/        ✅ questionnaire d'onboarding
│  │  ├─ ui-kits/               ✅ 3 looks curés (clair/sombre + onboarding + paywall)
│  │  ├─ design-taste-frontend/ ✅ landing anti-slop premium (Taste Skill, MIT © Leonxlnx)
│  │  ├─ seo-geo/               ✅ AnswerBlock + FAQ schema + mesure Core Web Vitals
│  │  ├─ auto-blog/             ✅ /blog bilingue en 1 commande
│  │  ├─ faq-glossaire/         ✅ réponses officielles (prix/remboursement…) + glossaire
│  │  ├─ assets/                ✅ icône/splash/screenshots (generate-assets.mjs)
│  │  └─ + skills officiels Expo (bundlés, MIT) : expo-router · expo-project-structure ·
│  │                                 expo-dev-client · expo-native-ui · expo-ui · expo-data-fetching ·
│  │                                 expo-module · expo-upgrade · expo-examples · eas-workflows ·
│  │                                 eas-app-stores (cf. EXPO-SKILLS-NOTICE.md)
│  ├─ commands/                 ✅ setup, new, build, preview, deploy, blog, seo, ui, app-store,
│  │                                 fix, update, rejected, doctor, status, recette
│  └─ agents/                   ✅ app-builder, auditor (audit App Store adversarial)
├─ templates/                   ✅ archetypes/ (list-crud · ai-feed · tracker-streak · timer-session
│                                    · quiz-reco · realtime-chat · browse-catalog) — 7 modèles
├─ scripts/                     ✅ Node/.mjs (cross-platform) : new-app · verify-secrets ·
│                                    generate-assets · secret-scan (garde-fou tokens — VITAL)
├─ GETTING-STARTED.md           ✅ les 5 premières minutes (flux dézip → ouvre → parle)
└─ .claude-plugin/plugin.json   ✅ manifeste (inerte en mode dossier ; conservé, ne pas supprimer)
```

## Crédits & licences tierces

La Recette embarque des skills open-source (licence **MIT**), inclus verbatim avec leur `LICENSE` et
leur attribution — ne pas retirer ces fichiers (obligation MIT) :

- **`.claude/skills/design-taste-frontend/`** — « Taste Skill » (framework frontend anti-slop) — © 2026 Leonxlnx —
  https://github.com/Leonxlnx/taste-skill · https://www.tasteskill.dev/
- **`.claude/skills/app-onboarding/`** — questionnaire d'onboarding — © 2026 Adam Lyttle
- **Skills officiels Expo** (11 skills bundlés : `expo-project-structure`, `expo-router`, `expo-dev-client`,
  `expo-native-ui`, `expo-ui`, `expo-data-fetching`, `expo-upgrade`, `expo-module`, `expo-examples`,
  `eas-workflows`, `eas-app-stores`) — © 2025-present 650 Industries, Inc. (aka Expo) —
  https://github.com/expo/skills · chacun avec son `LICENSE`, récap dans
  `.claude/skills/EXPO-SKILLS-NOTICE.md`
