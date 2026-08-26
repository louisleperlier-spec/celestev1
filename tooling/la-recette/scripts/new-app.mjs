#!/usr/bin/env node
// La Recette — new-app
// -----------------------------------------------------------------------------
// Bootstrap un nouveau dossier d'app (structure de base + fichiers de suivi).
//
// Usage :
//   node scripts/new-app.mjs "Mon Idée d'App" [--parent <dossier>] [--force]
//
// Où est créée l'app ?
//   RÈGLE : chaque app vit dans SON PROPRE dossier séparé, JAMAIS à l'intérieur de la-recette
//   (la-recette = l'outil ; l'app = un projet à part, comme des dossiers frères sur le Bureau).
//   - --parent <dossier>  : dossier parent explicite (prioritaire).
//   - sinon $RECETTE_APPS_DIR (dossier où ranger toutes les apps),
//   - sinon le dossier PARENT du dossier ouvert dans Claude Code ($CLAUDE_PROJECT_DIR) →
//     l'app devient « sœur » de la-recette (à côté, pas dedans).
//   - sinon le dossier PARENT du repo la-recette.
//   Le dossier créé = <parent>/<slug>.
//
// Cross-platform : Node pur, zéro dépendance, zéro bash-isme.
// -----------------------------------------------------------------------------

import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..'); // scripts/ -> racine la-recette

// ---- Arguments ---------------------------------------------------------------

function argValue(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}
const force = process.argv.includes('--force');

// Nom = premier argument qui n'est ni une option ni la valeur d'une option.
function readName() {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--parent') { i++; continue; }
    if (a.startsWith('--')) continue;
    return a;
  }
  return null;
}

const displayName = readName();
if (!displayName) {
  console.error('Donne un nom : node scripts/new-app.mjs "Mon idée d\'app"');
  process.exit(1);
}

function slugify(s) {
  return s
    .normalize('NFD').replace(/\p{Diacritic}/gu, '') // enlève les accents
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'mon-app';
}

const slug = slugify(displayName);

function resolveParent() {
  const explicit = argValue('--parent');
  if (explicit) return path.resolve(explicit);
  if (process.env.RECETTE_APPS_DIR) return path.resolve(process.env.RECETTE_APPS_DIR);
  // À CÔTÉ du dossier ouvert (la-recette), jamais DEDANS → l'app est un dossier séparé, frère de la-recette.
  if (process.env.CLAUDE_PROJECT_DIR) return path.dirname(path.resolve(process.env.CLAUDE_PROJECT_DIR));
  return path.dirname(PROJECT_ROOT); // sœur de la-recette
}

const parent = resolveParent();
const appDir = path.join(parent, slug);

// ---- Garde-fou : ne pas écraser un dossier non vide --------------------------

if (existsSync(appDir)) {
  const entries = readdirSync(appDir);
  if (entries.length > 0 && !force) {
    console.error(
      `Le dossier « ${appDir} » existe déjà et n'est pas vide.\n` +
      `Choisis un autre nom, ou relance avec --force si tu veux écrire par-dessus.`
    );
    process.exit(1);
  }
}

// ---- Contenu des fichiers ----------------------------------------------------

const today = new Date().toISOString().slice(0, 10);
const bundleId = `com.example.${slug.replace(/-/g, '')}`;

const files = {
  '.recette/config.json': JSON.stringify({
    name: displayName,
    slug,
    bundleId,
    createdAt: today,
    builtWith: 'la-recette',
    status: 'spec', // spec -> building -> ready -> submitted
  }, null, 2) + '\n',

  '.recette/secrets.env': `# ============================================================================
# SECRETS DE « ${displayName} »  —  NE JAMAIS COMMITTER CE FICHIER
# (il est déjà dans .gitignore ; le hook secret-scan bloque tout push accidentel)
# Colle ici les tokens ramassés par /setup. Vérifie-les avec :
#   node <la-recette>/scripts/verify-secrets.mjs
# ============================================================================

# --- GitHub (héberge le code) ---
GITHUB_TOKEN=

# --- Supabase (backend : base de données, auth) ---
SUPABASE_ACCESS_TOKEN=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
# Clé publique (OK dans l'app) :
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# --- Vercel (héberge la landing page) ---
VERCEL_TOKEN=

# --- Expo / EAS (build de l'app iOS dans le cloud) ---
EXPO_TOKEN=

# --- RevenueCat (abonnements / paywall) — utilise la clé SECRÈTE v2 ---
REVENUECAT_SECRET_KEY=

# --- OpenAI (si l'app utilise de l'IA) ---
OPENAI_API_KEY=

# --- App Store Connect (soumission Apple) — optionnel ---
# Clé API App Store Connect (.p8) : rend le 1er build EAS NON-INTERACTIF (pas de 2FA au terminal).
APPLE_ASC_KEY_ID=
APPLE_ASC_ISSUER_ID=
APPLE_ASC_PRIVATE_KEY_PATH=
# Login Apple non-interactif pour EAS (éteint le prompt 2FA au build) :
# mot de passe d'app généré sur appleid.apple.com → "Mots de passe des apps".
EXPO_APPLE_ID=
EXPO_APPLE_APP_SPECIFIC_PASSWORD=
`,

  '.gitignore': `# --- Secrets (VITAL : ne jamais versionner) ---
.recette/secrets.env
.env
.env.*
!.env.example
*.p8
*.p12
*.mobileprovision
*.keystore

# --- Dépendances / build ---
node_modules/
.expo/
dist/
web-build/
ios/Pods/
ios/build/
android/build/
android/app/build/
*.log

# --- OS ---
.DS_Store
Thumbs.db
`,

  'APP-SPEC.md': `# APP-SPEC — ${displayName}

> ⛔ GATE 1 : Claude ne code RIEN tant que cette spec n'est pas complète.
> Remplie par Claude (chef de produit) avec l'utilisateur. Tout \`TODO\` = trou à combler.

## 1. L'idée en une phrase
TODO

## 2. Pour qui ? (utilisateur cible + le problème résolu)
TODO

## 3. Fonctionnalités du MVP (le strict nécessaire pour la v1)
- TODO

## 4. Ce qu'on NE fait PAS en v1 (pour rester focus)
- TODO

## 5. Modèle économique
- [ ] Gratuit
- [ ] Freemium / abonnement (paywall RevenueCat)
- Prix envisagé : TODO

## 6. Données stockées (⇒ App Privacy label + politique de confidentialité)
- TODO

## 7. Écrans (parcours utilisateur)
- Onboarding → TODO
- Écran principal → TODO

## 8. Design
- Style : TODO (monochrome + 1 accent)
- Nom affiché : ${displayName}
- Bundle ID (provisoire) : ${bundleId}

## 9. Risques de rejet Apple à anticiper (voir Definition-of-Done)
- [ ] Contenu généré par IA → consentement nommant le prestataire (5.1.2)
- [ ] Suppression de compte in-app si création de compte (5.1.1v)
- [ ] Sign in with Apple si login tiers (4.8)
- [ ] Contenu UGC → modération + signaler + bloquer (1.2)
- Autres : TODO

## 10. Langues
- [ ] FR   - [ ] EN   (i18n complet, aucune chaîne en dur)
`,

  'PROGRESS.md': `# PROGRESS — ${displayName}

> Journal de construction, tenu par l'agent app-builder. Reprenable : à chaque
> reprise, on lit ce fichier pour savoir où on en est. \`[x]\` = fait & vérifié.

Créé le : ${today}
Statut global : \`spec\` (en attente de GATE 1 : APP-SPEC complet)

## Phases

### Cadrage (GATE 1 — fait dans /new, AVANT /build)
- [x] Dossier d'app initialisé par la-recette
- [ ] APP-SPEC.md complété et validé (GATE 1)

### 0. Infra (comptes cloud — provisionnée UNE fois, JAMAIS re-provisionnée à la reprise)
> ⚠️ **Idempotence critique.** Avant de créer quoi que ce soit ici, **relis cette section** : si un
> identifiant est déjà rempli, la ressource **existe déjà** → on la **réutilise**, on ne la recrée pas.
> **Supabase = 2 projets max** sur le plan gratuit ; recréer un projet = plafond atteint (panne C).
- [ ] Repo GitHub privé — nom : \`________________\`
- [ ] Projet Supabase (créé ou réutilisé) — project-ref : \`________________\`
- [ ] Projet Vercel (pour la landing) — nom/slug : \`________________\`

### 1. Scaffold (app Expo)
- [ ] Projet Expo (SDK épinglé) qui boote en Expo Go
- [ ] Navigation + thème clair/sombre + i18n FR/EN
- [ ] typecheck (\`tsc --noEmit\`) + bundle (\`expo export --platform ios\`) verts

### 2. Backend (Supabase)
- [ ] Auth email + RLS
- [ ] Migrations appliquées
- [ ] Edge function proxy (aucune clé tierce dans le bundle)

### 3. Features / Cœur métier (le « moment magique »)
- [ ] Archétype choisi + cloné depuis templates/archetypes/ puis adapté à la spec
- [ ] i18n FR + EN, RLS partout, zéro chaîne/couleur en dur
- [ ] Smoke-test runtime coché en /preview (boote → parcours → la donnée persiste)

### 4. Paywall (RevenueCat)
- [ ] Entitlement + offering + paywall (prix/durée/renouvellement + liens légaux)
- [ ] Bouton « Restaurer les achats »
- [ ] Webhook → is_premium (vérité serveur)

### 5. Landing + légal (Next.js/Vercel)
- [ ] Landing SEO/GEO déployée (HTTPS)
- [ ] Politique de confidentialité + Conditions (nommant les tiers)

### 6. Assets
- [ ] Icône + splash
- [ ] Screenshots App Store localisés

### 7. Audit (Definition-of-Done)
- [ ] Agent auditor lancé — 0 ⛔ et 0 ⚠️ (GATE 2a)

### 8. Handoff
- [ ] Liste des seuls clics Apple restants remise à l'utilisateur (GATE 2b)

## Notes / décisions
- (rien pour l'instant)
`,

  'README.md': `# ${displayName}

App iOS construite avec **La Recette** 🍜.

- Spec produit : \`APP-SPEC.md\`
- Avancement : \`PROGRESS.md\`
- Config : \`.recette/config.json\`
- Secrets (jamais versionnés) : \`.recette/secrets.env\`

> Ce dossier est piloté par Claude Code. Décris ce que tu veux — La Recette fait le reste.
`,
};

// ---- Écriture ----------------------------------------------------------------

mkdirSync(path.join(appDir, '.recette'), { recursive: true });
for (const [rel, content] of Object.entries(files)) {
  const abs = path.join(appDir, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, content, 'utf8');
}

// ---- Résumé pour le débutant -------------------------------------------------

console.log(`
  ✅ Nouvelle app créée : ${displayName}
     Dossier : ${appDir}

  Ce qu'on vient de mettre en place :
     • APP-SPEC.md   — la fiche produit (à remplir ensemble avant de coder)
     • PROGRESS.md   — le suivi de construction (reprenable à tout moment)
     • .recette/     — config + coffre à secrets (déjà ignoré par Git)
     • .gitignore    — protège tes secrets d'un push accidentel

  Prochaine étape : on définit ton app ensemble (GATE 1).
  Dis-moi en une phrase ce que ton app doit faire, et je m'occupe du reste.
`);

// Sortie machine (utile si Claude veut chaîner) sur stderr pour ne pas polluer.
console.error(JSON.stringify({ appDir, slug, name: displayName, bundleId }));
