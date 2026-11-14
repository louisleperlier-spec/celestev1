// Sur Mac, une app lancée depuis le Finder n'hérite pas du PATH du terminal :
// `claude` et `codex` (installés via npm/brew) seraient introuvables. On le récupère.
const { execFileSync } = require('child_process');

function fixPath() {
  if (process.platform === 'win32') return;
  try {
    const shell = process.env.SHELL || '/bin/zsh';
    const out = execFileSync(shell, ['-ilc', 'echo "__P__$PATH__P__"'], { encoding: 'utf8', timeout: 5000 });
    const m = out.match(/__P__(.*)__P__/);
    if (m && m[1]) process.env.PATH = m[1];
  } catch (_) { /* on garde le PATH existant */ }
  const extra = ['/opt/homebrew/bin', '/usr/local/bin', `${process.env.HOME}/.local/bin`, `${process.env.HOME}/.npm-global/bin`];
  const parts = new Set((process.env.PATH || '').split(':'));
  for (const p of extra) if (!parts.has(p)) process.env.PATH += `:${p}`;
}

module.exports = { fixPath };
