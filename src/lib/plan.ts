/**
 * Générateur de programme personnel et calculs associés.
 * Portage fidèle du prototype (`prototype/nea-app.html`, section « Générateur de programme personnel ») :
 * `allowed`, `rankFor`, `buildPlan`, `mkItem`, `workSec`, `estMin`, `exKcal`, `sesKcal`,
 * `prog`, `progWeek`, `progFactor`, `hrMax`, `recoCoach`, `nextSession`.
 * Les fonctions sont pures : l'état de l'utilisateur est passé en paramètre (`Profil`).
 * N'importe pas `@/data` (qui charge les images) pour rester exécutable hors de l'app.
 */
import { COACHES } from '@/data/coaches';
import { EXERCICES } from '@/data/exercices';
import { PROGRAMMES } from '@/data/programmes';
import { GEAR } from '@/data/referentiels';
import { DAYSPOS, SPECIAL, TEMPLATES } from '@/data/templates';
import type {
  Coach,
  CoachId,
  Exercice,
  ExerciceId,
  GoalId,
  JoursParSemaine,
  LieuOnboarding,
  Programme,
  ProgrammeId,
  TemplateId,
} from '@/data/types';

export type NiveauId = 'deb' | 'int' | 'adv';
export type Jours = 2 | 3 | 4 | 5 | 6 | 7;
export type Duree = 20 | 30 | 45 | 60;

/** Ce dont le générateur a besoin (sous-ensemble de l'état `S` du prototype). */
export type Profil = {
  coach: CoachId;
  goals: readonly GoalId[];
  level: NiveauId;
  gear: LieuOnboarding;
  days: Jours;
  dur: Duree;
  weight: number;
  age: number;
  /** Programme choisi pour chaque coach (sinon le premier). */
  progs: Partial<Record<CoachId, ProgrammeId>>;
  /** Début du programme (ISO). */
  progStart: string;
};

/** Coach avec les réglages du programme en cours appliqués. */
export type CoachEffectif = Coach;

export type PlanItem = {
  id: ExerciceId;
  sets: number;
  /** Repos en secondes. */
  rest: number;
  /** Fourchette de répétitions, ou… */
  reps?: [number, number];
  /** …durée d'effort en secondes. */
  sec?: number;
  /** Tempo (séances du catalogue uniquement ; sinon celui du coach). */
  tempo?: string;
};

export type PlanSession = {
  key: TemplateId;
  titre: string;
  items: PlanItem[];
  /** Jour de la semaine, 0 = lundi. */
  day: number;
  /** Durée estimée en minutes. */
  min: number;
  kcal: number;
};

export type Plan = {
  sessions: PlanSession[];
  notes: string[];
  c: CoachEffectif;
};

export const LVLN = ['Débutant', 'Intermédiaire', 'Avancé'] as const;

const EX: Readonly<Record<ExerciceId, Exercice & { idx: number }>> = Object.fromEntries(
  EXERCICES.map((e, idx) => [e.id, { ...e, idx }]),
) as Record<ExerciceId, Exercice & { idx: number }>;

export const exercice = (id: ExerciceId) => EX[id];
export const coachById = (id: CoachId): Coach => COACHES.find((c) => c.id === id) ?? COACHES[0];

export const lvlN = (level: NiveauId): 1 | 2 | 3 => ({ deb: 1, int: 2, adv: 3 } as const)[level];

/** FC max, formule de Tanaka. */
export const hrMax = (age: number) => Math.round(208 - 0.7 * age);

/** Programme en cours du coach choisi (le premier par défaut). */
export function prog(p: Pick<Profil, 'coach' | 'progs'>): Programme {
  const list = PROGRAMMES[p.coach];
  return list.find((x) => x.id === p.progs[p.coach]) ?? list[0];
}

/** Semaine du programme (1 à sa durée). */
export function progWeek(p: Profil, now: number = Date.now()): number {
  const pr = prog(p);
  const w = Math.floor((now - new Date(p.progStart).getTime()) / (7 * 864e5)) + 1;
  return Math.min(pr.sem, Math.max(1, w));
}

/** +2,5 % de charge par semaine, décharge à −15 % la dernière semaine des programmes de 6 semaines et plus. */
export function progFactor(p: Profil, now: number = Date.now()): number {
  const pr = prog(p);
  const w = progWeek(p, now);
  return w === pr.sem && pr.sem >= 6 ? 0.85 : 1 + 0.025 * (w - 1);
}

function allowed(e: Exercice, c: CoachEffectif, p: Profil): boolean {
  if (!GEAR[p.gear].includes(e.materiel)) return false;
  if (e.niveau > lvlN(p.level)) return false;
  if (c.noBar && e.materiel === 'bar') return false;
  return true;
}

function rankFor(c: CoachEffectif): (id: ExerciceId) => number {
  const r: Partial<Record<ExerciceId, number>> = {};
  c.fav.forEach((id, i) => (r[id] = i));
  return (id) => r[id] ?? 100 + EX[id].idx;
}

/** Exercice avec séries, reps ou durée et repos, selon le style du coach et le niveau (L = 0, 1 ou 2). */
export function mkItem(id: ExerciceId, c: CoachEffectif, L: number, finisher = false): PlanItem {
  const e = EX[id];
  const it: PlanItem = { id, sets: c.sets[L], rest: c.rest };
  if (e.groupe === 'cardio' && e.id === 'velo_stationnaire') {
    it.sets = 1;
    it.sec = finisher ? 600 : c.id === 'kai' ? 900 : 600;
    it.rest = 60;
  } else if (c.time) {
    it.sec = c.time;
    it.rest = c.rest;
  } else if (e.type === 'time') {
    it.sec = [30, 45, 60][L];
    it.rest = Math.min(c.rest, 60);
  } else it.reps = [c.reps[0], c.reps[1]];
  if (finisher && e.id !== 'velo_stationnaire') {
    it.sets = 3;
    it.sec = 40;
    it.rest = 20;
    delete it.reps;
  }
  return it;
}

/** Temps d'effort d'une série, en secondes. */
export function workSec(it: PlanItem, c: CoachEffectif): number {
  return it.sec || ((it.reps![0] + it.reps![1]) / 2) * c.rep_s;
}

/** Durée estimée d'une séance, en minutes (5 min d'échauffement incluses). */
export function estMin(s: Pick<PlanSession, 'items'>, c: CoachEffectif): number {
  return Math.round(5 + s.items.reduce((a, it) => a + it.sets * (workSec(it, c) + it.rest), 0) / 60);
}

/** Calories d'un exercice : séries × (MET × poids × effort + 2 × poids × repos) / 3600. */
export function exKcal(it: PlanItem, weight: number): number {
  const e = EX[it.id];
  const ws = it.sec || ((it.reps![0] + it.reps![1]) / 2) * 3;
  return Math.max(1, Math.round((it.sets * (e.met * weight * ws + 2 * weight * it.rest)) / 3600));
}

/** Calories d'une séance (échauffement inclus). */
export function sesKcal(s: Pick<PlanSession, 'items'>, weight: number): number {
  return Math.round(s.items.reduce((a, it) => a + exKcal(it, weight), 0) + (4 * weight * 5) / 60);
}

/** Génère le programme de la semaine. */
export function buildPlan(p: Profil, now: number = Date.now()): Plan {
  const c0 = coachById(p.coach);
  const pr = prog(p);
  const c: CoachEffectif = {
    ...c0,
    reps: pr.reps || c0.reps,
    rest: pr.rest || c0.rest,
    sets: pr.sets || c0.sets,
    time: pr.time || c0.time,
  };
  const rank = rankFor(c);
  const L = lvlN(p.level) - 1;
  const days = String(p.days) as JoursParSemaine;
  const pos = DAYSPOS[days];
  const split: readonly TemplateId[] = pr.tpls
    ? [...Array(p.days)].map((_, i) => pr.tpls![i % pr.tpls!.length])
    : c.split[days];
  const used: Record<string, number> = {};
  const notes: string[] = [];

  const sessions: PlanSession[] = split.map((tk, si) => {
    const [titre, slots] = TEMPLATES[tk];
    const inS = new Set<ExerciceId>();
    const items: PlanItem[] = [];
    slots.forEach((g) => {
      let pool: ExerciceId[];
      if (g[0] === '@') pool = SPECIAL[g.slice(1) as keyof typeof SPECIAL].filter((id) => allowed(EX[id], c, p));
      else
        pool = EXERCICES.filter((e) => e.groupe === g && allowed(e, c, p))
          .map((e) => e.id)
          .sort((a, b) => rank(a) - rank(b));
      pool = pool.filter((id) => !inS.has(id));
      if (!pool.length) return;
      const k = used[g] || 0;
      used[g] = k + 1;
      const id = g[0] === '@' ? pool[0] : pool[k % pool.length];
      inS.add(id);
      items.push(mkItem(id, c, L));
    });
    return { key: tk, titre, items, day: pos[si], min: 0, kcal: 0 };
  });

  // Adaptations selon les objectifs
  const fin: ExerciceId = allowed(EX.velo_stationnaire, c, p) ? 'velo_stationnaire' : 'mountain_climbers';
  if ((p.goals.includes('poids') || p.goals.includes('endu')) && !['kai', 'luna'].includes(c.id)) {
    sessions.forEach((s) => {
      if (!s.items.some((i) => EX[i.id].groupe === 'cardio')) s.items.push(mkItem(fin, c, L, true));
    });
    notes.push('Finisher cardio ajouté pour ' + (p.goals.includes('poids') ? 'la perte de poids' : "l'endurance"));
  }
  if (p.goals.includes('mental')) {
    sessions.forEach((s) => {
      if (!s.items.some((i) => i.id === 'bird_dog')) s.items.push(mkItem('bird_dog', c, L));
    });
    notes.push('Retour au calme en fin de séance pour le mental');
  }
  if (p.goals.includes('masse') && ['axel', 'blaze', 'rex'].includes(c.id)) {
    sessions.forEach((s) =>
      s.items.slice(0, 2).forEach((i) => {
        if (i.sets && i.sets < 5) i.sets++;
      }),
    );
    notes.push('+1 série sur les exercices principaux pour la masse');
  }
  const w = progWeek(p, now);
  notes.unshift(
    `${pr.nom} • semaine ${w}/${pr.sem}` +
      (w === pr.sem && pr.sem >= 6
        ? ' (décharge)'
        : w > 1
          ? ` (charges +${Math.round((progFactor(p, now) - 1) * 100)} %)`
          : ''),
  );
  if (p.level === 'deb') notes.push('Exercices avancés remplacés par des variantes accessibles');
  notes.push(
    {
      maison: 'Uniquement poids du corps et haltères',
      salle: 'Barres, machines et poulies incluses',
      deux: 'Mélange maison et salle',
    }[p.gear],
  );
  if (p.dur) {
    sessions.forEach((s) => {
      while (s.items.length > 3 && estMin(s, c) > p.dur + 4) s.items.splice(s.items.length - 2, 1);
    });
    notes.push('Séances ajustées à ≈ ' + p.dur + ' min');
  }
  sessions.forEach((s) => {
    s.min = estMin(s, c);
    s.kcal = sesKcal(s, p.weight);
  });
  return { sessions, notes, c };
}

/** Jour de la semaine, 0 = lundi. */
export const todayIdx = (d: Date = new Date()) => (d.getDay() + 6) % 7;

/** Prochaine séance à partir d'aujourd'hui. */
export function nextSession(plan: Plan, today: number = todayIdx()): { s: PlanSession; offset: number } {
  for (let k = 0; k < 7; k++) {
    const s = plan.sessions.find((x) => x.day === (today + k) % 7);
    if (s) return { s, offset: k };
  }
  return { s: plan.sessions[0], offset: 0 };
}

/** Coach recommandé selon les objectifs (et le niveau). */
export function recoCoach(goals: readonly GoalId[], level: NiveauId): CoachId {
  const sc: Record<CoachId, number> = { axel: 0, nova: 0, kai: 0, luna: 0, blaze: 0, rex: 0 };
  const m: Record<GoalId, (CoachId | number)[]> = {
    masse: ['axel', 3, 'rex', 1],
    poids: ['luna', 2, 'kai', 2],
    forme: ['nova', 2, 'luna', 1],
    endu: ['kai', 3],
    mental: ['nova', 3],
    disc: ['rex', 2, 'axel', 1],
    conf: ['blaze', 2, 'axel', 1],
  };
  goals.forEach((g) => {
    const a = m[g] || [];
    for (let i = 0; i < a.length; i += 2) sc[a[i] as CoachId] += a[i + 1] as number;
  });
  if (level === 'deb') sc.nova += 0.5;
  return (Object.entries(sc) as [CoachId, number][]).sort((a, b) => b[1] - a[1])[0][0];
}
