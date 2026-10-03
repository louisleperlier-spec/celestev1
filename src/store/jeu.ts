/**
 * Moteur du jeu (cartes récompense, records, défis de la semaine, niveaux) : écoute le profil et récompense.
 * - activité terminée (iPhone ou montre) : 1 carte ;
 * - record battu : « Nouveau record ! » + 1 carte Rare ou mieux ;
 * - niveau gagné : « Niveau N ! » + booster de 3 cartes (et le Turbo x2 déjà donné par addXp) ;
 * - défi de la semaine réussi : « Défi réussi ! » + booster de 3 cartes.
 * Les fêtes passent par `useFetes` (affichées par `components/app/Fete.tsx`).
 */
import { Vibration } from 'react-native';
import { create } from 'zustand';

import { defi, defisSemaine, meilleurs, nouveauPaquet, ouvrir, recordsBattus, type EtatJeu, type Paquet, type Rarete, type Tirage } from '@/lib/jeu';
import { lundiISO } from '@/lib/ligue';
import { lvlInfo, streak, type Log } from '@/lib/xp';

import { useProfil } from './profil';

export type Fete = {
  id: string;
  /** « Nouveau record ! », « Niveau 5 ! », « Défi réussi ! ». */
  titre: string;
  sous: string;
  emoji: string;
  /** Ce qui a été gagné (« Booster de 3 cartes », « +1 Turbo x2 »). */
  gains: string[];
};

export const useFetes = create<{ file: Fete[] }>(() => ({ file: [] }));

export function feter(f: Omit<Fete, 'id'>) {
  useFetes.setState((s) => ({ file: [...s.file, { ...f, id: String(Date.now()) + Math.random() }] }));
}

export const fermerFete = () => useFetes.setState((s) => ({ file: s.file.slice(1) }));

const majJeu = (f: (j: EtatJeu) => EtatJeu) => useProfil.setState((s) => ({ jeu: f(s.jeu) }));

function donner(n: number, source: string, min: Rarete = 0) {
  const p = nouveauPaquet(n, source, min);
  majJeu((j) => ({ ...j, paquets: [...j.paquets, p] }));
  return p;
}

/** Ouvre un paquet : collection, XP des doubles, Turbo des Légendaires nouvelles. */
export function ouvrirPaquet(id: string): { paquet: Paquet; tirages: Tirage[]; xp: number; turbos: number } | null {
  const st = useProfil.getState();
  const paquet = st.jeu.paquets.find((p) => p.id === id);
  const r = ouvrir(st.jeu, id);
  if (!r || !paquet) return null;
  useProfil.setState({ jeu: r.jeu, tokens: st.tokens + r.turbos });
  if (r.xp > 0) useProfil.getState().addXp(r.xp, 'Cartes');
  return { paquet, tirages: r.tirages, xp: r.xp, turbos: r.turbos };
}

const libelle = (l: Log) => (l.type === 'velo' ? 'Sortie vélo' : l.type === 'course' ? 'Course' : l.type === 'rando' ? 'Randonnée' : 'Séance terminée');

/** Une activité vient d'être ajoutée au journal. */
function apresActivite(l: Log, avant: readonly Log[]) {
  donner(1, libelle(l));
  for (const r of recordsBattus(avant, l)) {
    donner(1, 'Record : ' + r.titre, 1);
    feter({ titre: 'Nouveau record !', sous: `${r.titre} : ${r.valeur}`, emoji: '🏆', gains: ['1 carte Rare ou mieux'] });
  }
}

/** Série de jours : record quand la meilleure série est dépassée. */
function verifierSerie() {
  const st = useProfil.getState();
  const n = streak(st.logs, st.days);
  if (n <= st.jeu.records.serie) return;
  const ancien = st.jeu.records.serie;
  majJeu((j) => ({ ...j, records: { ...j.records, serie: n } }));
  if (ancien >= 3) {
    donner(1, 'Record : meilleure série', 1);
    feter({ titre: 'Série record !', sous: `${n} jours d'affilée, du jamais vu 🔥`, emoji: '🔥', gains: ['1 carte Rare ou mieux'] });
  }
}

/** Défis de la semaine réussis : booster de 3 cartes chacun. */
function verifierDefis() {
  const st = useProfil.getState();
  const sem = lundiISO();
  const pris = st.jeu.defis.sem === sem ? st.jeu.defis.pris : [];
  const reussis = defisSemaine(sem)
    .map((id) => defi(id, st))
    .filter((d) => d.fait >= d.but && !pris.includes(d.id));
  if (!reussis.length && st.jeu.defis.sem === sem) return;
  majJeu((j) => ({ ...j, defis: { sem, pris: [...pris, ...reussis.map((d) => d.id)] } }));
  for (const d of reussis) {
    donner(3, 'Défi : ' + d.titre, 1);
    feter({ titre: 'Défi réussi !', sous: d.titre, emoji: '🎯', gains: ['Booster de 3 cartes'] });
  }
}

let demarre = false;

/** Au lancement : écoute le journal, l'XP, les nuits et les mesures pour récompenser. */
export function demarrerJeu() {
  if (demarre) return;
  demarre = true;
  // Joueur existant : records repris de son journal, sans fête.
  const st0 = useProfil.getState();
  if (!st0.jeu.records.serie && !st0.jeu.records.vol && st0.logs.length) {
    majJeu((j) => ({ ...j, records: { ...meilleurs(st0.logs), serie: streak(st0.logs, st0.days) } }));
  }
  useProfil.subscribe((s, p) => {
    if (!s.onboarded) return;
    // Une seule activité ajoutée (pas un chargement de compte).
    const nouvelle = s.logs.length === p.logs.length + 1 && s.logs[1] === p.logs[0];
    if (nouvelle) apresActivite(s.logs[0], p.logs);
    // Niveau gagné par addXp (une entrée de plus dans l'historique d'XP).
    const nAvant = lvlInfo(p.xp).n;
    const nApres = lvlInfo(s.xp).n;
    if (nApres > nAvant && s.xpLog.length === p.xpLog.length + 1) {
      donner(3, 'Niveau ' + nApres, 1);
      feter({ titre: `Niveau ${nApres} !`, sous: 'Tu montes en puissance, continue comme ça 💪', emoji: '⚡', gains: ['Booster de 3 cartes', '+1 Turbo x2'] });
    }
    if (s.logs !== p.logs || s.nights !== p.nights || s.hrvChecks !== p.hrvChecks || s.xpLog !== p.xpLog) {
      if (nouvelle) verifierSerie();
      verifierDefis();
    }
  });
}

/** Petite vibration de fête (sans module natif : marche aussi dans les anciens builds). */
export const vibrerFete = () => Vibration.vibrate([0, 30, 60, 30]);
