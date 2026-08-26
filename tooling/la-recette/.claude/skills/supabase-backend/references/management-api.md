# Supabase Management API — scripts prêts

Lit le token depuis `.env` (jamais l'afficher). `{ref}` = sous-domaine de l'URL Supabase.

> **Ordre de la Phase Backend** (un projet neuf n'a RIEN de configuré) :
> 1. `create-project.mjs` → crée le projet et récupère l'URL + la clé anon.
> 2. `provision-auth.mjs` → **désactive la confirmation d'email** (sinon le 1er signup casse — voir plus bas). **Étape obligatoire.**
> 3. migrations SQL + Redirect URL (reset mdp) + déploiement des Edge Functions.

## Créer le projet de zéro (`POST /v1/projects` + polling)
On ne crée PAS le projet à la main dans le dashboard : on le fait en script pour que tout le build
soit reproductible. La création est asynchrone (1–3 min) → on **poll** le statut jusqu'à `ACTIVE_HEALTHY`
avant de pouvoir l'utiliser, puis on lit les clés d'API.
```js
// create-project.mjs — usage: node create-project.mjs .env "nom-du-projet"
// Pré-requis dans .env : SUPABASE_ACCESS_TOKEN (token perso Management API).
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const env = readFileSync(process.argv[2], 'utf8');
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1]?.trim();
const token = get('SUPABASE_ACCESS_TOKEN');
const name = process.argv[3] || 'mon-app';
const region = get('SUPABASE_REGION') || 'us-east-1'; // change si tes users sont ailleurs (eu-west-1, etc.)

const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1. Organisation : on prend la première du compte
const orgs = await (await fetch('https://api.supabase.com/v1/organizations', { headers: h })).json();
const organization_id = orgs[0]?.id;
if (!organization_id) throw new Error('Aucune organisation pour ce token (vérifie le scope).');

// 2. Mot de passe de la base : généré, unique, jamais réutilisé ailleurs
const db_pass = 'Db-' + randomUUID();

// 3. Création (le "plan: free" reste le tier gratuit)
const created = await (await fetch('https://api.supabase.com/v1/projects', {
  method: 'POST', headers: h,
  body: JSON.stringify({ name, organization_id, region, db_pass, plan: 'free' }),
})).json();
const ref = created.id;
if (!ref) throw new Error('Création échouée : ' + JSON.stringify(created));
console.log('Projet créé, ref =', ref);

// 4. Polling jusqu'à ACTIVE_HEALTHY (autres statuts transitoires : COMING_UP, UNKNOWN…)
let status = created.status;
while (status !== 'ACTIVE_HEALTHY') {
  await sleep(5000);
  const p = await (await fetch(`https://api.supabase.com/v1/projects/${ref}`, { headers: h })).json();
  status = p.status;
  console.log('  statut:', status);
}

// 5. Clés d'API (reveal=true pour obtenir la vraie valeur, pas un masque)
const keys = await (await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys?reveal=true`, { headers: h })).json();
const anon = keys.find((k) => k.name === 'anon')?.api_key;

console.log('\nÀ ajouter dans .env :');
console.log(`EXPO_PUBLIC_SUPABASE_URL=https://${ref}.supabase.co`);
console.log(`EXPO_PUBLIC_SUPABASE_ANON_KEY=${anon}`);
console.log(`# db_pass (garde-le au chaud, il ne se réaffiche pas) : ${db_pass}`);
```
La clé `anon` (publishable) va dans le bundle de l'app → c'est OK. La `service_role` (aussi listée par
`/api-keys`) est **server-only** : elle ne sort JAMAIS de la machine de build / des secrets d'Edge Function.

## Provisionner l'auth : désactiver la confirmation d'email (OBLIGATOIRE)
**Le piège n°1 d'un projet neuf.** Par défaut, un projet Supabase a la **confirmation d'email ACTIVÉE** :
au 1er `signUp`, l'utilisateur reçoit un mail à cliquer et `signUp` renvoie une session **nulle** → l'app
croit que personne n'est connecté → l'onboarding casse pour presque tous tes premiers users. On désactive
donc ce comportement à la création (auth email/mot de passe simple, sans clic mail).
```js
// provision-auth.mjs — usage: node provision-auth.mjs .env
import { readFileSync } from 'node:fs';
const env = readFileSync(process.argv[2], 'utf8');
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1]?.trim();
const token = get('SUPABASE_ACCESS_TOKEN');
const ref = new URL(get('EXPO_PUBLIC_SUPABASE_URL')).hostname.split('.')[0];
const api = `https://api.supabase.com/v1/projects/${ref}/config/auth`;
const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

const res = await fetch(api, { method: 'PATCH', headers: h, body: JSON.stringify({ mailer_autoconfirm: true }) });
const cfg = await res.json();
console.log(res.status, 'mailer_autoconfirm =', cfg.mailer_autoconfirm); // doit être true
```
**Self-check indispensable** (à faire une fois, avec un email jetable) : un `signUp` neuf doit renvoyer
une **session non-nulle**.
```js
// data.session != null  → OK, la confirmation est bien désactivée.
// data.session == null   → la confirmation est restée ON : re-run provision-auth.mjs.
const { data } = await supabase.auth.signUp({ email: 'test+neuf@example.com', password: 'Test-1234!' });
console.log('session au signup :', data.session ? 'OK' : 'NULLE → auth cassée');
```

## Exécuter du SQL (migrations, seed, patch, inspection)
```js
// db-query.mjs — usage: node db-query.mjs .env "select ..."
import { readFileSync } from 'node:fs';
const env = readFileSync(process.argv[2], 'utf8');
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1]?.trim();
const token = get('SUPABASE_ACCESS_TOKEN');
const ref = new URL(get('EXPO_PUBLIC_SUPABASE_URL')).hostname.split('.')[0];
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: process.argv[3] }),
});
console.log(res.status, await res.text());
```
Exemples utiles :
- Lister users + profil : `select u.email, p.is_premium from auth.users u left join profiles p on p.user_id=u.id order by u.created_at desc limit 20;`
- Passer un compte démo premium : `update profiles set is_premium=true where user_id=(select id from auth.users where email='...');`
- Poser/reset un mot de passe (compte démo) : `update auth.users set encrypted_password = crypt('MotDePasse!', gen_salt('bf')), updated_at=now() where email='...';`
- Inspecter un schéma : `select column_name, data_type from information_schema.columns where table_schema='public' and table_name='...';`

## Ajouter une Redirect URL (reset mdp deep-link)
```js
// set-redirect.mjs — GET la config, append la target si absente, PATCH
const api = `https://api.supabase.com/v1/projects/${ref}/config/auth`;
const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const cfg = await (await fetch(api, { headers: h })).json();
const list = (cfg.uri_allow_list || '').split(',').map(s=>s.trim()).filter(Boolean);
const TARGET = 'monapp://reset-password';
if (!list.includes(TARGET)) {
  await fetch(api, { method:'PATCH', headers:h, body: JSON.stringify({ uri_allow_list: [...list, TARGET].join(',') }) });
}
```
Note : le `site_url` par défaut est souvent `http://localhost:3000` (page morte sur device) → c'est
pourquoi le `redirectTo` + l'allow-list sont indispensables pour le reset mdp.

## Déployer une Edge Function (sans Docker)
⚠️ **Syntaxe selon ton shell** (PowerShell sur Windows, bash sur Mac) — ne sers pas un `$(...)`/`export`
bash à PowerShell.

**PowerShell (Windows)** :
```powershell
$env:SUPABASE_ACCESS_TOKEN = ((Get-Content .env | Select-String '^SUPABASE_ACCESS_TOKEN=') -replace '^SUPABASE_ACCESS_TOKEN=', '').Trim()
npx --yes supabase@latest functions deploy <name> --project-ref <ref> --no-verify-jwt
```

**bash (Mac/Linux)** :
```bash
export SUPABASE_ACCESS_TOKEN=$(grep '^SUPABASE_ACCESS_TOKEN=' .env | cut -d= -f2- | tr -d '\r')
npx --yes supabase@latest functions deploy <name> --project-ref <ref> --no-verify-jwt
```
Le warning « Docker is not running » est bénin : le CLI uploade via l'API.
