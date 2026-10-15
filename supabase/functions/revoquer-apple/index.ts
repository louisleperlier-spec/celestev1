// NÉA : révocation de « Se connecter avec Apple » quand on supprime son compte (règle 5.1.1(v) de l'App Store).
// L'app redemande un code d'autorisation à Apple (Face ID), la fonction l'échange contre un jeton puis le révoque.
// Secrets de la fonction : APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY (clé .p8 « Sign in with Apple » de developer.apple.com).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { importPKCS8, SignJWT } from 'npm:jose@5';

const CLIENT_ID = 'com.neacoach.app';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

/** Secret client d'Apple : JWT ES256 signé avec la clé « Sign in with Apple », valable 5 minutes. */
async function secretClient(): Promise<string | null> {
  const equipe = Deno.env.get('APPLE_TEAM_ID');
  const cleId = Deno.env.get('APPLE_KEY_ID');
  const pem = Deno.env.get('APPLE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
  if (!equipe || !cleId || !pem) return null;
  const cle = await importPKCS8(pem, 'ES256');
  return await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: cleId })
    .setIssuer(equipe)
    .setSubject(CLIENT_ID)
    .setAudience('https://appleid.apple.com')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(cle);
}

const formulaire = (o: Record<string, string>) => new URLSearchParams(o).toString();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ erreur: 'methode' }, 405);

  // Compte connecté seulement (la suppression du compte se fait juste après, par l'app).
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const jeton = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: u } = await admin.auth.getUser(jeton);
  if (!u.user) return json({ erreur: 'connexion' }, 401);

  const corps = (await req.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof corps?.code === 'string' ? corps.code.slice(0, 2000) : '';
  if (!code) return json({ erreur: 'demande' }, 400);

  const secret = await secretClient();
  if (!secret) return json({ erreur: 'configuration' }, 501);

  const entetes = { 'Content-Type': 'application/x-www-form-urlencoded' };
  // 1. Code d'autorisation → jeton de rafraîchissement.
  const t = await fetch('https://appleid.apple.com/auth/token', {
    method: 'POST',
    headers: entetes,
    body: formulaire({ client_id: CLIENT_ID, client_secret: secret, code, grant_type: 'authorization_code' }),
  });
  const tj = (await t.json().catch(() => ({}))) as { refresh_token?: string; access_token?: string; error?: string };
  const aRevoquer = tj.refresh_token ?? tj.access_token;
  if (!t.ok || !aRevoquer) {
    console.error('Apple token', t.status, tj.error);
    return json({ erreur: 'apple' }, 502);
  }
  // 2. Révocation : l'app disparaît de « Apps utilisant l'identifiant Apple » de l'utilisateur.
  const r = await fetch('https://appleid.apple.com/auth/revoke', {
    method: 'POST',
    headers: entetes,
    body: formulaire({ client_id: CLIENT_ID, client_secret: secret, token: aRevoquer, token_type_hint: tj.refresh_token ? 'refresh_token' : 'access_token' }),
  });
  if (!r.ok) {
    console.error('Apple revoke', r.status);
    return json({ erreur: 'apple' }, 502);
  }
  return json({ ok: true });
});
