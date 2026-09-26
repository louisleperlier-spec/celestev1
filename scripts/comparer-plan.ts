/// <reference types="node" />
/**
 * Compare la logique de l'app à celle d'origine du prototype : buildPlan et recoCoach sur tous les
 * coachs × programmes × niveaux × lieux × jours × durées (objectifs, poids et semaine variés),
 * loadFor (charges), catSession (séances du catalogue × intensité), streak, lvlInfo/rankOf.
 *
 * Lancer : npm run comparer-plan
 */
import { COACHES } from '../src/data/coaches';
import { PROGRAMMES } from '../src/data/programmes';
import { GOALS } from '../src/data/referentiels';
import { SEANCES } from '../src/data/seances';
import { loadFor } from '../src/lib/charges';
import { buildPlan, recoCoach, type PlanItem, type Profil } from '../src/lib/plan';
import { catSession, type Intensite } from '../src/lib/semaine';
import { Coeur, hrStats } from '../src/lib/coeur';
import { baseHrv, hm, lastNight, recovStatus, sleepScore, type MesureVFC, type Nuit } from '../src/lib/sommeil';
import { hav, proj, type Pt } from '../src/lib/velo';
import { notifsDues, type EtatNotifs } from '../src/lib/notifs';
import { lvlInfo, rankOf, streak, todayQuests, type Log } from '../src/lib/xp';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const prototype = require('./prototype-plan.cjs') as {
  run: (state: Profil, now: number) => { plan: { sessions: unknown; notes: unknown }; reco: string };
  cat: (state: object, id: string) => unknown;
  load: (state: Profil, now: number, it: PlanItem) => unknown;
  streak: (state: object, now: number) => number;
  lvl: (xp: number) => unknown;
  coeur: (age: number, random: () => number, steps: [number, number | null][]) => unknown;
  stats: (age: number, samples: number[], rr: number[]) => unknown;
  quetes: (now: number) => unknown;
  sommeil: (nights: Nuit[], checks: MesureVFC[], now: number) => unknown;
  hm: (s: string) => number;
  velo: (a: Pt, b: Pt, pts: Pt[]) => unknown;
  notifs: (etat: EtatNotifs, now: number) => unknown;
};

const NIVEAUX = ['deb', 'int', 'adv'] as const;
const LIEUX = ['maison', 'salle', 'deux'] as const;
const JOURS = [2, 3, 4, 5, 6, 7] as const;
const DUREES = [20, 30, 45, 60] as const;
const NOW = Date.parse('2026-09-25T12:00:00Z');

let graine = 1;
const alea = () => (graine = (graine * 9301 + 49297) % 233280) / 233280;

let total = 0;
let differences = 0;
const parFonction: Record<string, { total: number; diff: number }> = {};
function compter(nom: string, a: unknown, b: unknown, contexte: unknown) {
  const r = (parFonction[nom] ??= { total: 0, diff: 0 });
  r.total++;
  if (JSON.stringify(a) !== JSON.stringify(b) && r.diff++ < 3)
    console.log(`Différence ${nom} :`, JSON.stringify(contexte), '\n  app       ', JSON.stringify(a).slice(0, 300), '\n  prototype ', JSON.stringify(b).slice(0, 300));
}
for (const c of COACHES)
  for (const pr of PROGRAMMES[c.id])
    for (const level of NIVEAUX)
      for (const gear of LIEUX)
        for (const days of JOURS)
          for (const dur of DUREES) {
            const goals = GOALS.map((g) => g[0]).filter(() => alea() < 0.3);
            const semaines = Math.floor(alea() * 10);
            const p: Profil = {
              coach: c.id,
              goals,
              level,
              gear,
              days,
              dur,
              weight: 50 + Math.round(alea() * 80),
              age: 20 + Math.round(alea() * 40),
              progs: { [c.id]: pr.id },
              progStart: new Date(NOW - semaines * 7 * 864e5 - 3600e3).toISOString(),
            };
            const plan = buildPlan(p, NOW);
            // Charge conseillée de chaque exercice du plan
            for (const se of plan.sessions)
              for (const it of se.items) {
                compter('loadFor', loadFor(it, p, NOW), prototype.load({ ...p, goals: [...goals] }, NOW, it), p);
              }
            const ref = prototype.run({ ...p, goals: [...goals] }, NOW);
            const a = JSON.stringify([plan.sessions, plan.notes, recoCoach(goals, level)]);
            const b = JSON.stringify([ref.plan.sessions, ref.plan.notes, ref.reco]);
            total++;
            if (a !== b && differences++ < 3) console.log('Différence :', JSON.stringify(p), '\n  app       ', a.slice(0, 300), '\n  prototype ', b.slice(0, 300));
          }

// Séances du catalogue : 41 séances × 3 intensités × 4 poids, et leurs charges
for (const w of SEANCES)
  for (const mod of [-1, 0, 1] as Intensite[])
    for (const weight of [45, 62.5, 80, 120]) {
      const mine = catSession(w, null, weight, mod);
      const ref = prototype.cat({ weight, wkMod: { [w.id]: mod } }, w.id);
      compter('catSession', mine, ref, { id: w.id, mod, weight });
      for (const level of NIVEAUX) {
        const p: Profil = { coach: 'axel', goals: [], level, gear: 'salle', days: 4, dur: 45, weight, age: 30, progs: {}, progStart: new Date(NOW - 3 * 7 * 864e5).toISOString() };
        for (const it of mine.items) compter('loadFor (catalogue)', loadFor(it, p, NOW), prototype.load(p, NOW, it), p);
      }
    }

// Série de jours sur des historiques aléatoires
for (let k = 0; k < 300; k++) {
  const days = JOURS[k % 6];
  const logs: Log[] = [];
  for (let j = 0; j < 30; j++)
    if (alea() < 0.5) logs.push({ d: new Date(NOW - j * 864e5 - alea() * 3600e3).toISOString(), type: 'muscu', title: '', min: 30, cal: 200, vol: 0 });
  compter('streak', streak(logs, days, new Date(NOW)), prototype.streak({ logs, days }, NOW), { days });
}

// Niveaux et rangs
for (let xp = 0; xp < 20000; xp += 37) compter('lvlInfo', [lvlInfo(xp), rankOf(lvlInfo(xp).n)], prototype.lvl(xp), { xp });

// FC simulée : même suite aléatoire pour les deux, intensités et fatigue variées
const graineAlea = (g: number) => () => (g = (g * 16807) % 2147483647) / 2147483647;
for (let k = 0; k < 40; k++) {
  const age = 16 + k * 2;
  const steps: [number, number | null][] = [];
  for (let t = 0; t < 400; t++) steps.push([[0.05, 0.12, 0.25, 0.3, 0.55, 0.72, 0.86][Math.floor(t / 60) % 7], t === 200 ? 0.8 : null]);
  const mien = new Coeur(age, graineAlea(k + 1));
  const res: unknown[] = [];
  const samples: number[] = [];
  for (const [intensity, fatigue] of steps) {
    if (fatigue != null) mien.fatigue = fatigue;
    mien.intensity = intensity;
    mien.tick();
    samples.push(mien.bpm);
    res.push([mien.bpm, mien.rr.slice(-3), mien.rmssd(), mien.zone()]);
  }
  compter('FC simulée (tick)', res, prototype.coeur(age, graineAlea(k + 1), steps), { age });
  compter('hrStats', hrStats(samples, mien.rr, age), prototype.stats(age, samples, mien.rr), { age });
}

// Quêtes du jour sur 2 ans
for (let j = 0; j < 730; j++) {
  const t = Date.parse('2026-01-01T12:00:00Z') + j * 864e5;
  compter('quêtes du jour', todayQuests(null, new Date(t)), prototype.quetes(t), { jour: j });
}

// Sommeil : score, dernière nuit, VFC de référence, état de récupération
for (let k = 0; k < 400; k++) {
  const now = NOW + Math.floor(alea() * 30) * 864e5 + Math.floor(alea() * 24) * 36e5;
  const nights: Nuit[] = [];
  const nb = Math.floor(alea() * 8);
  for (let i = nb; i >= 0; i--) {
    const d = new Date(now - (i + Math.floor(alea() * 3)) * 864e5).toISOString().slice(0, 10);
    nights.push({ d, h: Math.round((4 + alea() * 6) * 10) / 10, q: 1 + Math.floor(alea() * 5), hrv: alea() < 0.3 ? null : 20 + Math.floor(alea() * 80), rhr: null });
  }
  nights.sort((a, b) => (a.d < b.d ? -1 : 1));
  const checks: MesureVFC[] = [...Array(Math.floor(alea() * 4))].map(() => ({ d: new Date(now).toISOString(), hrv: 15 + Math.floor(alea() * 90), bpm: 60, kind: alea() < 0.5 ? 'matin' : 'post' }));
  const base = baseHrv(nights, checks);
  const ln = lastNight(nights, new Date(now));
  const mien = { base, ln, score: sleepScore(ln, base), recup: [20, 35, 40, 45, 50, 60, 80].map((h) => recovStatus(h, base)) };
  compter('sommeil', mien, prototype.sommeil(nights, checks, now), { k });
}
for (const t of ['22:30', '07:30', '00:05', '23:59']) compter('hm', hm(t), prototype.hm(t), { t });

// Vélo : distance entre deux points GPS et projection du tracé
for (let k = 0; k < 300; k++) {
  const a: Pt = [45 + alea() * 2, -74 + alea() * 2];
  const pts: Pt[] = [...Array(1 + Math.floor(alea() * 20))].map(() => [a[0] + (alea() - 0.5) * 0.05, a[1] + (alea() - 0.5) * 0.05] as Pt);
  compter('vélo (hav, proj)', { d: hav(a, pts[0]), p: proj(pts) }, prototype.velo(a, pts[0], pts), { k });
}

// Notifications dues (notifTick) : rappels VFC, bilan de nuit, coucher, à toute heure de la journée
for (let k = 0; k < 600; k++) {
  const now = NOW + Math.floor(alea() * 96) * 15 * 60000;
  const nights: Nuit[] = alea() < 0.5 ? [] : [{ d: new Date(now - 864e5 * Math.floor(alea() * 3)).toISOString().slice(0, 10), h: 7.4, q: 4, hrv: alea() < 0.5 ? null : 52, rhr: null }];
  const hh = () => String(Math.floor(alea() * 24)).padStart(2, '0') + ':' + ['00', '15', '30', '45'][Math.floor(alea() * 4)];
  const etat: EtatNotifs = {
    nset: { post: alea() < 0.8, delay: [0.1, 5, 10, 30, 60][Math.floor(alea() * 5)], sleep: alea() < 0.8, wake: hh(), bed: alea() < 0.8, bedT: hh() },
    pending: [...Array(Math.floor(alea() * 3))].map(() => ({ at: now + (alea() - 0.5) * 36e5, type: 'post' as const, kind: alea() < 0.5 ? ('velo' as const) : ('muscu' as const), endHrv: alea() < 0.5 ? null : 30 + Math.floor(alea() * 40) })),
    lastWake: alea() < 0.3 ? new Date(now).toISOString().slice(0, 10) : null,
    lastBed: null,
    nights,
    hrvChecks: [],
  };
  const mien = notifsDues(etat, new Date(now));
  const proto = prototype.notifs(etat, now) as { notifs: object[] };
  compter('notifications', { ...mien, notifs: mien.notifs }, { ...proto, notifs: proto.notifs }, { k });
}

for (const [k, v] of Object.entries(parFonction)) console.log(`  ${k.padEnd(20)} ${v.total} cas, ${v.diff} différence(s)`);
console.log(`${total} profils comparés au prototype : ${differences} différence(s) sur buildPlan.`);
const autres = Object.values(parFonction).reduce((a, v) => a + v.diff, 0);
if (differences || autres) process.exit(1);
