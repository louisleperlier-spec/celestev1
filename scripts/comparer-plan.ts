/// <reference types="node" />
/**
 * Compare `buildPlan` et `recoCoach` (src/lib/plan.ts) à la logique d'origine du prototype
 * sur tous les coachs × programmes × niveaux × lieux × jours × durées (objectifs, poids et semaine variés).
 *
 * Lancer : npm run comparer-plan
 */
import { COACHES } from '../src/data/coaches';
import { PROGRAMMES } from '../src/data/programmes';
import { GOALS } from '../src/data/referentiels';
import { buildPlan, recoCoach, type Profil } from '../src/lib/plan';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const prototype = require('./prototype-plan.cjs') as {
  run: (state: Profil, now: number) => { plan: { sessions: unknown; notes: unknown }; reco: string };
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
            const ref = prototype.run({ ...p, goals: [...goals] }, NOW);
            const a = JSON.stringify([plan.sessions, plan.notes, recoCoach(goals, level)]);
            const b = JSON.stringify([ref.plan.sessions, ref.plan.notes, ref.reco]);
            total++;
            if (a !== b && differences++ < 3) console.log('Différence :', JSON.stringify(p), '\n  app       ', a.slice(0, 300), '\n  prototype ', b.slice(0, 300));
          }

console.log(`${total} profils comparés au prototype : ${differences} différence(s).`);
if (differences) process.exit(1);
