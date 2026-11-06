const { chromium } = require('playwright');
const out = process.argv[2];
const now = new Date();
const jour = (k, h = 18) => { const d = new Date(now); d.setDate(d.getDate() - k); d.setHours(h, 10, 0, 0); return d; };
const iso = (d) => d.toISOString();
const jl = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const titres = ['Push : pecs, épaules, triceps', 'Pull : dos, biceps', 'Jambes et fessiers', 'Full body'];
const logs = [];
for (const k of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]) logs.push({ d: iso(jour(k)), type: 'muscu', title: titres[k % 4], min: 38 + (k % 4) * 4, cal: 260 + (k % 5) * 25, vol: 4200 + k * 90, hrAvg: 128, hrMax: 162, ex: 6 });
logs.push({ d: iso(jour(4, 8)), type: 'course', title: 'Course', min: 32, cal: 340, vol: 0, dist: 5.4 });
logs.push({ d: iso(jour(11, 9)), type: 'velo', title: 'Vélo', min: 55, cal: 480, vol: 0, dist: 21.3 });
logs.sort((a, b) => a.d < b.d ? 1 : -1);
const nights = Array.from({ length: 21 }, (_, k) => ({ d: iso(jour(k, 7)), h: 7 + ((k * 37) % 10) / 10, q: 3 + (k % 2), hrv: 52 + ((k * 13) % 11), rhr: 54 + (k % 4) }));
const wlog = Array.from({ length: 8 }, (_, k) => ({ d: jl(jour(k * 3)), kg: +(72.4 + k * 0.25).toFixed(1) }));
const state = {
  onboarded: true, coach: 'axel', goals: ['masse', 'forme'], level: 'int', gear: 'salle', days: 4, dur: 45, name: 'Léa', weight: 72.4, age: 27,
  progs: {}, progStart: iso(jour(17, 9)), logs, nights, wlog, xp: 1240,
  avisFini: true, noteDemandes: [Date.now()],
  ressentis: [{ d: jl(now), t: +jour(0, 8), energie: 4, sommeil: 3, courbatures: 1 }],
};
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3 });
  await p.goto('http://localhost:8124/bienvenue');
  await p.evaluate((s) => { localStorage.setItem('nea2', JSON.stringify({ state: s, version: 0 })); localStorage.setItem('nea-accueil-cartes-masquees', '["bienvenue"]'); }, state);
  const shot = async (url, nom, fn) => {
    await p.goto('http://localhost:8124' + url); await p.waitForTimeout(3200);
    if (fn) await fn();
    await p.screenshot({ path: `${out}/${nom}.png` });
  };
  await shot('/accueil', 'accueil', async () => { await p.waitForTimeout(7000); });
  await shot('/accueil', 'accueil2', async () => { await p.mouse.move(200, 500); await p.mouse.wheel(0, 520); await p.waitForTimeout(1200); });
  await shot('/programme', 'programme');
  await shot('/programme', 'programme2', async () => { await p.mouse.move(200, 500); await p.mouse.wheel(0, 420); await p.waitForTimeout(1200); });
  await shot('/programme?vue=calendrier', 'calendrier', async () => { await p.mouse.move(200, 500); await p.mouse.wheel(0, 230); await p.waitForTimeout(1200); });
  await shot('/progres', 'progres', async () => { await p.getByText('Statistiques', { exact: true }).first().click(); await p.waitForTimeout(1500); });
  await shot('/progres', 'progres2', async () => { await p.getByText('Statistiques', { exact: true }).first().click(); await p.waitForTimeout(800); await p.mouse.move(200, 500); await p.mouse.wheel(0, 640); await p.waitForTimeout(1200); });
  await shot('/profil', 'profil');
  await shot('/plus', 'plus');
  await shot('/noter', 'noter');
  await b.close();
})().catch((e) => { console.error(e.message.slice(0, 300)); process.exit(1); });
