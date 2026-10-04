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

const hrObj = grab(js.indexOf('const HR='));
const extra = ['hrStats', 'todayQuests'].map((n) => grab(js.indexOf('function ' + n + '('))).join('\n');
const sommeil = ['baseHrv', 'sleepScore', 'lastNight', 'recovStatus'].map((n) => grab(js.indexOf('function ' + n + '('))).join('\n');
const notifTick = grab(js.indexOf('function notifTick('));
const veloFns = ['hav', 'proj'].map((n) => grab(js.indexOf('function ' + n + '('))).join('\n');
const hmFn = js.slice(js.indexOf('const hm='), js.indexOf(';', js.indexOf('return h*60+m')) + 1);
const quests = js.slice(js.indexOf('const QUESTS='), js.indexOf(';', js.indexOf('const QUESTS=')) + 1);
const hashFn = js.slice(js.indexOf('const hash='), js.indexOf(';', js.indexOf('return h/9973')) + 1);

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
${hrObj}
${extra}
${quests}
${hashFn}
${sommeil}
${hmFn}
${veloFns}
${notifTick}
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
let SORTIE = [];
const notify = (n) => SORTIE.push(n);
const dayKey = () => new Date().toISOString().slice(0, 10);
module.exports = {
  coeur(age, random, steps) {
    S = { age }; const r0 = Math.random; Math.random = random;
    HR.bpm = 64; HR.rr = []; HR.src = 'sim'; HR.intensity = .05; HR.fatigue = 0;
    const out = [];
    for (const [intensity, fatigue] of steps) { if (fatigue != null) HR.fatigue = fatigue; HR.intensity = intensity; HR.tick(); out.push([HR.bpm, HR.rr.slice(-3), HR.rmssd(), HR.zone()]); }
    Math.random = r0; return out;
  },
  stats(age, samples, rr) { S = { age }; return hrStats(samples, rr); },
  sommeil(nights, hrvChecks, now) {
    S = { nights, hrvChecks }; NOW = now;
    const ln = lastNight();
    return { base: baseHrv(), ln, score: sleepScore(ln), recup: [20, 35, 40, 45, 50, 60, 80].map((h) => recovStatus(h)) };
  },
  hm(s) { return hm(s); },
  notifs(etat, now) {
    S = { onboarded: true, ...JSON.parse(JSON.stringify(etat)) }; NOW = now; SORTIE = [];
    notifTick();
    return { notifs: SORTIE, pending: S.pending, lastWake: S.lastWake, lastBed: S.lastBed };
  },
  velo(a, b, pts) { return { d: hav(a, b), p: proj(pts) }; },
  quetes(now) { NOW = now; S = { quests: null }; return todayQuests(); },
  run(state, now) { S = state; NOW = now; return { plan: buildPlan(), reco: recoCoach() }; },
  cat(state, id) { S = state; return catSession(CAT.find((w) => w.id === id), null); },
  load(state, now, it) { S = state; NOW = now; return loadFor(it); },
  streak(state, now) { S = state; NOW = now; return streak(); },
  lvl(xp) { return [lvlInfo(xp), rankOf(lvlInfo(xp).n)]; },
};`;

const m = { exports: {} };
Function('module', 'exports', src)(m, m.exports);
module.exports = m.exports;
