/**
 * Sortie vélo en cours (objet `V` du prototype), non sauvegardée : GPS réel ou parcours simulé,
 * stationnaire selon la résistance, FC simulée. L'horloge tourne même si on quitte l'onglet.
 * Mode `course` (hors prototype) : course à pied au GPS. Les sorties dehors au vrai GPS conquièrent des territoires.
 */
import * as Location from 'expo-location';
import { create } from 'zustand';

import { toast } from '@/components/ui/Toast';
import { coeur, hrStats, type SourceFC, type StatsFC } from '@/lib/coeur';
import { enregistrerEntrainement } from '@/lib/sante';
import { casesTrace } from '@/lib/territoires';
import {
  ajouterPoint,
  caloriesCourse,
  caloriesVelo,
  intensiteVelo,
  pasSimule,
  simDepart,
  vitesseStationnaire,
  xpCourse,
  xpVelo,
  type Pt,
  type Sim,
} from '@/lib/velo';

import { arreterMontre, suivreMontre } from './montre';
import { useProfil } from './profil';
import { conquerirTrace, type Conquete } from './territoires';

export type ModeVelo = 'ext' | 'int' | 'course';
/** Source du tracé : GPS réel, simulation, ou pas encore connue. */
export type Gps = 'gps' | 'sim' | null;

export type ResultatVelo = {
  dist: number;
  sec: number;
  hr: number[];
  st: StatsFC;
  cal: number;
  start: Pt | null;
  end: Pt | null;
  gps: Gps;
  mode: ModeVelo;
  xp?: number;
  /** Territoires : cases traversées (vrai GPS) et résultat du serveur (null tant qu'il n'a pas répondu ou sans compte). */
  cases?: number;
  conquete?: Conquete | null;
};

type Velo = {
  mode: ModeVelo;
  run: boolean;
  paused: boolean;
  el: number;
  pts: Pt[];
  dist: number;
  spd: number;
  lvl: number;
  hr: number[];
  rrs: number[];
  gps: Gps;
  sim: Sim | null;
  res: ResultatVelo | null;
  /** Valeurs en direct (livePills, zones). */
  bpm: number;
  zone: number;
  hrv: number;
  src: SourceFC;
};

type Actions = {
  setMode: (m: ModeVelo) => void;
  setLvl: (n: number) => void;
  demarrer: () => void;
  pause: () => void;
  terminer: () => void;
  /** FC au repos affichée hors sortie (l'horloge globale du prototype). */
  tickRepos: () => void;
};

const age = () => useProfil.getState().age;

let horloge: ReturnType<typeof setInterval> | null = null;
let suivi: Location.LocationSubscription | null = null;
let attente: ReturnType<typeof setTimeout> | null = null;

const live = () => {
  const hr = coeur(age());
  return { bpm: hr.bpm, zone: hr.zone(), hrv: hr.rmssd(), src: hr.src };
};

export const useVelo = create<Velo & Actions>()((set, get) => {
  /** GPS indisponible ou refusé : parcours simulé (fallback du prototype). */
  const repli = () => {
    if (get().gps !== 'gps' && get().run) set({ gps: 'sim', sim: simDepart() });
  };

  const arreterGps = () => {
    suivi?.remove();
    suivi = null;
    if (attente) clearTimeout(attente);
    attente = null;
  };

  const gpsExterieur = async () => {
    attente = setTimeout(() => {
      if (!get().gps) repli();
    }, 6000);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return repli();
      suivi = await Location.watchPositionAsync({ accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 0 }, (p) => {
        const v = get();
        if (!v.run || v.paused) return;
        const { pts, dist } = ajouterPoint(v.pts, v.dist, [p.coords.latitude, p.coords.longitude]);
        const spd = p.coords.speed != null && p.coords.speed >= 0 ? p.coords.speed * 3.6 : v.spd;
        set({ gps: 'gps', pts, dist, spd });
      });
      // Arrêté entre-temps (Terminer pendant la demande d'autorisation).
      if (!get().run) arreterGps();
    } catch {
      repli();
    }
  };

  /** Une seconde de sortie (bikeTick). */
  const tick = () => {
    const v = get();
    const hr = coeur(age());
    if (v.run && !v.paused) {
      let { spd, dist, pts, sim } = v;
      if (v.mode === 'int') {
        spd = vitesseStationnaire(v.lvl);
        dist += spd / 3600;
      } else if (v.gps === 'sim' && sim) {
        ({ sim, spd, pts, dist } = pasSimule(sim, spd, pts, dist, Math.random, v.mode === 'course'));
      }
      hr.intensity = v.mode === 'course' ? Math.min(0.95, Math.max(0.4, spd / 13)) : intensiteVelo(v.mode === 'int' ? 'int' : 'ext', v.lvl, spd);
      hr.tick();
      // Mêmes battements que la séance : les derniers ajoutés par tick() (correction du bug RR du prototype).
      const rrs = [...v.rrs, ...hr.rr.slice(-Math.max(1, Math.round(hr.bpm / 60)))];
      set({ el: v.el + 1, spd, dist, pts, sim, hr: [...v.hr, hr.bpm], rrs, ...live() });
    } else {
      hr.intensity = 0.05;
      hr.tick();
      set(live());
    }
  };

  return {
    mode: 'ext',
    run: false,
    paused: false,
    el: 0,
    pts: [],
    dist: 0,
    spd: 0,
    lvl: 5,
    hr: [],
    rrs: [],
    gps: null,
    sim: null,
    res: null,
    ...live(),
    setMode: (mode) => {
      if (!get().run) set({ mode });
    },
    setLvl: (lvl) => set({ lvl }),
    demarrer: () => {
      set({ run: true, paused: false, el: 0, pts: [], dist: 0, spd: 0, hr: [], rrs: [], res: null, gps: null, sim: null });
      if (horloge) clearInterval(horloge);
      horloge = setInterval(tick, 1000);
      suivreMontre();
      if (get().mode !== 'int') gpsExterieur();
    },
    pause: () => set({ paused: !get().paused }),
    tickRepos: () => {
      if (!get().run) tick();
    },
    /** Fin de sortie (bikeStop) : enregistrée à partir de 30 s, XP 30 + 4/km, quête vélo dès 5 km ou 20 min. */
    terminer: () => {
      arreterGps();
      arreterMontre();
      if (horloge) clearInterval(horloge);
      horloge = null;
      const v = get();
      const p = useProfil.getState();
      const st = hrStats(v.hr, v.rrs, p.age);
      const min = Math.max(1, Math.round(v.el / 60));
      const course = v.mode === 'course';
      const cal = course ? caloriesCourse(v.dist, p.weight) : caloriesVelo(v.dist, v.el, p.weight);
      const res: ResultatVelo = { dist: v.dist, sec: v.el, hr: v.hr, st, cal, end: v.pts[v.pts.length - 1] ?? null, start: v.pts[0] ?? null, gps: v.gps, mode: v.mode };
      const fin = new Date().toISOString();
      if (v.el >= 30) {
        const titre = course ? 'Course' : v.mode === 'ext' ? 'Sortie vélo' : 'Vélo stationnaire';
        p.addLog({ d: fin, type: course ? 'course' : 'velo', title: titre, min, cal, vol: 0, dist: +v.dist.toFixed(1), hrAvg: st.avg, hrMax: st.max, hrv: st.hrv });
        const g = useProfil.getState().addXp(course ? xpCourse(v.dist) : xpVelo(v.dist), course ? 'Course' : 'Vélo');
        res.xp = g;
        if (!course && (v.dist >= 5 || v.el >= 1200)) useProfil.getState().quest('velo');
        coeur(p.age).fatigue = 0.7;
        useProfil.getState().programmerPost(course ? 'course' : 'velo', st.hrv);
        enregistrerEntrainement({ type: course ? 'course' : 'velo', debut: new Date(Date.now() - v.el * 1000), fin: new Date(), kcal: cal, km: v.dist });
        toast((course ? 'Course enregistrée : +' : 'Sortie enregistrée : +') + g + ' XP');
        // Territoires : seulement avec la vraie position (jamais le parcours simulé).
        if (v.gps === 'gps' && v.pts.length > 1) {
          res.cases = casesTrace(v.pts).length;
          res.conquete = null;
          conquerirTrace(v.pts, fin).then((c) => {
            const r = get().res;
            if (c && r && r === res) set({ res: { ...r, conquete: c } });
          });
        }
      } else toast('Sortie trop courte, non enregistrée');
      set({ run: false, paused: false, res });
    },
  };
});
