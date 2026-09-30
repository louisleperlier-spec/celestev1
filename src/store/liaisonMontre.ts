/**
 * Liaison avec l'app Apple Watch (module natif `nea-montre`, absent dans Expo Go) :
 * l'iPhone envoie le prénom, le coach et les séances de la semaine (charges calculées) ;
 * la montre renvoie chaque séance terminée, enregistrée ici comme une séance faite sur l'iPhone
 * (journal, XP, série, quête, rappel VFC). La montre écrit elle-même l'entraînement dans Apple Santé.
 */
import { toast } from '@/components/ui';
import { loadFor, rj } from '@/lib/charges';
import { buildPlan, exercice, exKcal, todayIdx } from '@/lib/plan';
import { sessionForDay, type Semaine } from '@/lib/semaine';
import { streak } from '@/lib/xp';

import { NeaMontre } from '../../modules/nea-montre/src';
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
type EtatMontre = { v: 1; prenom: string; coach: string; semaine: SeanceMontre[] };

/** Séance terminée sur la montre. */
type ResultatMontre = { id: string; debut: string; fin: string; titre: string; sec: number; kcal: number; fcMoy: number; fcMax: number; series: number; volume: number };

function etat(): EtatMontre {
  const st = useProfil.getState();
  const p = selectProfil(st);
  const sem: Semaine = { plan: buildPlan(p), weight: st.weight, added: st.added, wkMod: st.wkMod };
  const auj = todayIdx();
  const semaine: SeanceMontre[] = [];
  for (let i = 0; i < 7; i++) {
    const s = sessionForDay(sem, i);
    // Les sorties vélo restent sur l'iPhone (vélo de la montre : 2e temps).
    if (!s || s.ride || !s.items.length) continue;
    semaine.push({
      jour: i,
      quand: i === auj ? "Aujourd'hui" : i === auj + 1 ? 'Demain' : JOURS[i],
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
  }
  return { v: 1, prenom: st.name, coach: st.coach, semaine };
}

let dernier = '';
let minuterie: ReturnType<typeof setTimeout> | null = null;

function envoyer() {
  if (!NeaMontre) return;
  const json = JSON.stringify(etat());
  if (json === dernier) return;
  dernier = json;
  NeaMontre.envoyerEtat(json);
}

/** Séance de la montre → journal, XP, série, quête (comme la fin d'une séance sur l'iPhone). */
function recevoir(json: string) {
  let r: ResultatMontre;
  try {
    r = JSON.parse(json) as ResultatMontre;
  } catch {
    return;
  }
  const st = useProfil.getState();
  if (st.logs.some((l) => l.d === r.fin && l.title === r.titre)) return;
  const min = Math.max(1, Math.round(r.sec / 60));
  st.addLog({ d: r.fin, type: 'muscu', title: r.titre, min, cal: Math.round(r.kcal), vol: Math.round(r.volume), hrAvg: Math.round(r.fcMoy), hrMax: Math.round(r.fcMax), hrv: 0 });
  const apres = useProfil.getState();
  apres.addXp(2 * r.series, 'Série');
  apres.addXp(40 + 5 * Math.min(10, streak(apres.logs, apres.days)), 'Séance');
  apres.quest('seance');
  apres.programmerPost('muscu', null);
  toast('Séance de la montre enregistrée');
}

/** À l'ouverture (état chargé) : envoie l'état, puis le renvoie à chaque changement ; écoute les séances de la montre. */
export function demarrerLiaisonMontre() {
  if (!NeaMontre) return;
  const m = NeaMontre;
  m.recupererEnAttente().forEach(recevoir);
  m.addListener('seanceMontre', (e) => {
    recevoir(e.json);
    m.recupererEnAttente();
  });
  envoyer();
  useProfil.subscribe(() => {
    if (minuterie) clearTimeout(minuterie);
    minuterie = setTimeout(envoyer, 1500);
  });
}
