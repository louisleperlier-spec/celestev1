#!/usr/bin/env node
// La Recette — verify-secrets
// -----------------------------------------------------------------------------
// Lit « .recette/secrets.env » de l'app courante et TESTE chaque secret par un
// vrai appel réseau (pas juste « est-ce que la variable existe »). Affiche un
// tableau vert / rouge lisible par un débutant, et pour chaque échec le lien
// EXACT pour régénérer le token.
//
// Usage :
//   node scripts/verify-secrets.mjs [--file <chemin/vers/secrets.env>] [--json]
//
// Cross-platform : Node 18+ (fetch global), zéro dépendance, zéro bash-isme.
// -----------------------------------------------------------------------------

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// ---- Couleurs terminal (désactivées si NO_COLOR ou pas de TTY) ----------------
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const green = (s) => c('32', s);
const red = (s) => c('31', s);
const yellow = (s) => c('33', s);
const dim = (s) => c('90', s);
const bold = (s) => c('1', s);

// ---- Localiser + parser .recette/secrets.env ---------------------------------

function findSecretsFile() {
  const arg = argValue('--file');
  if (arg) return path.resolve(arg);
  // Remonte les dossiers parents jusqu'à trouver .recette/secrets.env
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    const candidate = path.join(dir, '.recette', 'secrets.env');
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.join(process.cwd(), '.recette', 'secrets.env');
}

function argValue(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}
const asJson = process.argv.includes('--json');

function parseEnv(content) {
  const env = {};
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    // retire guillemets + commentaire de fin
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    } else {
      val = val.replace(/\s+#.*$/, '').trim();
    }
    env[m[1]] = val;
  }
  return env;
}

// premier des noms fournis qui a une valeur non-placeholder
function pick(env, ...names) {
  for (const n of names) {
    const v = env[n];
    if (v && !/^(your|xxx|<|changeme|placeholder|todo|ici|votre)/i.test(v)) return v;
  }
  return null;
}

// ---- Helper fetch avec timeout ------------------------------------------------

async function http(url, opts = {}, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

// ---- Définition des checks ----------------------------------------------------
// Chaque check renvoie { status: 'ok'|'fail'|'skip', detail, rotate }

const ROTATE = {
  github: 'https://github.com/settings/tokens',
  supabase: 'https://supabase.com/dashboard/account/tokens',
  vercel: 'https://vercel.com/account/tokens',
  expo: 'https://expo.dev/settings/access-tokens',
  // Clé v2 RevenueCat = au niveau du PROJET (ton projet → Project settings → API keys).
  revenuecat: 'https://app.revenuecat.com/ (ton projet → Project settings → API keys)',
  openai: 'https://platform.openai.com/api-keys',
  apple: 'https://appstoreconnect.apple.com/access/integrations/api',
};

function skip(reason) { return { status: 'skip', detail: reason }; }
function ok(detail) { return { status: 'ok', detail }; }
function fail(detail, rotate) { return { status: 'fail', detail, rotate }; }

async function checkGitHub(env) {
  const token = pick(env, 'GITHUB_TOKEN', 'GH_TOKEN');
  if (!token) return skip('aucun GITHUB_TOKEN dans secrets.env');
  try {
    const res = await http('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'la-recette-verify',
        Accept: 'application/vnd.github+json',
      },
    });
    if (res.ok) {
      const j = await res.json();
      return ok(`connecté en tant que @${j.login}`);
    }
    return fail(`refusé (HTTP ${res.status})`, ROTATE.github);
  } catch (e) {
    return fail(`réseau : ${e.message}`, ROTATE.github);
  }
}

async function checkSupabaseMgmt(env) {
  const token = pick(env, 'SUPABASE_ACCESS_TOKEN', 'SUPABASE_PAT');
  if (!token) return skip('aucun SUPABASE_ACCESS_TOKEN dans secrets.env');
  try {
    const res = await http('https://api.supabase.com/v1/projects', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const j = await res.json().catch(() => []);
      const n = Array.isArray(j) ? j.length : '?';
      return ok(`Management API OK (${n} projet(s))`);
    }
    return fail(`refusé (HTTP ${res.status})`, ROTATE.supabase);
  } catch (e) {
    return fail(`réseau : ${e.message}`, ROTATE.supabase);
  }
}

async function checkSupabaseServiceRole(env) {
  const url = pick(env, 'SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL');
  const key = pick(env, 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY');
  if (!url || !key) return skip('SUPABASE_URL + SERVICE_ROLE_KEY requis');
  try {
    const base = url.replace(/\/+$/, '');
    const res = await http(`${base}/rest/v1/?apikey=${encodeURIComponent(key)}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    // 200 (root) ou 404 (pas de table listable) = clé acceptée. 401/403 = mauvaise clé.
    if (res.status === 401 || res.status === 403) {
      return fail(`clé refusée (HTTP ${res.status})`, ROTATE.supabase);
    }
    if (res.ok || res.status === 404) return ok('service_role acceptée par le projet');
    return fail(`réponse inattendue (HTTP ${res.status})`, ROTATE.supabase);
  } catch (e) {
    return fail(`réseau : ${e.message}`, ROTATE.supabase);
  }
}

async function checkVercel(env) {
  const token = pick(env, 'VERCEL_TOKEN');
  if (!token) return skip('aucun VERCEL_TOKEN dans secrets.env');
  try {
    const res = await http('https://api.vercel.com/v2/user', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const j = await res.json().catch(() => ({}));
      const who = j?.user?.username || j?.user?.email || 'compte OK';
      return ok(`connecté : ${who}`);
    }
    return fail(`refusé (HTTP ${res.status})`, ROTATE.vercel);
  } catch (e) {
    return fail(`réseau : ${e.message}`, ROTATE.vercel);
  }
}

async function checkExpo(env) {
  const token = pick(env, 'EXPO_TOKEN', 'EAS_TOKEN');
  if (!token) return skip('aucun EXPO_TOKEN dans secrets.env');
  try {
    const res = await http('https://api.expo.dev/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ meActor { __typename ... on User { username } } }' }),
    });
    if (res.ok) {
      const j = await res.json().catch(() => ({}));
      const actor = j?.data?.meActor;
      if (actor && actor.__typename) {
        return ok(`connecté : ${actor.username || actor.__typename}`);
      }
      return fail('token non reconnu par Expo', ROTATE.expo);
    }
    return fail(`refusé (HTTP ${res.status})`, ROTATE.expo);
  } catch (e) {
    return fail(`réseau : ${e.message}`, ROTATE.expo);
  }
}

async function checkRevenueCat(env) {
  const key = pick(env, 'REVENUECAT_SECRET_KEY', 'REVENUECAT_API_V2_KEY', 'REVENUECAT_API_KEY');
  if (!key) return skip('aucune REVENUECAT_SECRET_KEY dans secrets.env');
  try {
    const res = await http('https://api.revenuecat.com/v2/projects', {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
    });
    if (res.ok) {
      const j = await res.json().catch(() => ({}));
      const n = Array.isArray(j?.items) ? j.items.length : '?';
      return ok(`API v2 OK (${n} projet(s))`);
    }
    if (res.status === 401 || res.status === 403) {
      return fail('clé refusée (utilise la clé SECRÈTE v2 au niveau du PROJET, pas une clé publique)', ROTATE.revenuecat);
    }
    return fail(`réponse inattendue (HTTP ${res.status})`, ROTATE.revenuecat);
  } catch (e) {
    return fail(`réseau : ${e.message}`, ROTATE.revenuecat);
  }
}

async function checkOpenAI(env) {
  const key = pick(env, 'OPENAI_API_KEY');
  if (!key) return skip('aucune OPENAI_API_KEY dans secrets.env');
  try {
    const res = await http('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (res.ok) {
      const j = await res.json().catch(() => ({}));
      const n = Array.isArray(j?.data) ? j.data.length : '?';
      return ok(`clé valide (${n} modèles accessibles)`);
    }
    if (res.status === 401) return fail('clé refusée (401)', ROTATE.openai);
    if (res.status === 429) return fail('clé OK mais quota/débit atteint (429)', ROTATE.openai);
    return fail(`réponse inattendue (HTTP ${res.status})`, ROTATE.openai);
  } catch (e) {
    return fail(`réseau : ${e.message}`, ROTATE.openai);
  }
}

// Bonus : App Store Connect (JWT ES256 signé avec la clé .p8). Optionnel.
async function checkApple(env) {
  const keyId = pick(env, 'APPLE_ASC_KEY_ID', 'ASC_KEY_ID');
  const issuerId = pick(env, 'APPLE_ASC_ISSUER_ID', 'ASC_ISSUER_ID');
  let pem = pick(env, 'APPLE_ASC_PRIVATE_KEY', 'ASC_PRIVATE_KEY');
  const keyPath = pick(env, 'APPLE_ASC_PRIVATE_KEY_PATH', 'ASC_PRIVATE_KEY_PATH');
  if (!keyId || !issuerId || (!pem && !keyPath)) {
    return skip('App Store Connect API non configurée (optionnel)');
  }
  try {
    if (!pem && keyPath && existsSync(keyPath)) pem = readFileSync(keyPath, 'utf8');
    if (pem) pem = pem.replace(/\\n/g, '\n'); // au cas où stocké en une ligne
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'ES256', kid: keyId, typ: 'JWT' };
    const payload = { iss: issuerId, iat: now, exp: now + 600, aud: 'appstoreconnect-v1' };
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const signingInput = `${b64(header)}.${b64(payload)}`;
    const sig = crypto.sign('SHA256', Buffer.from(signingInput), {
      key: pem, dsaEncoding: 'ieee-p1363',
    });
    const jwt = `${signingInput}.${sig.toString('base64url')}`;
    const res = await http('https://api.appstoreconnect.apple.com/v1/apps?limit=1', {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (res.ok) return ok('clé App Store Connect valide');
    if (res.status === 401) return fail('JWT refusé (401) — vérifie KEY_ID / ISSUER_ID / .p8', ROTATE.apple);
    return fail(`réponse inattendue (HTTP ${res.status})`, ROTATE.apple);
  } catch (e) {
    return fail(`clé illisible ou signature échouée : ${e.message}`, ROTATE.apple);
  }
}

const CHECKS = [
  ['GitHub', checkGitHub],
  ['Supabase (Management)', checkSupabaseMgmt],
  ['Supabase (service_role)', checkSupabaseServiceRole],
  ['Vercel', checkVercel],
  ['Expo / EAS', checkExpo],
  ['RevenueCat', checkRevenueCat],
  ['OpenAI', checkOpenAI],
  ['App Store Connect', checkApple],
];

// ---- Rendu du tableau ---------------------------------------------------------

function pad(s, n) {
  const len = [...s].length;
  return len >= n ? s : s + ' '.repeat(n - len);
}

function statusCell(status) {
  if (status === 'ok') return green('  OK  ');
  if (status === 'fail') return red(' ÉCHEC');
  return dim('absent');
}

function render(results, file) {
  const rows = results.map((r) => ({
    name: r.name,
    status: r.status,
    detail: r.detail || '',
    rotate: r.rotate || '',
  }));

  const nameW = Math.max(18, ...rows.map((r) => r.name.length));
  const out = [];
  out.push('');
  out.push(bold('  Vérification des secrets — La Recette'));
  out.push(dim(`  ${file}`));
  out.push('');
  out.push(`  ${pad('Service', nameW)}  ${pad('État', 6)}  Détail`);
  out.push(`  ${'-'.repeat(nameW)}  ${'-'.repeat(6)}  ${'-'.repeat(40)}`);
  for (const r of rows) {
    out.push(`  ${pad(r.name, nameW)}  ${statusCell(r.status)}  ${r.detail}`);
  }
  out.push('');

  const okN = rows.filter((r) => r.status === 'ok').length;
  const failN = rows.filter((r) => r.status === 'fail').length;
  const skipN = rows.filter((r) => r.status === 'skip').length;

  out.push(`  ${bold(`${okN} OK`)} · ${failN ? red(`${failN} à corriger`) : `${failN} à corriger`} · ${dim(`${skipN} non configuré(s)`)}`);

  if (failN > 0) {
    out.push('');
    out.push(yellow('  À corriger — régénère le(s) token(s) puis recolle-le(s) dans .recette/secrets.env :'));
    for (const r of rows.filter((x) => x.status === 'fail')) {
      out.push(`   • ${r.name} : ${r.detail}`);
      if (r.rotate) out.push(`     → ${r.rotate}`);
    }
    out.push('');
    out.push(dim('  Astuce : un token « refusé » a souvent expiré ou n\'a pas le bon périmètre (scope).'));
  } else if (skipN === rows.length) {
    out.push('');
    out.push(yellow('  Aucun secret configuré pour l\'instant — colle tes tokens dans .recette/secrets.env.'));
  } else {
    out.push('');
    out.push(green('  Tout est branché. On peut construire. 🍜'));
  }
  out.push('');
  return out.join('\n');
}

// ---- Main --------------------------------------------------------------------

async function main() {
  const file = findSecretsFile();
  if (!existsSync(file)) {
    const msg = `Je ne trouve pas « .recette/secrets.env ». Lance /new pour créer ton app, ou /setup pour brancher tes comptes.`;
    if (asJson) { console.log(JSON.stringify({ error: 'no-secrets-file', file })); }
    else { console.log('\n  ' + yellow(msg) + `\n  ${dim('(cherché : ' + file + ')')}\n`); }
    process.exit(2);
  }

  const env = parseEnv(readFileSync(file, 'utf8'));
  const results = await Promise.all(
    CHECKS.map(async ([name, fn]) => {
      try { return { name, ...(await fn(env)) }; }
      catch (e) { return { name, status: 'fail', detail: `erreur interne : ${e.message}` }; }
    })
  );

  if (asJson) {
    console.log(JSON.stringify({ file, results }, null, 2));
  } else {
    console.log(render(results, file));
  }

  const anyFail = results.some((r) => r.status === 'fail');
  process.exit(anyFail ? 1 : 0);
}

main().catch((e) => {
  console.error('verify-secrets : ' + e.message);
  process.exit(1);
});
