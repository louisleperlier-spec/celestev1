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
const fns = ['allowed', 'rankFor', 'buildPlan', 'mkItem', 'workSec', 'estMin', 'exKcal', 'sesKcal', 'prog', 'progWeek', 'progFactor', 'recoCoach']
  .map((n) => grab(js.indexOf('function ' + n + '(')))
  .join('\n');

const src = `${data}
let S, NOW;
const coach = () => COACHES.find((c) => c.id === S.coach);
const lvlN = () => ({ deb: 1, int: 2, adv: 3 })[S.level];
const Date_ = Date;
Date = class extends Date_ { static now() { return NOW; } };
${fns}
module.exports = { run(state, now) { S = state; NOW = now; return { plan: buildPlan(), reco: recoCoach() }; } };`;

const m = { exports: {} };
Function('module', 'exports', src)(m, m.exports);
module.exports = m.exports;
