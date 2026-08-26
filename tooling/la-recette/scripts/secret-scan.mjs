#!/usr/bin/env node
// La Recette — Hook secret-scan (PreToolUse)
// -----------------------------------------------------------------------------
// BUT : empêcher un débutant de committer/pusher un secret par accident.
//
// Comment un hook Claude Code marche (résumé) :
//   - Ce script reçoit sur STDIN un JSON décrivant l'appel d'outil intercepté.
//     Champs utiles : tool_name, tool_input.command (la commande shell/PowerShell),
//     cwd (dossier courant).
//   - Pour BLOQUER l'action, on écrit sur STDOUT (exit 0) un JSON de décision :
//       { "hookSpecificOutput": {
//           "hookEventName": "PreToolUse",
//           "permissionDecision": "deny",
//           "permissionDecisionReason": "<message clair>" } }
//     Claude lit `permissionDecisionReason` et l'explique à l'humain.
//   - Pour LAISSER PASSER : exit 0 sans rien écrire (aucune décision => flux normal).
//   - En cas de bug interne du scanner : on LAISSE PASSER (fail-open) — un garde-fou
//     cassé ne doit jamais bloquer quelqu'un dans un cul-de-sac (Constitution §4).
//     Seule une VRAIE détection bloque.
//
// FAIL-OPEN quand Node est ABSENT (machine vierge, avant /setup) :
//   Ce script est du Node — il ne peut évidemment pas s'exécuter si Node n'est pas
//   encore installé. Le hook (.claude/settings.json) lance donc la commande sous la forme
//   `node "$CLAUDE_PROJECT_DIR/scripts/secret-scan.mjs" || exit 0` : si `node` est
//   introuvable, le shell renvoie
//   un code non nul, `|| exit 0` reprend la main, et le hook se termine proprement en
//   AUTORISANT l'action (exit 0, aucune erreur affichée au débutant). Conséquence
//   voulue : tant que Node n'est pas là, les commandes d'install (winget/brew) et
//   autres commandes shell ne sont PAS bloquées par un hook qui ne peut pas démarrer.
//   Le scan complet de secrets s'active automatiquement dès que Node est présent
//   (c'est-à-dire après le pré-vol machine de /recette · /setup).
//
// Cross-platform : Node pur (aucune dépendance, aucun bash-isme). Marche Mac + Windows.
// -----------------------------------------------------------------------------

import { spawnSync } from 'node:child_process';
import { readFileSync, statSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const MAX_FILE_BYTES = 400 * 1024;   // on ne scanne pas les gros fichiers/binaires
const MAX_FILES = 500;               // borne de sécurité (perf)
const MAX_FINDINGS_SHOWN = 25;

const SKIP_DIR = new Set([
  'node_modules', '.git', 'Pods', '.expo', 'dist', 'build', '.next',
  'coverage', '.turbo', '.vercel', 'DerivedData', '.gradle',
]);
const SKIP_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.icns', '.pdf',
  '.zip', '.gz', '.tgz', '.mp4', '.mov', '.mp3', '.woff', '.woff2',
  '.ttf', '.otf', '.keystore', '.jks', '.mobileprovision', '.p12',
  '.lock', // package-lock/yarn : bruyant, sans secret utile
]);

// ---- Détecteurs de secrets ---------------------------------------------------
// Chaque détecteur : { id, label, severity, test(line) -> [valeurs brutes] }
// severity: 'block' (⛔) toujours bloquant.

const PLACEHOLDERS = [
  'your', 'example', 'exemple', 'changeme', 'change-me', 'placeholder',
  'dummy', 'redacted', 'xxxx', 'process.env', '${', '<', 'undefined',
  'null', 'sample', 'todo', 'fixme', 'replace', 'votre', 'ici', 'aaaa',
];

function looksPlaceholder(v) {
  const low = v.toLowerCase();
  if (PLACEHOLDERS.some((p) => low.includes(p))) return true;
  if (/^(.)\1+$/.test(v)) return true;        // 'aaaaaa', '000000'
  if (/^[x*.\-_]+$/i.test(v)) return true;    // 'xxxxxx', '******'
  return false;
}

// Variables PUBLIQUES par design : leur valeur est DESTINÉE au bundle client, ce n'est
// pas un secret. On NE déclenche PAS les détecteurs génériques sur ces lignes (sinon la
// clé anon Supabase, qui est un JWT `eyJ…` role=anon, pourrait faire un faux positif
// bloquant et coincer un débutant). ⚠️ La protection DURE reste active : la vérif
// EXPO_PUBLIC_HARD tourne quand même sur ces lignes, donc si un VRAI secret dur
// (clé service_role, sk-…, token GitHub…) y était collé par erreur, il serait bloqué.
const PUBLIC_BY_DESIGN_VARS = [
  'EXPO_PUBLIC_SUPABASE_ANON_KEY', // clé anon Supabase — publique par design
];

function isPublicByDesignAssignment(line) {
  return PUBLIC_BY_DESIGN_VARS.some((name) =>
    new RegExp(`(?:^|[^A-Za-z0-9_])${name}\\s*[:=]`).test(line)
  );
}

function matchAll(line, re) {
  const out = [];
  let m;
  const rx = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  while ((m = rx.exec(line)) !== null) out.push(m[0]);
  return out;
}

// JWT Supabase : on ne bloque QUE le service_role (l'anon key est publique par design).
function serviceRoleJwts(line) {
  const out = [];
  const rx = /eyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}/g;
  let m;
  while ((m = rx.exec(line)) !== null) {
    const jwt = m[0];
    try {
      const payload = jwt.split('.')[1];
      const json = Buffer.from(
        payload.replace(/-/g, '+').replace(/_/g, '/'),
        'base64'
      ).toString('utf8');
      const obj = JSON.parse(json);
      if (obj && obj.role === 'service_role') out.push(jwt);
    } catch { /* pas un JWT lisible -> on ignore (évite les faux positifs) */ }
  }
  return out;
}

const DETECTORS = [
  {
    id: 'openai', label: 'Clé OpenAI (sk-...)', provider: 'openai',
    test: (l) => matchAll(l, /\bsk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{20,}\b/),
  },
  {
    id: 'anthropic', label: 'Clé Anthropic (sk-ant-...)', provider: 'anthropic',
    test: (l) => matchAll(l, /\bsk-ant-[A-Za-z0-9_-]{20,}\b/),
  },
  {
    id: 'github', label: 'Token GitHub', provider: 'github',
    test: (l) => [
      ...matchAll(l, /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/),
      ...matchAll(l, /\bgithub_pat_[A-Za-z0-9_]{30,}\b/),
    ],
  },
  {
    id: 'supabase_pat', label: 'Token Supabase (sbp_ / sb_secret_)', provider: 'supabase',
    test: (l) => [
      ...matchAll(l, /\bsbp_[A-Za-z0-9]{40,}\b/),
      ...matchAll(l, /\bsb_secret_[A-Za-z0-9]{20,}\b/),
    ],
  },
  {
    id: 'supabase_service_role', label: 'Clé Supabase service_role (JWT admin)', provider: 'supabase',
    test: serviceRoleJwts,
  },
  {
    id: 'aws', label: 'Clé AWS (AKIA...)', provider: 'aws',
    test: (l) => matchAll(l, /\bAKIA[0-9A-Z]{16}\b/),
  },
  {
    id: 'stripe', label: 'Clé Stripe live (sk_live/rk_live)', provider: 'stripe',
    test: (l) => matchAll(l, /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/),
  },
  {
    id: 'revenuecat', label: 'Clé secrète RevenueCat (sk_...)', provider: 'revenuecat',
    test: (l) => matchAll(l, /\bsk_[A-Za-z0-9]{24,}\b/),
  },
  {
    id: 'slack', label: 'Token Slack (xox...)', provider: 'slack',
    test: (l) => matchAll(l, /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/),
  },
  {
    id: 'private_key', label: 'Clé privée (PEM / SSH)', provider: 'generic',
    test: (l) => matchAll(l, /-----BEGIN(?: RSA| EC| OPENSSH| DSA| PGP)? PRIVATE KEY-----/),
  },
  {
    // Fallback pour les tokens SANS préfixe fixe (Vercel, Expo/EAS, mots de passe DB...) :
    // toute affectation NOM_QUI_SONNE_SECRET = valeur non-placeholder d'au moins 12 chars.
    id: 'generic_assignment', label: 'Secret dans une variable (TOKEN/SECRET/PASSWORD...)', provider: 'generic',
    test: (l) => {
      const rx = /(?:^|[^A-Za-z0-9_])([A-Z0-9_]*(?:SECRET|_TOKEN|TOKEN|PASSWORD|PRIVATE_KEY|API_KEY|ACCESS_KEY|SERVICE_ROLE)[A-Z0-9_]*)\s*[:=]\s*["']?([^"'\s#]{12,})["']?/g;
      const out = [];
      let m;
      while ((m = rx.exec(l)) !== null) {
        const val = m[2];
        if (!looksPlaceholder(val)) out.push(val);
      }
      return out;
    },
  },
];

// Secrets « durs » qui NE doivent JAMAIS être en EXPO_PUBLIC_ (ils finissent dans le bundle).
// (On ne flague pas la ANON key Supabase ni une clé web Firebase AIza : publiques par design.)
const EXPO_PUBLIC_HARD = [
  /\bsk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{20,}\b/,
  /\bsk-ant-[A-Za-z0-9_-]{20,}\b/,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
  /\bsbp_[A-Za-z0-9]{40,}\b/,
  /\bsb_secret_[A-Za-z0-9]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/,
];

// ---- Liens de rotation (si un secret a fuité, il faut le régénérer) ----------
const ROTATE = {
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
  github: 'https://github.com/settings/tokens',
  supabase: 'https://supabase.com/dashboard/account/tokens',
  vercel: 'https://vercel.com/account/tokens',
  expo: 'https://expo.dev/settings/access-tokens',
  revenuecat: 'https://app.revenuecat.com/ (ton projet → Project settings → API keys)',
  aws: 'https://console.aws.amazon.com/iam/home#/security_credentials',
  stripe: 'https://dashboard.stripe.com/apikeys',
  slack: 'https://api.slack.com/apps',
  generic: null,
};

// ---- Utilitaires Git ---------------------------------------------------------

function git(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
  return {
    ok: r.status === 0,
    code: r.status,
    out: (r.stdout || '').trim(),
    err: (r.stderr || '').trim(),
    failed: r.error != null,
  };
}

function isRepo(cwd) {
  const r = git(cwd, ['rev-parse', '--is-inside-work-tree']);
  return r.ok && r.out === 'true';
}

function repoRoot(cwd) {
  const r = git(cwd, ['rev-parse', '--show-toplevel']);
  return r.ok ? r.out : cwd;
}

// ---- Analyse de la commande interceptée --------------------------------------

// Découpe une ligne shell en segments (séparés par ; && || | et sauts de ligne).
function segments(cmd) {
  return cmd.split(/\r?\n|&&|\|\||;|\|/).map((s) => s.trim()).filter(Boolean);
}

// Tokenizer minimal respectant les guillemets simples/doubles.
function tokenize(seg) {
  const toks = [];
  const rx = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = rx.exec(seg)) !== null) {
    toks.push(m[1] ?? m[2] ?? m[3]);
  }
  return toks;
}

const OPTS_WITH_VALUE = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace']);

// Renvoie la liste des opérations git write détectées : [{ sub, paths }]
function detectGitOps(cmd) {
  const ops = [];
  for (const seg of segments(cmd)) {
    const toks = tokenize(seg);
    const gi = toks.findIndex((t) => t === 'git' || t.endsWith('/git') || t.endsWith('\\git') || t === 'git.exe');
    if (gi === -1) continue;

    // Trouver le sous-commande (1er token non-option après `git`).
    let i = gi + 1;
    let sub = null;
    while (i < toks.length) {
      const t = toks[i];
      if (t.startsWith('-')) {
        if (OPTS_WITH_VALUE.has(t)) i += 2; else i += 1;
        continue;
      }
      sub = t;
      break;
    }
    if (!sub || !['add', 'commit', 'push'].includes(sub)) continue;

    const rest = toks.slice(i + 1).filter((t) => t !== undefined);
    const paths = rest.filter((t) => !t.startsWith('-'));
    const flags = rest.filter((t) => t.startsWith('-'));
    ops.push({ sub, paths, flags });
  }
  return ops;
}

// ---- Collecte des fichiers candidats à scanner -------------------------------

function porcelainChanged(cwd) {
  // fichiers modifiés + non suivis (ce que `git add .` ramasserait), hors suppressions
  const r = git(cwd, ['status', '--porcelain', '--untracked-files=all']);
  if (!r.ok) return [];
  const files = [];
  for (const line of r.out.split(/\r?\n/)) {
    if (!line) continue;
    const status = line.slice(0, 2);
    let p = line.slice(3);
    if (status.includes('D')) continue;           // suppression : rien à scanner
    if (p.includes(' -> ')) p = p.split(' -> ')[1]; // renommage
    files.push(p.replace(/^"|"$/g, ''));
  }
  return files;
}

function stagedFiles(cwd) {
  const r = git(cwd, ['diff', '--cached', '--name-only', '--diff-filter=ACM']);
  return r.ok && r.out ? r.out.split(/\r?\n/).filter(Boolean) : [];
}

function modifiedTracked(cwd) {
  const r = git(cwd, ['ls-files', '-m']);
  return r.ok && r.out ? r.out.split(/\r?\n/).filter(Boolean) : [];
}

function pushRangeFiles(cwd) {
  const up = git(cwd, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  if (up.ok && up.out) {
    const d = git(cwd, ['diff', '--name-only', `${up.out}..HEAD`]);
    if (d.ok) return { files: d.out ? d.out.split(/\r?\n/).filter(Boolean) : [], known: true };
  }
  // Pas d'upstream connu : on retombe sur les fichiers suivis (borné plus bas).
  const all = git(cwd, ['ls-files']);
  return { files: all.ok && all.out ? all.out.split(/\r?\n/).filter(Boolean) : [], known: false };
}

function walkDir(abs, root, acc) {
  let entries;
  try { entries = readdirSync(abs, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (acc.length >= MAX_FILES) return;
    if (SKIP_DIR.has(e.name)) continue;
    const full = path.join(abs, e.name);
    if (e.isDirectory()) walkDir(full, root, acc);
    else if (e.isFile()) acc.push(path.relative(root, full).split(path.sep).join('/'));
  }
}

function expandPaths(cwd, root, paths) {
  const acc = [];
  for (const p of paths) {
    if (p === '.' || p === '-A' || p === '--all' || p === '-u' || p === '--update' || p === '*') {
      for (const f of porcelainChanged(cwd)) acc.push(f);
      continue;
    }
    const abs = path.isAbsolute(p) ? p : path.join(cwd, p);
    try {
      const st = statSync(abs);
      if (st.isDirectory()) walkDir(abs, root, acc);
      else acc.push(path.relative(root, abs).split(path.sep).join('/'));
    } catch { /* chemin inexistant / glob non résolu : ignoré */ }
  }
  return acc;
}

function collectCandidates(cwd, root, ops) {
  const set = new Set();
  const wantsEnvCheck = new Set(); // fichiers .env à contrôler côté .gitignore

  for (const op of ops) {
    if (op.sub === 'add') {
      // Le hook tourne AVANT le `git add` -> rien n'est encore stagé.
      // On scanne donc ce qui SERAIT ajouté.
      const targets = op.paths.length ? op.paths : ['.'];
      for (const f of expandPaths(cwd, root, targets)) set.add(f);
    } else if (op.sub === 'commit') {
      for (const f of stagedFiles(cwd)) set.add(f);
      if (op.flags.some((f) => f === '-a' || f === '--all' || /^-[a-zA-Z]*a/.test(f))) {
        for (const f of modifiedTracked(cwd)) set.add(f);
      }
    } else if (op.sub === 'push') {
      const { files } = pushRangeFiles(cwd);
      for (const f of files) set.add(f);
    }
  }

  // Fichiers .env candidats -> vérifier s'ils sont ignorés
  for (const f of set) {
    const base = path.basename(f);
    if (/^\.env(\..+)?$/.test(base) && !/\.(example|sample|template)$/.test(base)) {
      wantsEnvCheck.add(f);
    }
  }
  return { files: [...set].slice(0, MAX_FILES), envFiles: [...wantsEnvCheck] };
}

// ---- Lecture + scan d'un fichier ---------------------------------------------

function shouldSkip(rel) {
  const parts = rel.split('/');
  if (parts.some((p) => SKIP_DIR.has(p))) return true;
  const ext = path.extname(rel).toLowerCase();
  if (SKIP_EXT.has(ext)) return true;
  const base = path.basename(rel).toLowerCase();
  if (base === 'package-lock.json' || base === 'yarn.lock' || base === 'pnpm-lock.yaml') return true;
  return false;
}

function mask(v) {
  if (v.length <= 10) return v[0] + '***';
  return v.slice(0, 4) + '…' + v.slice(-3);
}

function scanFile(root, rel, findings) {
  if (shouldSkip(rel)) return;
  const abs = path.join(root, rel);
  let st;
  try { st = statSync(abs); } catch { return; }
  if (!st.isFile() || st.size > MAX_FILE_BYTES) return;

  let buf;
  try { buf = readFileSync(abs); } catch { return; }
  if (buf.includes(0)) return; // binaire
  const text = buf.toString('utf8');
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Ligne assignant une variable publique par design (ex. clé anon Supabase) :
    // on saute les détecteurs génériques (évite un faux positif), mais on garde la
    // vérif EXPO_PUBLIC_HARD ci-dessous (qui, elle, bloque un vrai secret dur).
    const publicByDesign = isPublicByDesignAssignment(line);

    if (!publicByDesign) {
      for (const det of DETECTORS) {
        let hits;
        try { hits = det.test(line); } catch { hits = []; }
        for (const raw of hits) {
          findings.push({
            file: rel, line: i + 1, type: det.label,
            provider: det.provider, value: mask(String(raw)),
          });
        }
      }
    }

    // EXPO_PUBLIC_ contenant un secret dur => fuite garantie dans le bundle
    if (/EXPO_PUBLIC_[A-Z0-9_]+/.test(line)) {
      for (const rx of EXPO_PUBLIC_HARD) {
        const hit = line.match(rx);
        if (hit) {
          findings.push({
            file: rel, line: i + 1,
            type: 'Secret exposé en EXPO_PUBLIC_ (finit dans le bundle iOS !)',
            provider: 'generic', value: mask(hit[0]),
          });
        }
      }
    }
  }
}

// ---- Construction du message de blocage --------------------------------------

function buildReason(findings, unignoredEnv, root) {
  const uniq = [];
  const seen = new Set();
  for (const f of findings) {
    const k = `${f.file}|${f.type}|${f.value}`;
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(f);
  }

  const lines = [];
  lines.push('🛑 STOP — j\'ai bloqué cette commande Git avant qu\'elle ne parte.');
  lines.push('');
  lines.push('Pas de panique, c\'est courant et ça se règle en 30 secondes. Un « secret » (comme une');
  lines.push('clé d\'API ou un mot de passe) est sur le point d\'entrer dans l\'historique Git. Une fois');
  lines.push('poussé en ligne, n\'importe qui pourrait le récupérer et s\'en servir à ta place (facture');
  lines.push('d\'API qui grimpe, compte piraté). On le retire AVANT, c\'est tout.');
  lines.push('');

  if (unignoredEnv.length) {
    lines.push('📄 Fichier(s) de secrets sur le point d\'être versionné(s) (ils ne devraient JAMAIS l\'être) :');
    for (const f of unignoredEnv) lines.push(`   • ${f}`);
    lines.push('');
  }

  if (uniq.length) {
    lines.push('🔑 Secret(s) détecté(s) dans le contenu :');
    const shown = uniq.slice(0, MAX_FINDINGS_SHOWN);
    for (const f of shown) {
      lines.push(`   • ${f.file}:${f.line} — ${f.type}  [${f.value}]`);
    }
    if (uniq.length > shown.length) {
      lines.push(`   … et ${uniq.length - shown.length} autre(s).`);
    }
    lines.push('');
  }

  lines.push('✅ Ce qu\'on fait maintenant (je peux le faire pour toi, dis juste « oui ») :');
  lines.push('   1. Sortir le secret du fichier et le mettre dans « .recette/secrets.env »');
  lines.push('      (ce fichier est ignoré par Git : il ne partira jamais en ligne).');
  lines.push('   2. Vérifier que « .env » et « .recette/secrets.env » sont bien dans le .gitignore.');
  lines.push('   3. Dans le code, lire la valeur depuis une variable d\'environnement / une edge');
  lines.push('      function côté serveur — jamais en dur, jamais en EXPO_PUBLIC_.');

  const providers = new Set(uniq.map((f) => f.provider).filter((p) => ROTATE[p]));
  if (providers.size) {
    lines.push('');
    lines.push('🔁 Si ce secret a DÉJÀ été poussé une fois, il faut le régénérer (le remplacer) ici :');
    for (const p of providers) lines.push(`   • ${p} : ${ROTATE[p]}`);
  }

  lines.push('');
  lines.push('Quand c\'est réglé, on relance la commande Git — elle passera toute seule.');
  return lines.join('\n');
}

// ---- Sorties -----------------------------------------------------------------

function allow() {
  // Aucune décision => flux de permissions normal de Claude Code.
  process.exit(0);
}

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(data));
    // garde-fou : si aucun stdin ne vient, ne pas rester bloqué
    setTimeout(() => resolve(data), 4000).unref?.();
  });
}

// ---- Main --------------------------------------------------------------------

async function main() {
  let payload;
  try {
    const raw = await readStdin();
    payload = JSON.parse(raw);
  } catch {
    return allow(); // pas de JSON exploitable -> on ne bloque pas
  }

  const cmd = payload?.tool_input?.command;
  if (typeof cmd !== 'string' || !cmd.trim()) return allow();

  const ops = detectGitOps(cmd);
  if (ops.length === 0) return allow(); // pas un git add/commit/push -> rien à faire

  const cwd = payload.cwd && existsSync(payload.cwd) ? payload.cwd : process.cwd();
  if (!isRepo(cwd)) return allow();
  const root = repoRoot(cwd);

  const { files, envFiles } = collectCandidates(cwd, root, ops);

  // .env non ignorés = drapeau rouge, même sans secret « reconnu » dedans.
  const unignoredEnv = [];
  for (const f of envFiles) {
    const chk = git(cwd, ['check-ignore', '-q', '--', f]);
    // exit 0 = ignoré (OK) ; exit 1 = NON ignoré (danger)
    if (chk.code === 1) unignoredEnv.push(f);
  }

  const findings = [];
  for (const rel of files) scanFile(root, rel, findings);

  if (findings.length === 0 && unignoredEnv.length === 0) return allow();

  return deny(buildReason(findings, unignoredEnv, root));
}

main().catch(() => allow()); // fail-open sur toute erreur inattendue
