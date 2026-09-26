/**
 * Séance en cours (objet `W` du prototype) : séries, reps, minuteur, repos, chrono,
 * FC simulée, XP et fin de séance. Chaque action produit un nouvel état (pas de mutation),
 * pour que l'affichage se mette toujours à jour.
 */
import { create } from 'zustand';

import type { ExerciceId } from '@/data/types';
import { loadFor } from '@/lib/charges';
import { coeur, hrStats, type StatsFC } from '@/lib/coeur';
import { actifsEquipe } from '@/lib/ligue';
import { coachById, exercice, exKcal, type PlanItem } from '@/lib/plan';
import type { SeanceJour } from '@/lib/semaine';
import { boosts, mult, streak } from '@/lib/xp';

import { autresActifs } from './ligue';
import { selectProfil, useProfil } from './profil';

export type Phase = 'ready' | 'work' | 'rest' | 'done';

export type Resultat = {
  min: number;
  sec: number;
  cal: number;
  vol: number;
  st: StatsFC;
  sets: number;
  /** Multiplicateur d'XP au moment de la séance. */
  m: number;
  xp: number;
  /** FC à chaque seconde, pour la courbe. */
  hr: number[];
};

export type Seance = {
  s: SeanceJour;
  ex: number;
  set: number;
  reps: number;
  done: number[][];
  elapsed: number;
  paused: boolean;
  phase: Phase;
  left: number;
  vol: number;
  kc: number;
  xp: number;
  hr: number[];
  rrs: number[];
  nextMsg?: string;
  tip?: string;
  res?: Resultat;
  /** Dernières valeurs du cœur simulé, pour l'affichage. */
  bpm: number;
  zone: number;
  hrv: number;
};

type Store = {
  w: Seance | null;
  lancer: (s: SeanceJour) => void;
  /** Une seconde : chrono, minuteur, repos, FC (setInterval du prototype). */
  tick: () => void;
  /** Bouton principal : terminer la série, lancer le chrono, exercice suivant, terminer. */
  principal: () => void;
  reps: (delta: 1 | -1) => void;
  choisirSerie: (i: number) => void;
  passerRepos: () => void;
  pause: () => void;
  quitter: () => void;
};

const startPhase = (it: PlanItem): Phase => (it.sec ? 'ready' : 'work');

const ctx = () => {
  const st = useProfil.getState();
  const p = selectProfil(st);
  return { st, p, c: coachById(p.coach), hr: coeur(p.age) };
};

const snap = (w: Seance): Seance => {
  const { hr } = ctx();
  return { ...w, bpm: hr.bpm, zone: hr.zone(), hrv: hr.rmssd() };
};

function pickTip(id: ExerciceId): string {
  const e = exercice(id);
  const t = [`Rappel : ${e.erreur.charAt(0).toLowerCase() + e.erreur.slice(1)} À éviter.`, e.etapes[1], ctx().c.daily];
  return t[Math.floor(Math.random() * t.length)];
}

function finish(w: Seance): Seance {
  const { st: st0, p, c, hr } = ctx();
  const sec = w.elapsed;
  const min = Math.max(1, Math.round(sec / 60));
  const st = hrStats(w.hr, w.rrs, p.age);
  const cal = Math.round(c.int * 9 * p.weight * (Math.max(sec, 60) / 3600));
  const res: Resultat = { min, sec, cal: w.kc > 0 ? Math.round(w.kc) : cal, vol: Math.round(w.vol), st, sets: w.done.flat().length, m: 1, xp: 0, hr: w.hr };
  st0.addLog({ d: new Date().toISOString(), type: 'muscu', title: w.s.titre, min, cal: res.cal, vol: res.vol, hrAvg: st.avg, hrMax: st.max, hrv: st.hrv });
  const apres = useProfil.getState();
  const serie = streak(apres.logs, apres.days);
  res.m = mult(boosts(serie, apres.boostUntil, actifsEquipe(autresActifs(), apres.logs)));
  const xp = w.xp + apres.addXp(40 + 5 * Math.min(10, serie), 'Séance');
  res.xp = xp;
  apres.quest('seance');
  // VFC de fin : les 2 dernières minutes (schedulePost du prototype).
  useProfil.getState().programmerPost('muscu', hrStats(w.hr.slice(-120), w.rrs.slice(-150), p.age).hrv || st.hrv);
  hr.fatigue = Math.min(1, 0.4 + c.int * 0.6);
  return { ...w, xp, res, phase: 'done' };
}

function endSet(w0: Seance): Seance {
  const { st, p } = ctx();
  const w = { ...w0, done: w0.done.map((d) => [...d]) };
  const it = w.s.items[w.ex];
  if (!w.done[w.ex].includes(w.set)) {
    w.done[w.ex].push(w.set);
    w.kc += exKcal(it, p.weight) / it.sets;
    w.vol += it.reps ? w.reps * (loadFor(it, p).kg || 0) : 0;
    w.xp += st.addXp(2, 'Série');
  }
  const next = [...Array(it.sets).keys()].find((i) => !w.done[w.ex].includes(i));
  if (next === undefined) {
    if (w.ex < w.s.items.length - 1) {
      const n = w.s.items[w.ex + 1];
      return {
        ...w,
        ex: w.ex + 1,
        set: 0,
        reps: n.reps ? n.reps[1] : 0,
        nextMsg: 'Prochain : ' + exercice(n.id).nom,
        tip: exercice(n.id).etapes[0],
        phase: 'rest',
        left: Math.max(it.rest, 45),
      };
    }
    return finish(w);
  }
  return { ...w, set: next, nextMsg: 'Série ' + (next + 1) + ' sur ' + it.sets, tip: pickTip(it.id), phase: 'rest', left: it.rest };
}

export const useSeance = create<Store>()((set, get) => {
  const maj = (f: (w: Seance) => Seance) => {
    const w = get().w;
    if (w) set({ w: f(w) });
  };
  return {
    w: null,
    lancer: (s) =>
      set({
        w: snap({
          s,
          ex: 0,
          set: 0,
          reps: s.items[0].reps ? s.items[0].reps[1] : 0,
          done: s.items.map(() => []),
          elapsed: 0,
          paused: false,
          phase: startPhase(s.items[0]),
          left: 0,
          vol: 0,
          kc: 0,
          xp: 0,
          hr: [],
          rrs: [],
          bpm: 0,
          zone: 1,
          hrv: 0,
        }),
      }),
    tick: () =>
      maj((w0) => {
        if (w0.phase === 'done') return w0;
        const { c, hr } = ctx();
        let w = w0;
        hr.intensity = w.paused ? 0.12 : w.phase === 'work' ? c.int : w.phase === 'rest' ? 0.3 : 0.25;
        if (!w.paused) {
          w = { ...w, elapsed: w.elapsed + 1, hr: [...w.hr, hr.bpm] };
          if (w.phase === 'work' && w.s.items[w.ex].sec) {
            w = { ...w, left: w.left - 1 };
            if (w.left <= 0) w = endSet(w);
          } else if (w.phase === 'rest') {
            w = { ...w, left: w.left - 1 };
            if (w.left <= 0) w = { ...w, phase: startPhase(w.s.items[w.ex]) };
          }
        }
        hr.tick();
        // tick() ajoute round(bpm / 60) battements à la fin de rr. Le prototype les prenait avec
        // rr.slice(longueur avant), ce qui ne renvoie plus rien une fois sa mémoire de 300 RR pleine.
        if (!w.paused && w.phase !== 'done') w = { ...w, rrs: [...w.rrs, ...hr.rr.slice(-Math.max(1, Math.round(hr.bpm / 60)))] };
        return snap(w);
      }),
    principal: () =>
      maj((w) => {
        const it = w.s.items[w.ex];
        if (w.done[w.ex].length >= it.sets) {
          if (w.ex < w.s.items.length - 1) {
            const n = w.s.items[w.ex + 1];
            return { ...w, ex: w.ex + 1, set: 0, reps: n.reps ? n.reps[1] : 0, phase: startPhase(n) };
          }
          return finish(w);
        }
        if (it.sec && w.phase !== 'work') return { ...w, phase: 'work', left: it.sec };
        return endSet(w);
      }),
    reps: (delta) => maj((w) => ({ ...w, reps: Math.max(1, Math.min(30, w.reps + delta)) })),
    choisirSerie: (i) => maj((w) => ({ ...w, set: i, phase: startPhase(w.s.items[w.ex]) })),
    passerRepos: () => maj((w) => ({ ...w, phase: startPhase(w.s.items[w.ex]) })),
    pause: () => maj((w) => ({ ...w, paused: !w.paused })),
    quitter: () => set({ w: null }),
  };
});
