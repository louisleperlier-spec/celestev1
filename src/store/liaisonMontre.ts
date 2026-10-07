/**
 * Liaison avec l'app Apple Watch (module natif `nea-montre`, absent dans Expo Go) :
 * l'iPhone envoie le prénom, le coach et les séances de la semaine (charges calculées) ;
 * la montre renvoie chaque séance terminée, enregistrée ici comme une séance faite sur l'iPhone
 * (journal, XP, série, quête, rappel VFC). La montre écrit elle-même l'entraînement dans Apple Santé.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { toast } from '@/components/ui';
import { cerclesJour, part, type IdCercle } from '@/lib/cercles';
import { dec, loadFor, rj } from '@/lib/charges';
import { mmss } from '@/lib/coeur';
import { COACHES, SEANCES } from '@/data';
import type { SeanceId } from '@/data/types';
import { coachById, coachValide, exercice, exKcal, hrMax, lvlN, prog, progWeek, sesKcal, todayIdx } from '@/lib/plan';
import { wkLocked } from '@/lib/premium';
import { defi, defisSemaine, possedees } from '@/lib/jeu';
import { lundiISO } from '@/lib/ligue';
import { coucherPour } from '@/lib/reveil';
import { ajouterNuit, baseHrv, heure, lastNight, nouvelleNuit, recovStatus, sleepScore } from '@/lib/sommeil';
import { casesTrace } from '@/lib/territoires';
import { caloriesCourse, caloriesVelo, xpCourse, xpVelo } from '@/lib/velo';
import { colors } from '@/theme';
import { catSession, sessionForDay, type SeanceJour, type Semaine } from '@/lib/semaine';
import { motivationDuJour } from '@/lib/motivation';
import { caloriesRando, xpRando } from '@/lib/rando';
import { serie } from '@/lib/gel';
import { lvlInfo, rankOf } from '@/lib/xp';

import { NeaMontre } from '../../modules/nea-montre/src';
import { envoyer as envoyerAuCoach } from './coach';
import { annoncer } from './notifs';
import { selectProfil, semaineDe, useProfil } from './profil';
import { gagnerExplorateur, sommetAtteint } from './rando';
import { trouverSentier } from './randosPres';
import { programmerReveil } from './reveil';
import { SONS_NUIT, useSons } from './sons';
import { conquerirTrace } from './territoires';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

/** Contrat partagé avec `targets/watch/Modeles.swift` (version 1). */
type ExoMontre = {
  id: string;
  nom: string;
  series: number;
  /** Reps visées (haut de la fourchette) et fourchette affichée ; 0 et '' pour un exercice en durée. */
  reps: number;
  repsTxt: string;
  sec: number;
  repos: number;
  /** Charge conseillée en texte (« 12 kg par haltère », « Poids du corps »…). */
  charge: string;
  /** Charge modifiable sur la montre : kg par haltère (ou total), 0 sans charge ; `double` : deux haltères. */
  kg: number;
  double: boolean;
  pas: number;
  kcal: number;
};
type SeanceMontre = { jour: number; quand: string; titre: string; min: number; kcal: number; exos: ExoMontre[] };
/** Hub de la montre : bilan du jour, dernière nuit, coach, progrès, FC max (zones du vélo). */
type BilanMontre = { effort: number; recup: number; sommeil: number; score: number; recupTxt: string };
type NuitMontre = { h: number; rhr: number; hrv: number; src: string } | null;
type CoachMontre = { nom: string; style: string; daily: string; dernier: string };
type ProgresMontre = {
  seances: number;
  objectif: number;
  serie: number;
  niveau: number;
  xp: number;
  xpNiveau: number;
  rang: string;
  derniere: string;
  /** Refonte de la montre (build 29) : meilleure série, cartes de la collection, défis de la semaine, programme suivi. */
  meilleureSerie?: number;
  cartes?: number;
  defis?: { titre: string; fait: number; but: number }[];
  programme?: { nom: string; semaine: number; total: number };
};
type EtatMontre = {
  v: 2;
  prenom: string;
  coach: string;
  semaine: SeanceMontre[];
  bilan: BilanMontre;
  nuit: NuitMontre;
  coachInfo: CoachMontre;
  progres: ProgresMontre;
  fcMax: number;
  poids: number;
  explorer: SeanceMontre[];
  coachs: { id: string; nom: string; spec: string }[];
  /** Séance choisie sur l'iPhone (« Ouvrir sur la montre ») et son programme, pour aujourd'hui (build 18). */
  choisie: SeanceMontre | null;
  choisieProg: string;
  /** Sentier choisi aujourd'hui sur l'iPhone (build 19). */
  rando: RandoMontre | null;
  /** Partie Sommeil (build 27) : réveil, coucher conseillé, nuit en cours, pluie qui joue sur l'iPhone. */
  sommeil: { reveil: string; actif: boolean; coucher: string; vibration: boolean; objectif: number; nuit: boolean; pluie: boolean; son: string };
};

/** Séance terminée sur la montre. */
type ResultatMontre = { id: string; debut: string; fin: string; titre: string; sec: number; kcal: number; fcMoy: number; fcMax: number; series: number; volume: number };
/** Sortie vélo, mesure de récupération d'1 min, message au coach (depuis la montre). */
type VeloMontre = {
  id: string;
  debut: string;
  fin: string;
  sec: number;
  km: number;
  kcal: number;
  fcMoy: number;
  fcMax: number;
  /** Build 11 : sport et tracé (territoires). */
  sport?: 'velo' | 'course' | 'rando';
  pts?: [number, number][];
  /** Build 19 : randonnée (dénivelé positif du baromètre, altitude max, sentier lancé depuis l'iPhone). */
  dplus?: number;
  altMax?: number;
  sentier?: string;
};
/** Sentier envoyé à la montre (« Ouvrir sur la montre » d'une fiche de randonnée, build 19). */
type RandoMontre = { id: string; nom: string; lieu: string; km: number; dplus: number; altSommet: number; min: number };
/** Séance choisie sur l'iPhone pour la montre : un jour de la semaine ou une séance prête, valable le jour même. */
export type ChoixMontre = { jour: number } | { cat: SeanceId };
export const useChoixMontre = create<{ choix: ChoixMontre | null; d: string; rando?: string | null; dRando?: string }>()(
  persist(() => ({ choix: null as ChoixMontre | null, d: '' }), {
    name: 'nea-montre-choix',
    storage: createJSONStorage(() => AsyncStorage),
  }),
);
const memeChoix = (a: ChoixMontre | null, b: ChoixMontre) =>
  !!a && ('jour' in a ? 'jour' in b && a.jour === b.jour : 'cat' in b && a.cat === b.cat);

type MesureMontre = { d: string; hrv: number; bpm: number };
type CoachEnvoi = { texte: string };

function etat(): EtatMontre {
  const st = useProfil.getState();
  const p = selectProfil(st);
  const sem: Semaine = semaineDe(st);
  const auj = todayIdx();
  /** Séance au format de la montre (charges calculées pour ce profil). */
  const versMontre = (s: SeanceJour, jour: number, quand: string): SeanceMontre => ({
    jour,
    quand,
    titre: s.titre,
    min: s.min,
    kcal: s.kcal,
    exos: s.items.map((it) => {
      const ch = loadFor(it, p);
      const e = exercice(it.id);
      const double = e.materiel === 'hal' && !e.uneHaltere;
      return {
        id: it.id,
        nom: e.nom,
        series: it.sets,
        reps: it.reps ? it.reps[1] : 0,
        repsTxt: it.reps ? rj(it.reps) : '',
        sec: it.sec ?? 0,
        repos: it.rest,
        charge: ch.txt,
        kg: ch.kg ? (double ? ch.kg / 2 : ch.kg) : 0,
        double,
        pas: e.materiel === 'hal' ? 1 : 2.5,
        kcal: exKcal(it, p.weight),
      };
    }),
  });
  const semaine: SeanceMontre[] = [];
  for (let i = 0; i < 7; i++) {
    const s = sessionForDay(sem, i);
    // Les sorties vélo se lancent depuis « Vélo » sur la montre.
    if (!s || s.ride || !s.items.length) continue;
    semaine.push(versMontre(s, i, i === auj ? "Aujourd'hui" : i === auj + 1 ? 'Demain' : JOURS[i]));
  }
  // « Explorer » : séances prêtes accessibles du lieu choisi, les plus proches du niveau.
  // Séance choisie aujourd'hui sur l'iPhone.
  const ch = useChoixMontre.getState();
  let choisie: SeanceMontre | null = null;
  let choisieProg = '';
  if (ch.choix && ch.d === new Date().toDateString()) {
    if ('jour' in ch.choix) {
      const s = sessionForDay(sem, ch.choix.jour);
      if (s && !s.ride && s.items.length) {
        const pr = prog(p);
        choisie = versMontre(s, ch.choix.jour, ch.choix.jour === auj ? "Aujourd'hui" : JOURS[ch.choix.jour]);
        choisieProg = `${pr.nom} · semaine ${progWeek(p)}/${pr.sem}`;
      }
    } else {
      const id = ch.choix.cat;
      const w = SEANCES.find((x) => x.id === id);
      if (w && !w.ride) {
        choisie = versMontre(catSession(w, null, st.weight, st.wkMod[w.id] ?? 0), -1, 'Séance prête');
        choisieProg = 'Séance prête';
      }
    }
  }
  // Sentier choisi aujourd'hui sur l'iPhone.
  const sr = ch.rando && ch.dRando === new Date().toDateString() ? trouverSentier(ch.rando) : undefined;
  const rando: RandoMontre | null = sr ? { id: sr.id, nom: sr.nom, lieu: sr.lieu, km: sr.km, dplus: sr.dplus, altSommet: sr.altSommet, min: sr.min } : null;
  const lieu = st.gear === 'maison' ? 'maison' : 'salle';
  const niveau = lvlN(st.level);
  const explorer = SEANCES.filter((w) => w.lieu === lieu && !w.ride && !wkLocked(w.id))
    .sort((a, b) => Math.abs(a.lvl - niveau) - Math.abs(b.lvl - niveau))
    .slice(0, 6)
    .map((w) => versMontre(catSession(w, null, st.weight, st.wkMod[w.id] ?? 0), -1, 'Séance prête'));
  // Bilan du jour (mêmes calculs que les anneaux de l'Accueil, sans l'activité Apple Santé que la montre a déjà).
  const objKcal = sem.plan.sessions.length ? sem.plan.sessions.reduce((a, x) => a + sesKcal(x, st.weight), 0) / sem.plan.sessions.length : 300;
  const jour = cerclesJour(new Date(), { logs: st.logs, nights: st.nights, hrvChecks: st.hrvChecks, objKcal, objMin: st.dur });
  const get = (id: IdCercle) => jour.find((c) => c.id === id)!;
  const base = baseHrv(st.nights, st.hrvChecks);
  const ln = lastNight(st.nights);
  const lc = st.hrvChecks[st.hrvChecks.length - 1];
  const mesureAuj = lc && new Date(lc.d).toDateString() === new Date().toDateString() ? lc : null;
  const bilan: BilanMontre = {
    effort: Math.round(((Math.min(1, part(get('bouger'))) + Math.min(1, part(get('exercice')))) / 2) * 100),
    recup: get('recup').val,
    sommeil: get('sommeil').val,
    score: sleepScore(ln, base) ?? 0,
    recupTxt: mesureAuj ? recovStatus(mesureAuj.hrv, base)[0] : get('recup').val ? 'de ta moyenne' : 'Mesure-la (1 min)',
  };
  const c = coachById(st.coach);
  const dernier = [...st.chat].reverse().find((m) => m.r === 'bot');
  const li = lvlInfo(st.xp);
  const lundi = new Date();
  lundi.setHours(0, 0, 0, 0);
  lundi.setDate(lundi.getDate() - auj);
  const der = st.logs[0];
  return {
    v: 2,
    prenom: st.name,
    coach: st.coach,
    semaine,
    bilan,
    nuit: ln ? { h: ln.h, rhr: ln.rhr ?? 0, hrv: ln.hrv ?? 0, src: ln.src === 'sante' ? 'Apple Santé' : 'NÉA' } : null,
    coachInfo: { nom: c.nom, style: c.style, daily: motivationDuJour(st.progStart, st.name), dernier: dernier?.t ?? '' },
    progres: {
      seances: st.logs.filter((l) => new Date(l.d) >= lundi).length,
      objectif: st.days,
      serie: serie(st),
      niveau: li.n,
      xp: li.cur,
      xpNiveau: li.need,
      rang: rankOf(li.n)[0],
      derniere: der ? `${der.title} • ${der.min} min` : '',
      meilleureSerie: Math.max(st.jeu.records.serie, serie(st)),
      cartes: possedees(st.jeu),
      defis: defisSemaine(lundiISO()).map((id) => defi(id, st)).map((d) => ({ titre: d.titre, fait: d.fait, but: d.but })),
      programme: { nom: prog(p).nom, semaine: progWeek(p), total: prog(p).sem },
    },
    fcMax: hrMax(st.age),
    poids: st.weight,
    explorer,
    coachs: COACHES.map((x) => ({ id: x.id, nom: x.nom, spec: x.spec.charAt(0) + x.spec.slice(1).toLowerCase() })),
    choisie,
    choisieProg,
    rando,
    sommeil: {
      reveil: st.reveil.h,
      actif: st.reveil.actif,
      coucher: coucherPour(st.reveil.h, st.objectifSommeil),
      vibration: st.reveil.vibration,
      objectif: st.objectifSommeil,
      nuit: !!st.nuitDebut,
      pluie: useSons.getState().joue,
      son: SONS_NUIT[useSons.getState().son].nom,
    },
  };
}

let dernier = '';
let minuterie: ReturnType<typeof setTimeout> | null = null;

function envoyer() {
  if (!NeaMontre) return;
  const json = JSON.stringify(etat());
  if (json === dernier) return;
  dernier = json;
  NeaMontre.envoyerEtat(json);
  // Widgets de l'iPhone (à partir du build 4).
  if (typeof NeaMontre.ecrireWidget === 'function') NeaMontre.ecrireWidget(JSON.stringify(widget(JSON.parse(json) as EtatMontre)));
}

/** La montre est jumelée et l'app NÉA y est installée. */
export const montreDisponible = () => !!NeaMontre && NeaMontre.estDisponible();

/** « Ouvrir sur la montre » : la séance devient « Ma séance » sur la montre, qui s'ouvre (build 18+). */
export function ouvrirSurMontre(choix: ChoixMontre) {
  useChoixMontre.setState({ choix, d: new Date().toDateString() });
  if (!NeaMontre) return;
  if (minuterie) clearTimeout(minuterie);
  envoyer();
  if (typeof NeaMontre.ouvrirSurMontre === 'function') NeaMontre.ouvrirSurMontre();
  toast('Séance envoyée sur ta montre ⌚');
}

/** « Ouvrir sur la montre » d'un sentier : il devient « Ma rando » sur la montre, qui s'ouvre (build 19+). */
export function ouvrirRandoSurMontre(id: string) {
  useChoixMontre.setState({ rando: id, dRando: new Date().toDateString() });
  if (!NeaMontre) return;
  if (minuterie) clearTimeout(minuterie);
  envoyer();
  if (typeof NeaMontre.ouvrirSurMontre === 'function') NeaMontre.ouvrirSurMontre();
  toast('Rando envoyée sur ta montre ⌚');
}

/** Ce sentier est celui envoyé aujourd'hui sur la montre. */
export function useRandoSurMontre(id: string) {
  return useChoixMontre((s) => s.rando === id && s.dRando === new Date().toDateString());
}

/** Cette séance est celle envoyée aujourd'hui sur la montre. */
export function useEstSurMontre(choix: ChoixMontre) {
  return useChoixMontre((s) => s.d === new Date().toDateString() && memeChoix(s.choix, choix));
}

/** Données des widgets : bilan du jour et prochaine séance (contrat de `targets/widgets`). */
function widget(e: EtatMontre) {
  const auj = todayIdx();
  const s = e.semaine.find((x) => x.jour >= auj) ?? null;
  return {
    prenom: e.prenom,
    coach: e.coach,
    effort: e.bilan.effort,
    recup: e.bilan.recup,
    sommeil: e.bilan.sommeil,
    score: e.bilan.score,
    seance: s ? { titre: s.titre, quand: s.quand, min: Math.round(s.min), exos: s.exos.length, jour: s.jour } : null,
    maj: new Date().toISOString(),
  };
}

/** Séance de la montre → journal, XP, série, quête (comme la fin d'une séance sur l'iPhone). */
function recevoir(json: string) {
  const r = lire<ResultatMontre>(json);
  if (!r) return;
  const st = useProfil.getState();
  if (st.logs.some((l) => l.d === r.fin && l.title === r.titre)) return;
  const min = Math.max(1, Math.round(r.sec / 60));
  // Calories de la montre, sinon l'estimation de la séance sur l'iPhone (intensité du coach × poids × durée).
  const cal = r.kcal > 0 ? Math.round(r.kcal) : Math.round(coachById(st.coach).int * 9 * st.weight * (Math.max(r.sec, 60) / 3600));
  st.addLog({ d: r.fin, debut: r.debut, src: 'montre', type: 'muscu', title: r.titre, min, cal, vol: Math.round(r.volume), hrAvg: Math.round(r.fcMoy), hrMax: Math.round(r.fcMax), hrv: 0 });
  // Séance faite : elle n'est plus « Ma séance » sur la montre.
  useChoixMontre.setState({ choix: null });
  const apres = useProfil.getState();
  apres.addXp(2 * r.series, 'Série');
  apres.addXp(40 + 5 * Math.min(10, serie(apres)), 'Séance');
  apres.quest('seance');
  apres.programmerPost('muscu', null);
  annoncer({
    type: 'activite',
    icon: 'dumb',
    col: colors.pink,
    act: 'activite',
    lien: r.fin,
    title: `${r.titre} · ${mmss(r.sec)}`,
    body: `${r.series} séries${r.fcMoy ? ` • FC moy. ${Math.round(r.fcMoy)} bpm` : ''} • Touche pour voir ton récap`,
  });
}

/** Sortie vélo ou course de la montre → journal, XP, quête (comme sur l'iPhone), puis territoires conquis avec son tracé. */
function recevoirVelo(json: string) {
  const r = lire<VeloMontre>(json);
  if (!r) return;
  if (r.sport === 'rando') return recevoirRando(r);
  const course = r.sport === 'course';
  const type = course ? 'course' : 'velo';
  const st = useProfil.getState();
  if (st.logs.some((l) => l.d === r.fin && l.type === type)) return;
  const min = Math.max(1, Math.round(r.sec / 60));
  const cal = r.kcal > 0 ? Math.round(r.kcal) : course ? caloriesCourse(r.km, st.weight) : caloriesVelo(r.km, r.sec, st.weight);
  const titre = course ? 'Course' : 'Sortie vélo';
  st.addLog({ d: r.fin, debut: r.debut, src: 'montre', type, title: titre, min, cal, vol: 0, dist: +r.km.toFixed(1), hrAvg: Math.round(r.fcMoy), hrMax: Math.round(r.fcMax), hrv: 0 });
  const apres = useProfil.getState();
  apres.addXp(course ? xpCourse(r.km) : xpVelo(r.km), course ? 'Course' : 'Vélo');
  if (!course && (r.km >= 5 || r.sec >= 1200)) apres.quest('velo');
  apres.programmerPost(type, null);
  const pts = (r.pts ?? []).filter((p): p is [number, number] => Array.isArray(p) && p.length === 2);
  const nb = pts.length > 1 ? casesTrace(pts).length : 0;
  annoncer({
    type: 'activite',
    icon: course ? 'run' : 'bike',
    col: colors.pink,
    act: 'activite',
    lien: r.fin,
    title: `${course ? 'Course' : 'Vélo'} · ${mmss(r.sec)}`,
    body: `${dec(r.km.toFixed(1))} km${r.fcMoy ? ` • FC moy. ${Math.round(r.fcMoy)} bpm` : ''}${nb ? ` • ${nb} cases traversées` : ''} • Touche pour voir ton récap`,
  });
  if (nb) void conquerirTrace(pts, r.fin);
}

/** Randonnée de la montre → journal (D+, sentier, sommet), XP, carte Explorateur, rappel VFC, territoires (comme sur l'iPhone). */
function recevoirRando(r: VeloMontre) {
  const st = useProfil.getState();
  if (st.logs.some((l) => l.d === r.fin && l.type === 'rando')) return;
  const s = trouverSentier(r.sentier);
  const dplus = Math.round(r.dplus ?? 0);
  const sommet = sommetAtteint(s, dplus);
  const min = Math.max(1, Math.round(r.sec / 60));
  const cal = r.kcal > 0 ? Math.round(r.kcal) : caloriesRando(r.sec, st.weight, dplus);
  st.addLog({ d: r.fin, debut: r.debut, src: 'montre', type: 'rando', title: s?.nom ?? 'Randonnée', min, cal, vol: 0, dist: +r.km.toFixed(1), dplus, rando: s?.id, sommet, hrAvg: Math.round(r.fcMoy), hrMax: Math.round(r.fcMax), hrv: 0 });
  useChoixMontre.setState({ rando: null });
  const apres = useProfil.getState();
  apres.addXp(xpRando(r.km, dplus), 'Randonnée');
  apres.programmerPost('rando', null);
  const carte = s && sommet ? gagnerExplorateur(s) : false;
  const pts = (r.pts ?? []).filter((p): p is [number, number] => Array.isArray(p) && p.length === 2);
  const nb = pts.length > 1 ? casesTrace(pts).length : 0;
  annoncer({
    type: 'activite',
    icon: 'rando',
    col: colors.pink,
    act: 'activite',
    lien: r.fin,
    title: `${sommet ? 'Sommet atteint ! ' : ''}${s?.nom ?? 'Randonnée'} · ${mmss(r.sec)}`,
    body: `${dec(r.km.toFixed(1))} km • D+ ${dplus} m${carte ? ' • Carte Explorateur gagnée' : ''} • Touche pour voir ton récap`,
  });
  if (nb) void conquerirTrace(pts, r.fin);
}

/** Mesure de récupération faite sur la montre. */
function recevoirMesure(json: string) {
  const m = lire<MesureMontre>(json);
  if (!m || !m.hrv) return;
  const st = useProfil.getState();
  if (st.hrvChecks.some((c) => c.d === m.d)) return;
  st.noterMesure({ d: m.d, hrv: Math.round(m.hrv), bpm: Math.round(m.bpm), kind: new Date(m.d).getHours() < 11 ? 'matin' : 'post' });
  toast('Mesure de récupération de la montre enregistrée');
}

function lire<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** Message de la montre (type + JSON) vers le bon traitement. */
function traiter(m: { type: string; json: string }) {
  if (m.type === 'seance') recevoir(m.json);
  else if (m.type === 'velo') recevoirVelo(m.json);
  else if (m.type === 'mesure') recevoirMesure(m.json);
  else if (m.type === 'coach-choix') {
    const c = lire<{ id: string }>(m.json);
    const id = c ? coachValide(c.id) : null;
    if (id && id !== useProfil.getState().coach) {
      useProfil.getState().pickCoach(id);
      toast('Coach ' + coachById(id).nom + ' choisi depuis ta montre');
    }
  } else if (m.type === 'coach') {
    const c = lire<CoachEnvoi>(m.json);
    if (c?.texte) envoyerAuCoach(c.texte);
  } else if (m.type === 'reveil') recevoirReveil(m.json);
  else if (m.type === 'nuit') recevoirNuit(m.json);
  else if (m.type === 'pluie') recevoirPluie(m.json);
  else if (m.type === 'ressenti-nuit') recevoirRessenti(m.json);
}

/** Partie Sommeil de la montre (build 27) : réveil réglé à la couronne, nuit commencée / terminée, pluie de l'iPhone, ressenti du matin. */
function recevoirReveil(json: string) {
  const r = lire<{ h: string; vibration: boolean }>(json);
  if (!r || !/^\d{2}:\d{2}$/.test(r.h)) return;
  const st = useProfil.getState();
  const reveil = { ...st.reveil, h: r.h, vibration: r.vibration, actif: true };
  st.reglerReveil(reveil);
  void programmerReveil(reveil);
  toast(`Réveil réglé à ${r.h} depuis ta montre ⏰`);
}

function recevoirNuit(json: string) {
  const n = lire<{ action: 'commencer' | 'terminer' }>(json);
  const st = useProfil.getState();
  if (n?.action === 'commencer') {
    if (!st.nuitDebut) st.commencerNuit();
  } else if (n?.action === 'terminer') {
    useSons.getState().pause();
    st.terminerNuit();
  }
}

function recevoirPluie(json: string) {
  const p = lire<{ action: 'jouer' | 'pause' | 'volume'; volume?: number }>(json);
  const s = useSons.getState();
  if (p?.action === 'jouer') s.jouer();
  else if (p?.action === 'pause') s.pause();
  else if (p?.action === 'volume' && typeof p.volume === 'number') s.regler(p.volume);
}

/** « Mon ressenti » du matin : qualité de la nuit (1 à 5) ; crée la nuit avec les données de la montre si elle n'est pas encore notée. */
function recevoirRessenti(json: string) {
  const r = lire<{ q: number; coucher?: string; reveil?: string; hrv?: number; rhr?: number }>(json);
  if (!r || r.q < 1 || r.q > 5) return;
  const st = useProfil.getState();
  // Même date que la feuille « Ta nuit » : le soir du coucher (avant 15 h, c'est la veille).
  const jour = nouvelleNuit('', '', r.q, 0, 0).d;
  const auj = st.nights.find((n) => n.d === jour);
  if (auj) st.set({ nights: ajouterNuit(st.nights, { ...auj, q: r.q }) });
  else if (r.coucher && r.reveil) st.noterNuit({ ...nouvelleNuit(heure(r.coucher), heure(r.reveil), r.q, r.hrv ?? 0, r.rhr ?? 0), src: 'sante' });
  toast('Ressenti de ta nuit noté depuis ta montre 🌙');
}

/** À l'ouverture (état chargé) : envoie l'état, puis le renvoie à chaque changement ; écoute les séances de la montre. */
export function demarrerLiaisonMontre() {
  if (!NeaMontre) return;
  const m = NeaMontre;
  // Build 3 : chaînes JSON de séances et événement « seanceMontre » ; ensuite { type, json } et « messageMontre ».
  const normaliser = (x: { type: string; json: string } | string) => (typeof x === 'string' ? { type: 'seance', json: x } : x);
  (m.recupererEnAttente() as ({ type: string; json: string } | string)[]).map(normaliser).forEach(traiter);
  const ecoute = (e: { type?: string; json: string }) => {
    traiter({ type: e.type ?? 'seance', json: e.json });
    m.recupererEnAttente();
  };
  m.addListener('messageMontre', ecoute);
  (m.addListener as (evt: string, f: typeof ecoute) => { remove(): void })('seanceMontre', ecoute);
  envoyer();
  const plusTard = () => {
    if (minuterie) clearTimeout(minuterie);
    minuterie = setTimeout(envoyer, 1500);
  };
  useProfil.subscribe(plusTard);
  useChoixMontre.subscribe(plusTard);
  useSons.subscribe(plusTard);
}
