---
name: supabase-backend
description: >
  Met en place et opère le backend Supabase d'une app mobile (auth, base de données, RLS, Edge Functions,
  secrets, reset mot de passe deep-link) selon un playbook éprouvé en production. Utilise ce skill dès
  qu'on branche Supabase, qu'on met en place l'authentification email/mot de passe, qu'on écrit des
  migrations ou des policies RLS, qu'on crée une Edge Function (proxy IA avec clé server-only), qu'on gère
  les secrets serveur, ou qu'on doit appliquer du SQL / configurer le projet via la Management API. Couvre
  aussi le fix du reset mot de passe par deep-link natif.
---

# Supabase Backend — auth, DB, Edge Functions

## Config du client (app Expo)
```ts
// services/supabase/client.ts
export const supabase = createClient(URL, ANON_KEY, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true,
          detectSessionInUrl: false },  // NATIF : on gère la session à la main, ne PAS mettre true
});
// Rafraîchir la session sur AppState 'active' (startAutoRefresh/stopAutoRefresh)
```
- `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` (publishable) → OK dans le bundle.
- Auth **email + mot de passe** au launch (Google/Apple plus tard). **Confirmation d'email désactivée**
  (`mailer_autoconfirm = true`) : ce n'est pas une préférence, c'est une **étape de provisioning obligatoire**
  sur un projet neuf (sinon le 1er signup ne renvoie pas de session → onboarding cassé). Posée par
  `provision-auth.mjs` — voir `references/management-api.md`.

## Flux auth — implémentation de référence (à copier telle quelle)
Le squelette minimal qui marche : un contexte qui connaît la session, un layout racine qui **route**
selon la session, et deux écrans. Rien de plus au launch. (Chemins en Expo Router : dossier `app/`, groupe
`(auth)/` pour les écrans non connectés.)

**Le contexte auth** — source de vérité unique de « qui est connecté » :
```tsx
// features/auth/auth-context.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../services/supabase/client';

const AuthContext = createContext<{ session: Session | null; loading: boolean }>({ session: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // 1. Session déjà stockée (AsyncStorage) au démarrage
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    // 2. Écoute TOUS les changements : login, logout, refresh de token
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
```

**Le layout racine** — le videur à l'entrée : pas de session → écrans de login ; session → l'app :
```tsx
// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../features/auth/auth-context';

function Gate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;                        // on attend de savoir avant de router
    const inAuth = segments[0] === '(auth)';    // suis-je déjà sur un écran de login ?
    if (!session && !inAuth) router.replace('/(auth)/sign-in'); // pas connecté → login
    else if (session && inAuth) router.replace('/');            // connecté → l'app
  }, [session, loading, segments]);
  return <Stack screenOptions={{ headerShown: false }} />;
}
export default function RootLayout() {
  return (<AuthProvider><Gate /></AuthProvider>);
}
```
> Si tu ajoutes le reset mdp deep-link (section plus bas), le `Gate` doit respecter le flag `recovering`
> et **ne pas** rediriger vers l'app tant que le nouveau mot de passe n'est pas posé.

**L'inscription** — avec `mailer_autoconfirm=true`, `signUp` renvoie une session direct → le `Gate` route seul :
```tsx
// app/(auth)/sign-up.tsx
import { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '../../services/supabase/client';

export default function SignUp() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  async function onSignUp() {
    setErr(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return setErr(error.message);
    // Garde-fou : session nulle ici = la confirmation d'email est restée ON côté serveur (voir provisioning).
    if (!data.session) setErr("Compte créé mais pas de session : confirmation d'email encore activée.");
  }
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
      <TextInput placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput placeholder="Mot de passe" secureTextEntry value={password} onChangeText={setPassword} />
      {err && <Text style={{ color: 'red' }}>{err}</Text>}
      <Button title="Créer mon compte" onPress={onSignUp} />
      <Link href="/(auth)/sign-in">J'ai déjà un compte</Link>
    </View>
  );
}
```

**La connexion** — pas besoin de router à la main : `onAuthStateChange` prévient le `Gate` :
```tsx
// app/(auth)/sign-in.tsx  (même structure ; seul le handler change)
async function onSignIn() {
  setErr(null);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) setErr(error.message); // succès → onAuthStateChange met à jour la session → le Gate route
}
```

**La déconnexion** — une ligne, depuis n'importe quel écran (ex. le profil) :
```tsx
// SIGNED_OUT → session nulle → le Gate renvoie vers /(auth)/sign-in automatiquement
<Button title="Se déconnecter" onPress={() => supabase.auth.signOut()} />
```

## Management API (automatisation sans dashboard)
Le token `SUPABASE_ACCESS_TOKEN` (dans `.env`, à révoquer après launch) permet de tout piloter en script :

**Exécuter du SQL** (migrations, seed, patch) :
```
POST https://api.supabase.com/v1/projects/{ref}/database/query
Authorization: Bearer $SUPABASE_ACCESS_TOKEN   body: {"query": "..."}
```
**Config auth** (ex. allow-list des Redirect URLs) :
```
GET/PATCH https://api.supabase.com/v1/projects/{ref}/config/auth   body: {"uri_allow_list": "...,monapp://reset-password"}
```
`{ref}` = sous-domaine de l'URL Supabase. Voir `references/management-api.md` pour les scripts Node prêts.

## Base de données + RLS
- Migrations versionnées dans `db/` (ou `supabase/migrations/`), appliquées via l'endpoint SQL ci-dessus.
- **RLS activé sur toutes les tables** ; policies `user_id = auth.uid()`.
- Colonnes de quota / premium (`profiles`) : **jamais modifiables par le client** — seule l'Edge Function
  (service role) les écrit.
- Suppression de compte : RPC `SECURITY DEFINER` `delete_current_user`.

## Edge Functions — le proxy IA (clé server-only)
Une Edge Function est **la seule porte** vers une API tierce payante (ex. IA). La clé n'existe QUE côté
serveur (secret de fonction), jamais dans l'app.
- Structure : lit le JWT (`Authorization`) → user connecté ou anonyme ; vérifie **quota** + **rate-limit**
  (table `generation_events` par user/IP) ; appelle l'API avec `AbortSignal.timeout(20000)` ; renvoie du
  JSON. Garde-fous : `response_format: json_object`, anti prompt-injection (neutraliser les délimiteurs),
  forcer les champs sensibles côté serveur.
- **Secrets** : posés via `supabase secrets set` ou le dashboard (ex. clé d'API du prestataire IA).
  Persistent entre déploiements.
- **Déployer** (sans Docker, via l'API — le token env suffit). ⚠️ **Syntaxe selon ton shell** (PowerShell
  Windows / bash Mac) :

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
  ⚠️ **`--no-verify-jwt`** si la fonction gère elle-même l'auth (ex. appels anonymes pendant l'onboarding) ;
  sinon le gateway rejette les requêtes sans user JWT.
- Le prompt/logique d'une Edge Function est **côté serveur** → un `deploy` prend effet **immédiatement**,
  sans rebuild de l'app. Idéal pour itérer un prompt IA et le tester sur un build existant.

## Reset mot de passe — deep-link natif (le fix)
Symptôme classique : le lien du mail ouvre « Safari ne peut pas ouvrir la page ». Cause : `resetPasswordForEmail`
sans `redirectTo` → Supabase retombe sur le **Site URL** (souvent `localhost:3000`). Fix propre natif :
1. `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'monapp://reset-password' })`
2. **Allow-lister** `monapp://reset-password` dans Redirect URLs (dashboard ou Management API — sinon ignoré).
3. Handler de deep-link (`expo-linking` `useURL()`) : parse le **fragment** `#access_token…type=recovery`,
   `supabase.auth.setSession({access_token, refresh_token})`, route vers un écran « nouveau mot de passe ».
4. Écran reset : `supabase.auth.updateUser({ password })`. Un flag `recovering` empêche le layout racine
   de rediriger vers l'app tant que le mdp n'est pas posé.
5. Scheme `monapp` déclaré dans `app.json`. Se teste **uniquement en build standalone** (pas Expo Go/dev-client).

## Landmines du tier gratuit (à désamorcer AVANT le lancement)
Le tier gratuit fait tourner l'app en dev sans payer — mais deux comportements cassent l'auth **en prod**
et ne ressemblent pas à des bugs. Le `doctor` les prend souvent pour un simple hoquet réseau. À traiter
en fin de build, quand l'app part vers de vrais users.

**1. La pause d'inactivité (~7 jours) — le tueur silencieux.**
Un projet gratuit sans activité pendant ~7 jours est **mis en pause** par Supabase : la base s'endort,
et **login/signup renvoient une erreur** (souvent lue comme « network request failed »). Tes tout premiers
utilisateurs — qui arrivent justement après une période creuse — voient une app cassée.
- **À dire au user en fin de build (langage humain)** : « Ton backend est sur l'offre gratuite. Si personne
  ne l'utilise pendant ~7 jours, il se met en veille et tes premiers visiteurs verront une erreur de
  connexion le temps qu'il se réveille. Deux options avant de lancer. »
- **Option A — keep-alive (gratuit, un rappel léger)** : un petit ping quotidien qui compte comme de
  l'activité. Ex. un cron GitHub Actions qui fait une requête triviale sur la base :
  ```yaml
  # .github/workflows/keep-alive.yml
  on: { schedule: [{ cron: '0 12 * * *' }] }   # tous les jours à midi UTC
  jobs:
    ping:
      runs-on: ubuntu-latest
      steps:
        - run: |
            curl -s "$SUPABASE_URL/rest/v1/profiles?select=user_id&limit=1" \
              -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY"
        env: { SUPABASE_URL: ${{ secrets.SUPABASE_URL }}, SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }} }
  ```
  Honnête : un keep-alive **réduit** le risque mais Supabase peut quand même pauser sur des critères
  d'activité réelle. C'est un pansement, pas une garantie.
- **Option B — passer au plan Pro (~25 $/mois), recommandé dès qu'il y a de vrais users** : pas de pause,
  backups, plus de capacité. C'est une **décision produit** (donc au user de trancher) : on l'explique,
  on ne l'impose pas.

**2. L'email intégré est bridé (reset mdp qui « n'arrive pas »).**
Le service d'envoi d'emails inclus est pensé pour le **test**, pas la prod : il est plafonné à un tout
petit nombre d'emails par heure. Résultat en vrai : les mails de **reset de mot de passe** (et toute
confirmation) sont throttlés → « je ne reçois rien », alors que rien n'est cassé.
- **Le fix propre = un SMTP custom** (envoi d'email par un vrai prestataire). Ex. **Resend** a une offre
  gratuite (≈ 3000 emails/mois, 100/jour) largement suffisante au lancement.
- Se configure côté serveur via `PATCH /config/auth` (Management API) — **jamais dans le bundle de l'app** :
  ```js
  // champs SMTP à poser dans la config auth (la clé/API SMTP reste server-only)
  { smtp_admin_email: 'noreply@ton-domaine.com', smtp_sender_name: 'Ton App',
    smtp_host: 'smtp.resend.com', smtp_port: 465, smtp_user: 'resend',
    smtp_pass: '<clé_API_Resend>' }   // secret → config serveur, pas dans .env public du bundle
  ```
  Pré-requis Resend : vérifier un domaine d'envoi (sinon les mails partent en spam / sont refusés).
- **Si le budget est zéro au lancement** : garder l'email intégré, mais **prévenir le user** que le reset
  mdp peut tarder/être limité, et basculer sur SMTP custom dès les premiers vrais utilisateurs.

## Accès & sécurité
- `.env` gitignored. Tokens (`SUPABASE_ACCESS_TOKEN`) et clés à **révoquer/rotater** avant/après launch.
- Ne jamais committer de secret. Ne jamais logger un token en clair.
