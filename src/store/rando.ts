/**
 * Randonnée en cours (non sauvegardée) : GPS réel avec l'altitude (dénivelé mesuré), sinon parcours simulé au pas de marche
 * (altitude simulée, pour essayer sans GPS). FC du cœur simulé, qui suit la montre si elle mesure. L'horloge tourne même si on quitte l'écran.
 * Fin : journal (`rando`), XP, Apple Santé (randonnée), rappel VFC, territoires (vrai GPS), carte « Explorateur » du sentier.
 */
import * as Location from 'expo-location';
import { create } from 'zustand';

import { toast } from '@/components/ui/Toast';
import { coeur, hrStats, type StatsFC } from '@/lib/coeur';
import { badgesRando, caloriesRando, denivele, profilMesure, xpRando, type Badge, type PointAlt } from '@/lib/rando';
import { enregistrerEntrainement } from '@/lib/sante';
import { casesTrace } from '@/lib/territoires';
import { ajouterPoint, simDepart, type Pt, type Sim } from '@/lib/velo';

import { arreterMontre, suivreMontre } from './montre';
import { useProfil } from './profil';
import { trouverSentier as sentier } from './randosPres';
import { conquerirTrace } from './territoires';

export type ResultatRando = {
  sentier?: string;
  km: number;
  sec: number;
  dplus: number;
  altMax: number;
  cal: number;
  st: StatsFC;
  profil: PointAlt[];
  badges: Badge[];
  /** Carte « Explorateur » gagnée (premier passage sur ce sentier). */
  carte: boolean;
  /** Sommet : au moins 60 % du dénivelé du sentier, ou 100 m sans sentier. */
  sommet: boolean;
  xp: number;
  cases: number;
  debut: string;
};

type Rando = {
  run: boolean;
  paused: boolean;
  el: number;
  pts: Pt[];
  /** Altitude par point (km parcourus, m). */
  alts: PointAlt[];
  dist: number;
  dplus: number;
  alt: number | null;
  gps: 'gps' | 'sim' | null;
  sim: Sim | null;
  hr: number[];
  rrs: number[];
  bpm: number;
  sentier?: string;
  debut: string;
  res: ResultatRando | null;
};

type Actions = {
  demarrer: (sentier?: string) => void;
  pause: () => void;
  terminer: () => ResultatRando | null;
};

const age = () => useProfil.getState().age;
let horloge: ReturnType<typeof setInterval> | null = null;
let suivi: Location.LocationSubscription | null = null;
let attente: ReturnType<typeof setTimeout> | null = null;

const arreterGps = () => {
  suivi?.remove();
  suivi = null;
  if (attente) clearTimeout(attente);
  attente = null;
};

export const useRando = create<Rando & Actions>()((set, get) => {
  const ajouter = (pt: Pt, alt: number | null) => {
    const v = get();
    const { pts, dist } = ajouterPoint(v.pts, v.dist, pt);
    if (pts.length === v.pts.length) return set({ alt: alt ?? v.alt });
    const alts = alt != null ? [...v.alts, { km: +dist.toFixed(3), alt: Math.round(alt) }] : v.alts;
    set({ pts, dist, alts, alt: alt ?? v.alt, dplus: denivele(alts.map((a) => a.alt)) });
  };

  const repli = () => {
    if (get().gps !== 'gps' && get().run) {
      const s = sentier(get().sentier);
      set({ gps: 'sim', sim: s ? { lat: s.lat, lng: s.lng, h: Math.random() * 6.28 } : simDepart() });
    }
  };

  const gps = async () => {
    attente = setTimeout(() => {
      if (!get().gps) repli();
    }, 8000);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return repli();
      suivi = await Location.watchPositionAsync({ accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 0 }, (p) => {
        const v = get();
        if (!v.run || v.paused) return;
        if (v.gps !== 'gps') set({ gps: 'gps', sim: null });
        const alt = p.coords.altitude != null && (p.coords.altitudeAccuracy ?? 0) < 30 ? p.coords.altitude : null;
        ajouter([p.coords.latitude, p.coords.longitude], alt);
      });
      if (!get().run) arreterGps();
    } catch {
      repli();
    }
  };

  const tick = () => {
    const v = get();
    const hr = coeur(age());
    if (v.run && !v.paused) {
      if (v.gps === 'sim' && v.sim) {
        // Pas de marche simulé (~4,5 km/h) et altitude qui monte puis redescend.
        const h = v.sim.h + (Math.random() - 0.5) * 0.3;
        const m = (4.2 + Math.random() * 0.8) / 3.6;
        const lat = v.sim.lat + (Math.cos(h) * m) / 110540;
        const lng = v.sim.lng + (Math.sin(h) * m) / (111320 * Math.cos((lat * Math.PI) / 180));
        const s = sentier(v.sentier);
        const base = s?.altDepart ?? 200;
        const haut = (s?.altSommet ?? base + 300) - base;
        const x = Math.min(1, v.dist / (s?.km ?? 6));
        set({ sim: { lat, lng, h } });
        ajouter([lat, lng], base + haut * (1 - Math.abs(2 * x - 1)) + Math.sin(v.el / 7) * 1.5);
      }
      // Montée : effort plus intense.
      const pente = v.alts.length > 3 ? v.alts[v.alts.length - 1].alt - v.alts[v.alts.length - 4].alt : 0;
      hr.intensity = Math.min(0.85, Math.max(0.35, 0.45 + pente / 40));
      hr.tick();
      const rrs = [...v.rrs, ...hr.rr.slice(-Math.max(1, Math.round(hr.bpm / 60)))];
      set({ el: get().el + 1, hr: [...v.hr, hr.bpm], rrs, bpm: Math.round(hr.bpm) });
    } else {
      hr.intensity = 0.05;
      hr.tick();
      set({ bpm: Math.round(hr.bpm) });
    }
  };

  return {
    run: false,
    paused: false,
    el: 0,
    pts: [],
    alts: [],
    dist: 0,
    dplus: 0,
    alt: null,
    gps: null,
    sim: null,
    hr: [],
    rrs: [],
    bpm: Math.round(coeur(age()).bpm),
    debut: '',
    res: null,
    demarrer: (id) => {
      set({ run: true, paused: false, el: 0, pts: [], alts: [], dist: 0, dplus: 0, alt: null, gps: null, sim: null, hr: [], rrs: [], sentier: id, debut: new Date().toISOString(), res: null });
      if (horloge) clearInterval(horloge);
      horloge = setInterval(tick, 1000);
      suivreMontre();
      gps();
    },
    pause: () => set({ paused: !get().paused }),
    terminer: () => {
      arreterGps();
      arreterMontre();
      if (horloge) clearInterval(horloge);
      horloge = null;
      const v = get();
      set({ run: false, paused: false });
      if (v.el < 60) {
        toast('Rando trop courte, non enregistrée');
        return null;
      }
      const p = useProfil.getState();
      const s = sentier(v.sentier);
      const st = hrStats(v.hr, v.rrs, p.age);
      const cal = caloriesRando(v.el, p.weight, v.dplus);
      const fin = new Date().toISOString();
      const premiere = !p.logs.some((l) => l.type === 'rando');
      const sommet = s ? v.dplus >= s.dplus * 0.6 : v.dplus >= 100;
      p.addLog({ d: fin, debut: v.debut, type: 'rando', title: s?.nom ?? 'Randonnée', min: Math.max(1, Math.round(v.el / 60)), cal, vol: 0, dist: +v.dist.toFixed(1), dplus: v.dplus, rando: s?.id, sommet, hrAvg: st.avg, hrMax: st.max, hrv: st.hrv });
      const xp = useProfil.getState().addXp(xpRando(v.dist, v.dplus), 'Randonnée');
      useProfil.getState().programmerPost('rando', st.hrv);
      enregistrerEntrainement({ type: 'rando', debut: new Date(v.debut), fin: new Date(), kcal: cal, km: v.dist });
      // Carte Explorateur : premier sommet de ce sentier.
      let carte = false;
      // Carte Explorateur : seulement pour les sentiers de la collection (pas ceux d'OpenStreetMap).
      if (s && sommet && !s.source) {
        const id = `rando:${s.id}` as const;
        const jeu = useProfil.getState().jeu;
        carte = !(jeu.cartes[id] ?? 0);
        useProfil.setState({ jeu: { ...jeu, cartes: { ...jeu.cartes, [id]: (jeu.cartes[id] ?? 0) + 1 } } });
      }
      let cases = 0;
      if (v.gps === 'gps' && v.pts.length > 1) {
        cases = casesTrace(v.pts).length;
        void conquerirTrace(v.pts, fin);
      }
      const res: ResultatRando = {
        sentier: s?.id,
        km: v.dist,
        sec: v.el,
        dplus: v.dplus,
        altMax: v.alts.reduce((a, x) => Math.max(a, x.alt), 0),
        cal,
        st,
        profil: profilMesure(v.alts),
        badges: badgesRando({ dplus: v.dplus, km: v.dist, debut: new Date(v.debut), premiere }),
        carte,
        sommet,
        xp,
        cases,
        debut: v.debut,
      };
      set({ res });
      return res;
    },
  };
});
