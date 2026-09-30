/**
 * Liaison avec l'app Apple Watch (module natif `nea-montre`, absent dans Expo Go) :
 * l'iPhone envoie le prénom, le coach et les séances de la semaine (charges calculées) ;
 * la montre renvoie chaque séance terminée, enregistrée ici comme une séance faite sur l'iPhone
 * (journal, XP, série, quête, rappel VFC). La montre écrit elle-même l'entraînement dans Apple Santé.
 */
import { toast } from '@/components/ui';
import { cerclesJour, part, type IdCercle } from '@/lib/cercles';
import { dec, loadFor, rj } from '@/lib/charges';
import { mmss } from '@/lib/coeur';
import { COACHES, SEANCES } from '@/data';
import { buildPlan, coachById, coachValide, exercice, exKcal, hrMax, lvlN, sesKcal, todayIdx } from '@/lib/plan';
import { wkLocked } from '@/lib/premium';
import { baseHrv, lastNight, recovStatus, sleepScore } from '@/lib/sommeil';
import { caloriesVelo, xpVelo } from '@/lib/velo';
import { colors } from '@/theme';
import { catSession, sessionForDay, type SeanceJour, type Semaine } from '@/lib/semaine';
import { lvlInfo, rankOf, streak } from '@/lib/xp';

import { NeaMontre } from '../../modules/nea-montre/src';
import { envoyer as envoyerAuCoach } from './coach';
import { annoncer } from './notifs';
import { selectProfil, useProfil } from './profil';

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
type ProgresMontre = { seances: number; objectif: number; serie: number; niveau: number; xp: number; xpNiveau: number; rang: string; derniere: string };
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
};

/** Séance terminée sur la montre. */
type ResultatMontre = { id: string; debut: string; fin: string; titre: string; sec: number; kcal: number; fcMoy: number; fcMax: number; series: number; volume: number };
/** Sortie vélo, mesure de récupération d'1 min, message au coach (depuis la montre). */
type VeloMontre = { id: string; debut: string; fin: string; sec: number; km: number; kcal: number; fcMoy: number; fcMax: number };
type MesureMontre = { d: string; hrv: number; bpm: number };
type CoachEnvoi = { texte: string };

function etat(): EtatMontre {
  const st = useProfil.getState();
  const p = selectProfil(st);
  const sem: Semaine = { plan: buildPlan(p), weight: st.weight, added: st.added, wkMod: st.wkMod };
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
    coachInfo: { nom: c.nom, style: c.style, daily: c.daily, dernier: dernier?.t ?? '' },
    progres: {
      seances: st.logs.filter((l) => new Date(l.d) >= lundi).length,
      objectif: st.days,
      serie: streak(st.logs, st.days),
      niveau: li.n,
      xp: li.cur,
      xpNiveau: li.need,
      rang: rankOf(li.n)[0],
      derniere: der ? `${der.title} • ${der.min} min` : '',
    },
    fcMax: hrMax(st.age),
    poids: st.weight,
    explorer,
    coachs: COACHES.map((x) => ({ id: x.id, nom: x.nom, spec: x.spec.charAt(0) + x.spec.slice(1).toLowerCase() })),
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

/** Données des widgets : bilan du jour et prochaine séance (contrat de `targets/widgets`). */
function widget(e: EtatMontre) {
  const auj = todayIdx();
  const s = e.semaine.find((x) => x.jour >= auj) ?? null;
  return {
    prenom: e.prenom,
    effort: e.bilan.effort,
    recup: e.bilan.recup,
    sommeil: e.bilan.sommeil,
    score: e.bilan.score,
    seance: s ? { titre: s.titre, quand: s.quand, min: Math.round(s.min), exos: s.exos.length } : null,
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
  const apres = useProfil.getState();
  apres.addXp(2 * r.series, 'Série');
  apres.addXp(40 + 5 * Math.min(10, streak(apres.logs, apres.days)), 'Séance');
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

/** Sortie vélo de la montre → journal, XP, quête (comme la fin d'une sortie sur l'iPhone). */
function recevoirVelo(json: string) {
  const r = lire<VeloMontre>(json);
  if (!r) return;
  const st = useProfil.getState();
  if (st.logs.some((l) => l.d === r.fin && l.type === 'velo')) return;
  const min = Math.max(1, Math.round(r.sec / 60));
  const cal = r.kcal > 0 ? Math.round(r.kcal) : caloriesVelo(r.km, r.sec, st.weight);
  st.addLog({ d: r.fin, debut: r.debut, src: 'montre', type: 'velo', title: 'Sortie vélo', min, cal, vol: 0, dist: +r.km.toFixed(1), hrAvg: Math.round(r.fcMoy), hrMax: Math.round(r.fcMax), hrv: 0 });
  const apres = useProfil.getState();
  apres.addXp(xpVelo(r.km), 'Vélo');
  if (r.km >= 5 || r.sec >= 1200) apres.quest('velo');
  apres.programmerPost('velo', null);
  annoncer({
    type: 'activite',
    icon: 'bike',
    col: colors.pink,
    act: 'activite',
    lien: r.fin,
    title: `Vélo · ${mmss(r.sec)}`,
    body: `${dec(r.km.toFixed(1))} km${r.fcMoy ? ` • FC moy. ${Math.round(r.fcMoy)} bpm` : ''} • Touche pour voir ton récap`,
  });
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
  }
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
  useProfil.subscribe(() => {
    if (minuterie) clearTimeout(minuterie);
    minuterie = setTimeout(envoyer, 1500);
  });
}
