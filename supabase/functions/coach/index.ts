// NÉA : coach IA (étape 9). Fonction Edge Supabase (Deno) qui appelle Claude.
// La clé ANTHROPIC_API_KEY est un secret de la fonction (supabase secrets set), jamais dans l'app.
// Réservée aux comptes connectés ; limite quotidienne comptée côté serveur (supabase/coach.sql).
// Reçoit les derniers messages et un résumé du profil, jamais l'email.
import Anthropic from 'npm:@anthropic-ai/sdk@^0.128.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

/** Messages gratuits par jour (chatLeft du prototype). */
const LIMITE = 3;
const MODELE = 'claude-opus-5';

type Message = { r: 'me' | 'bot'; t: string };
type Demande = { coach: { nom: string; style: string; voix: string }; profil: string; messages: Message[] };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const texte = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

/** Valide et borne la demande (tailles limitées : le coût reste maîtrisé). */
function lire(b: unknown): Demande | null {
  if (!b || typeof b !== 'object') return null;
  const o = b as Record<string, unknown>;
  const c = (o.coach ?? {}) as Record<string, unknown>;
  const messages = Array.isArray(o.messages)
    ? o.messages
        .filter((m): m is Message => !!m && typeof m === 'object' && ((m as Message).r === 'me' || (m as Message).r === 'bot'))
        .slice(-10)
        .map((m) => ({ r: m.r, t: texte(m.t, 1500) }))
        .filter((m) => m.t.trim())
    : [];
  if (!messages.length || messages[messages.length - 1].r !== 'me') return null;
  return { coach: { nom: texte(c.nom, 30), style: texte(c.style, 80), voix: texte(c.voix, 600) }, profil: texte(o.profil, 3000), messages };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ erreur: 'methode' }, 405);

  // Compte connecté (jeton de session Supabase envoyé par l'app).
  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const jeton = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: u } = await admin.auth.getUser(jeton);
  const userId = u.user?.id;
  if (!userId) return json({ erreur: 'connexion' }, 401);

  const d = lire(await req.json().catch(() => null));
  if (!d) return json({ erreur: 'demande' }, 400);

  // Limite du jour (jour UTC, comme dayKey du prototype).
  const jour = new Date().toISOString().slice(0, 10);
  const { data: reste, error: eq } = await admin.rpc('coach_consommer', { p_user: userId, p_jour: jour, p_max: LIMITE });
  if (eq) return json({ erreur: 'serveur' }, 500);
  if (reste === -1) return json({ erreur: 'limite', reste: 0 }, 429);

  // Consigne du prototype (ask) : personnage, tutoiement, 2 à 4 phrases, jamais de conseil médical.
  const system = `Tu es ${d.coach.nom}, coach sportif IA de l'app NÉA, style ${d.coach.style}. Personnalité : ${d.coach.voix}. Tu tutoies, tu réponds en français, en 2 à 4 phrases, concret. Jamais de conseil médical : en cas de douleur ou de problème de santé, oriente vers un professionnel.
${d.profil}
Réponds uniquement au dernier message, sans préfixe.`;

  // Les messages doivent commencer par l'utilisateur : on retire le message d'accueil du coach.
  const hist = d.messages.slice(d.messages.findIndex((m) => m.r === 'me'));
  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
  try {
    const r = await anthropic.beta.messages.create({
      model: MODELE,
      max_tokens: 16000,
      system,
      messages: hist.map((m) => ({ role: m.r === 'me' ? 'user' : 'assistant', content: m.t })),
      // Réponses courtes de discussion : peu de réflexion suffit.
      output_config: { effort: 'low' },
      // Si le modèle décline, Anthropic relance la demande sur le modèle de secours recommandé.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
    if (r.stop_reason === 'refusal') throw new Error('refus');
    const reponse = r.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { text: string }).text)
      .join('')
      .trim();
    if (!reponse) throw new Error('vide');
    return json({ texte: reponse, reste });
  } catch (e) {
    // Pas de réponse : le message n'est pas compté, l'app affiche la réponse de secours du prototype.
    await admin.rpc('coach_rendre', { p_user: userId, p_jour: jour });
    if (e instanceof Anthropic.RateLimitError) return json({ erreur: 'occupe', reste: reste + 1 }, 503);
    if (e instanceof Anthropic.APIError) console.error('Claude', e.status, e.message);
    else console.error('Coach', e);
    return json({ erreur: 'modele', reste: reste + 1 }, 502);
  }
});
