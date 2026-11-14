// Étape 2 — Noter : visite chaque site et fait ressortir ceux qui sont absents, cassés ou dépassés.
// Score d'opportunité 0-100 : plus c'est haut, plus le commerce a besoin d'un nouveau site.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const SOCIAL = /(facebook\.com|instagram\.com|linktr\.ee|business\.site|wixsite\.com|godaddysites\.com)/i;

async function fetchWithTimeout(url, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  const start = Date.now();
  try {
    const r = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA, Accept: 'text/html,*/*' } });
    const html = (await r.text()).slice(0, 1_500_000);
    return { ok: r.ok, status: r.status, finalUrl: r.url, html, ms: Date.now() - start };
  } finally { clearTimeout(t); }
}

function analyzeHtml(html, finalUrl) {
  const issues = [];
  const lower = html.toLowerCase();
  const year = new Date().getFullYear();

  if (!/<meta[^>]+name=["']?viewport/i.test(html)) issues.push({ w: 30, label: 'Pas adapté au mobile (aucune balise viewport)' });
  if (!finalUrl.startsWith('https://')) issues.push({ w: 15, label: 'Pas de HTTPS (« Non sécurisé » dans le navigateur)' });

  const cr = [...html.matchAll(/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/gi)].map((m) => Number(m[1])).filter((y) => y > 1995 && y <= year);
  if (cr.length) {
    const last = Math.max(...cr);
    if (year - last >= 3) issues.push({ w: 15, label: `Copyright figé en ${last}` });
  }
  const jq = html.match(/jquery[.-]?(1\.\d+(?:\.\d+)?)/i);
  if (jq) issues.push({ w: 10, label: `jQuery ${jq[1]} (technologie de plus de 10 ans)` });
  if (/\.swf\b|shockwave-flash/i.test(html)) issues.push({ w: 25, label: 'Contenu Flash (ne s’affiche plus nulle part)' });
  if (/<font[\s>]|<center>|<marquee/i.test(html)) issues.push({ w: 15, label: 'Balises HTML des années 90 (<font>, <center>…)' });
  const tables = (lower.match(/<table/g) || []).length;
  if (tables >= 4 && !/<(nav|section|header|footer)/i.test(html)) issues.push({ w: 10, label: 'Mise en page en tableaux' });
  const gen = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)/i);
  if (gen && /frontpage|dreamweaver|iweb|wordpress [2-4]\./i.test(gen[1])) issues.push({ w: 15, label: `Construit avec ${gen[1]}` });
  if (!/<title>[^<]{3,}/i.test(html)) issues.push({ w: 5, label: 'Pas de titre de page (mauvais pour Google)' });
  if (!/<meta[^>]+name=["']description/i.test(html)) issues.push({ w: 5, label: 'Pas de méta-description (mauvais pour Google)' });
  if (/under construction|en construction|coming soon|bientôt disponible|site en maintenance/i.test(html)) issues.push({ w: 30, label: 'Page « en construction »' });
  if (/domain (is )?for sale|ce domaine est à vendre|parked|sedoparking|godaddy\.com\/park/i.test(html)) issues.push({ w: 45, label: 'Domaine parqué ou à vendre' });
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length < 300) issues.push({ w: 15, label: 'Presque aucun contenu texte' });
  return issues;
}

async function auditBusiness(b) {
  const at = new Date().toISOString();
  if (!b.website) {
    return { at, verdict: 'absent', score: 95, issues: [{ w: 95, label: 'Aucun site web connu' }], status: null, ms: null, finalUrl: null };
  }
  if (SOCIAL.test(b.website)) {
    return { at, verdict: 'absent', score: 85, issues: [{ w: 85, label: 'Seulement une page réseau social ou un mini-site gratuit' }], status: null, ms: null, finalUrl: b.website };
  }
  let res;
  try {
    res = await fetchWithTimeout(b.website);
  } catch (e) {
    // Réessai en HTTPS / HTTP selon le cas
    const alt = b.website.startsWith('http://') ? b.website.replace('http://', 'https://') : b.website.replace('https://', 'http://');
    try { res = await fetchWithTimeout(alt); } catch (e2) {
      const why = e2.name === 'AbortError' ? 'Le site ne répond pas (délai dépassé)' : `Le site ne charge pas (${e2.cause?.code || e2.message})`;
      return { at, verdict: 'cassé', score: 90, issues: [{ w: 90, label: why }], status: null, ms: null, finalUrl: b.website };
    }
  }
  if (!res.ok) {
    return { at, verdict: 'cassé', score: 88, issues: [{ w: 88, label: `Erreur ${res.status} à l’ouverture` }], status: res.status, ms: res.ms, finalUrl: res.finalUrl };
  }
  const issues = analyzeHtml(res.html, res.finalUrl);
  if (res.ms > 6000) issues.push({ w: 10, label: `Lent : ${(res.ms / 1000).toFixed(1)} s pour charger` });
  const score = Math.min(80, issues.reduce((s, i) => s + i.w, 0));
  const verdict = score >= 30 ? 'dépassé' : 'correct';
  return { at, verdict, score, issues, status: res.status, ms: res.ms, finalUrl: res.finalUrl };
}

// Exécute les audits avec une concurrence limitée et rapporte la progression.
async function auditAll(list, onEach, concurrency = 6) {
  let i = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (i < list.length) {
      const b = list[i++];
      let audit;
      try { audit = await auditBusiness(b); } catch (e) { audit = { at: new Date().toISOString(), verdict: 'cassé', score: 85, issues: [{ w: 85, label: e.message }] }; }
      await onEach(b, audit);
    }
  });
  await Promise.all(workers);
}

module.exports = { auditBusiness, auditAll, analyzeHtml };
