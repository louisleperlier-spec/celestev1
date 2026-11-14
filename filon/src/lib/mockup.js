// Étape 3 — Maquetter : lance Claude Code ou Codex (l'abonnement de l'utilisateur, sur sa machine),
// surveille le dossier, contrôle la maquette sur téléphone / tablette / ordinateur,
// et renvoie le verdict à l'agent jusqu'à ce que la maquette passe.
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const VIEWPORTS = [
  { key: 'mobile', label: 'Téléphone', width: 390, height: 844 },
  { key: 'tablet', label: 'Tablette', width: 820, height: 1180 },
  { key: 'desktop', label: 'Ordinateur', width: 1440, height: 900 },
];

const AGENTS = {
  claude: {
    label: 'Claude Code',
    bin: 'claude',
    args: (msg) => ['-p', msg, '--permission-mode', 'acceptEdits', '--allowedTools', 'Read,Write,Edit,Glob'],
  },
  codex: {
    label: 'Codex (ChatGPT)',
    bin: 'codex',
    args: (msg) => ['exec', '--full-auto', '--skip-git-repo-check', msg],
  },
};

function detectAgents() {
  const check = (bin) => new Promise((resolve) => {
    execFile(bin, ['--version'], { shell: process.platform === 'win32', timeout: 15000 }, (err, stdout) => {
      resolve(err ? { installed: false } : { installed: true, version: String(stdout).trim().split('\n')[0] });
    });
  });
  return Promise.all(Object.entries(AGENTS).map(async ([k, a]) => [k, { label: a.label, ...(await check(a.bin)) }]))
    .then(Object.fromEntries);
}

function briefFor(b, campaign) {
  const audit = b.audit || {};
  return `# Maquette de site web — ${b.name}

Tu crées une **maquette de site vitrine** pour un commerce local, qui servira à lui vendre un nouveau site.

## Le commerce
- Nom : ${b.name}
- Type : ${b.category}
- Adresse : ${b.address || '(inconnue)'} — ${b.city || campaign.city}
- Téléphone : ${b.phone || '(inconnu)'}
- Courriel : ${b.email || '(inconnu)'}
- Site actuel : ${b.website || 'aucun'}
- Diagnostic du site actuel : ${audit.verdict || 'non noté'} — ${(audit.issues || []).map((i) => i.label).join(' ; ') || 'rien à signaler'}

## Ce que tu livres
Un seul fichier **index.html** dans ce dossier, autonome :
- HTML + CSS dans le même fichier (JS minimal, optionnel). Aucune dépendance locale.
- Polices Google Fonts autorisées. Images : dégradés, formes CSS, SVG en ligne ou https://images.unsplash.com (thème du commerce). Pas d'image locale.
- Langue : français. Ton chaleureux, local, crédible. N'invente pas d'avis clients chiffrés ni de prix ; mets des textes génériques plausibles.
- Sections : en-tête avec nom + appel à l'action (Appeler / Réserver / Itinéraire), présentation, services ou menu type, horaires (« à confirmer »), carte/adresse, contact, pied de page.
- Le numéro de téléphone doit être un lien tel:.
- Design moderne et propre, adapté au type de commerce. Pas un gabarit générique.
- **Responsive impératif** : aucun débordement horizontal à 390 px, 820 px et 1440 px, texte ≥ 14 px sur mobile, boutons ≥ 44 px de haut.

Écris le fichier, puis arrête-toi. Ne pose pas de question.
`;
}

function runAgent(agentKey, cwd, message, onLog, signal) {
  const a = AGENTS[agentKey];
  if (!a) return Promise.reject(new Error('Agent inconnu'));
  return new Promise((resolve, reject) => {
    const child = spawn(a.bin, a.args(message), { cwd, shell: process.platform === 'win32', env: process.env });
    const log = fs.createWriteStream(path.join(cwd, 'agent.log'), { flags: 'a' });
    const onData = (d) => { log.write(d); onLog && onLog(String(d)); };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    const kill = () => child.kill();
    signal && signal.addEventListener('abort', kill);
    const timer = setTimeout(kill, 15 * 60 * 1000);
    child.on('error', (e) => { clearTimeout(timer); log.end(); reject(new Error(`Impossible de lancer « ${a.bin} » : ${e.message}`)); });
    child.on('close', (code) => {
      clearTimeout(timer); log.end();
      signal && signal.removeEventListener('abort', kill);
      if (signal && signal.aborted) return reject(new Error('Annulé'));
      code === 0 ? resolve() : reject(new Error(`${a.label} s’est arrêté (code ${code}). Voir agent.log.`));
    });
  });
}

// Charge index.html dans une fenêtre invisible à chaque taille d'écran et mesure les problèmes.
async function verify(dir) {
  const { BrowserWindow } = require('electron');
  const index = path.join(dir, 'index.html');
  if (!fs.existsSync(index)) return { pass: false, results: [], problems: ['index.html est absent du dossier.'] };

  const results = [];
  const problems = [];
  for (const vp of VIEWPORTS) {
    const win = new BrowserWindow({ show: false, width: vp.width, height: vp.height, useContentSize: true, enableLargerThanScreen: true, webPreferences: { offscreen: true, javascript: true } });
    try {
      win.setContentSize(vp.width, vp.height);
      await Promise.race([win.loadFile(index), new Promise((r) => setTimeout(r, 15000))]);
      await new Promise((r) => setTimeout(r, 1500)); // polices / images
      const m = await win.webContents.executeJavaScript(`(() => {
        const vw = window.innerWidth, out = [];
        const docW = document.documentElement.scrollWidth;
        document.querySelectorAll('body *').forEach((el) => {
          const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
          if (cs.position === 'fixed' || cs.display === 'none' || cs.visibility === 'hidden' || r.width === 0) return;
          if (r.right > vw + 2 && out.length < 5 && !el.closest('[style*="overflow"]')) out.push((el.tagName + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')).toLowerCase());
        });
        const small = [...document.querySelectorAll('p, li, a, span, td, label')].filter((el) => {
          const fs = parseFloat(getComputedStyle(el).fontSize); return el.innerText && el.innerText.trim().length > 15 && fs < 13;
        }).length;
        const brokenImgs = [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length;
        const tel = !!document.querySelector('a[href^="tel:"]');
        const text = document.body ? document.body.innerText.trim().length : 0;
        return { docW, vw, overflowing: out, small, brokenImgs, tel, text, height: document.documentElement.scrollHeight };
      })()`);
      const img = await win.webContents.capturePage();
      const shot = path.join(dir, `capture-${vp.key}.png`);
      fs.writeFileSync(shot, img.toPNG());

      const p = [];
      if (m.docW > m.vw + 2) p.push(`débordement horizontal (page de ${m.docW}px pour un écran de ${m.vw}px${m.overflowing.length ? ', éléments : ' + m.overflowing.join(', ') : ''})`);
      if (vp.key === 'mobile' && m.small > 3) p.push(`${m.small} blocs de texte sous 13px`);
      if (m.brokenImgs) p.push(`${m.brokenImgs} image(s) cassée(s)`);
      if (m.text < 400) p.push('presque pas de contenu');
      if (vp.key === 'mobile' && !m.tel) p.push('aucun lien tel: pour appeler');
      results.push({ ...vp, shot, metrics: m, problems: p });
      p.forEach((x) => problems.push(`[${vp.label} ${vp.width}px] ${x}`));
    } finally {
      win.destroy();
    }
  }
  return { pass: problems.length === 0, results, problems };
}

async function buildMockup({ business, campaign, dir, agent, maxRounds = 3, onProgress, signal }) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'BRIEF.md'), briefFor(business, campaign));
  const rounds = [];
  let msg = 'Lis le fichier BRIEF.md dans ce dossier et crée index.html en suivant exactement les consignes.';
  for (let n = 1; n <= maxRounds; n++) {
    onProgress && onProgress({ phase: 'agent', round: n, text: `Tour ${n} : ${AGENTS[agent].label} travaille…` });
    await runAgent(agent, dir, msg, (t) => onProgress && onProgress({ phase: 'log', text: t }), signal);
    onProgress && onProgress({ phase: 'verify', round: n, text: `Tour ${n} : contrôle téléphone / tablette / ordinateur…` });
    const v = await verify(dir);
    rounds.push({ n, at: new Date().toISOString(), pass: v.pass, problems: v.problems });
    if (v.pass) return { status: 'ok', rounds, results: v.results, dir };
    fs.writeFileSync(path.join(dir, 'CONTROLE.md'), `# Verdict du contrôle (tour ${n}) : à corriger\n\n${v.problems.map((p) => '- ' + p).join('\n')}\n\nCorrige index.html pour régler chaque point, sans casser le reste. Les captures sont dans capture-*.png.\n`);
    msg = 'La maquette index.html n’a pas passé le contrôle. Lis CONTROLE.md et corrige index.html. Rappel des consignes dans BRIEF.md.';
    if (n === maxRounds) return { status: 'à revoir', rounds, results: v.results, dir };
  }
}

module.exports = { detectAgents, buildMockup, verify, VIEWPORTS, AGENTS };
