/**
 * Charge la logique d'origine de `prototype/nea-app.html` (sans DOM) pour servir de référence
 * à `comparer-plan.ts` : données + buildPlan, mkItem, estMin, sesKcal, recoCoach…
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../prototype/nea-app.html'), 'utf8');
const js = html.slice(html.indexOf('<script>') + 8);

function grab(start) {
  let j = start;
  while (js[j] !== '{') j++;
  let d = 0;
  let s = null;
  for (let k = j; k < js.length; k++) {
    const ch = js[k];
    if (s) {
      if (ch === '\\') k++;
      else if (ch === s) s = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') s = ch;
    else if (ch === '{') d++;
    else if (ch === '}' && !--d) return js.slice(start, k + 1);
  }
  throw new Error('Fonction introuvable');
}

const data = js.slice(js.indexOf('const NAMES='), js.indexOf('const GOALF='));
const fns = ['allowed', 'rankFor', 'buildPlan', 'mkItem', 'workSec', 'estMin', 'exKcal', 'sesKcal', 'prog', 'progWeek', 'progFactor', 'recoCoach', 'catSession', 'loadFor', 'streak', 'lvlInfo']
  .map((n) => grab(js.indexOf('function ' + n + '(')))
  .join('\n');

const src = `${data}
let S, NOW;
const coach = () => COACHES.find((c) => c.id === S.coach);
const lvlN = () => ({ deb: 1, int: 2, adv: 3 })[S.level];
const hrMax = () => Math.round(208 - 0.7 * S.age);
const dec = (n) => String(n).replace('.', ',');
const RANKS = [['Bronze','#cd7f4f'],['Argent','#c9ced8'],['Or','#ffcc3d'],['Platine','#6fe3d6'],['Diamant','#8fb3ff']];
const rankOf = (n) => RANKS[Math.min(4, Math.floor((n - 1) / 5))];
const Date_ = Date;
Date = class extends Date_ { constructor(...a) { if (a.length) super(...a); else super(NOW); } static now() { return NOW; } };
${fns}
module.exports = {
  run(state, now) { S = state; NOW = now; return { plan: buildPlan(), reco: recoCoach() }; },
  cat(state, id) { S = state; return catSession(CAT.find((w) => w.id === id), null); },
  load(state, now, it) { S = state; NOW = now; return loadFor(it); },
  streak(state, now) { S = state; NOW = now; return streak(); },
  lvl(xp) { return [lvlInfo(xp), rankOf(lvlInfo(xp).n)]; },
};`;

const m = { exports: {} };
Function('module', 'exports', src)(m, m.exports);
module.exports = m.exports;
