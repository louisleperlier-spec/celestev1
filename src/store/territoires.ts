/**
 * Territoires : envoi des cases traversées pendant une sortie (vélo ou course) et lecture de la carte et des classements
 * (supabase/territoires.sql). Les cases pas encore envoyées (pas de compte, pas de réseau) sont gardées sur l'appareil
 * et partent dès que possible.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CoachId } from '@/data/types';
import { coachValide } from '@/lib/plan';
import { supabase } from '@/lib/supabase';
import { casesTrace, cleCase, type Case } from '@/lib/territoires';
import type { Pt } from '@/lib/velo';

import { useCompte } from './compte';

export type Lien = 'moi' | 'ami' | 'equipe' | 'autre';
export type CaseProprio = Case & { proprio: string; prenom: string; coach: CoachId; lien: Lien; bouclier: boolean };
export type Rang = { rang: number; proprio: string; prenom: string; coach: CoachId; cases: number; moi: boolean };
export type Conquete = { prises: number; volees: number; gardees: number; protegees: number };

/** Au plus 3 000 cases par envoi (limite du serveur). */
const LOT = 3000;

type Etat = {
  /** Cases en attente d'envoi (clés « q:r »). */
  attente: string[];
  /** Résultat de la dernière conquête envoyée (récap de sortie), null si rien ou pas encore envoyé. */
  dernier: (Conquete & { d: string }) | null;
};

export const useTerritoires = create<Etat>()(
  persist(() => ({ attente: [] as string[], dernier: null as Etat['dernier'] }), {
    name: 'nea-territoires',
    storage: createJSONStorage(() => AsyncStorage),
  }),
);

const versCase = (k: string): Case => {
  const [q, r] = k.split(':').map(Number);
  return { q, r };
};

let envoi: Promise<Conquete | null> | null = null;

/** Envoie les cases en attente (si connecté) ; renvoie le total conquis, ou null si rien n'a pu partir. */
export function envoyerAttente(): Promise<Conquete | null> {
  if (envoi) return envoi;
  envoi = (async () => {
    if (!useCompte.getState().userId) return null;
    const total: Conquete = { prises: 0, volees: 0, gardees: 0, protegees: 0 };
    let parti = false;
    while (useTerritoires.getState().attente.length) {
      const lot = useTerritoires.getState().attente.slice(0, LOT);
      const cs = lot.map(versCase);
      const { data, error } = await supabase.rpc('conquerir', { p_q: cs.map((c) => c.q), p_r: cs.map((c) => c.r) });
      if (error) {
        console.warn('Territoires :', error.message);
        break;
      }
      const r = (data as Conquete[] | null)?.[0];
      if (r) (Object.keys(total) as (keyof Conquete)[]).forEach((k) => (total[k] += r[k]));
      parti = true;
      useTerritoires.setState((s) => ({ attente: s.attente.slice(lot.length) }));
    }
    return parti ? total : null;
  })().finally(() => {
    envoi = null;
  });
  return envoi;
}

/**
 * Fin d'une sortie en extérieur : ses cases rejoignent la file d'attente puis partent au serveur.
 * `d` : date de fin de la sortie (pour afficher le résultat dans son récap).
 */
export async function conquerirTrace(pts: readonly Pt[], d: string): Promise<Conquete | null> {
  const cs = casesTrace(pts);
  if (!cs.length) return null;
  useTerritoires.setState((s) => {
    const deja = new Set(s.attente);
    return { attente: [...s.attente, ...cs.map(cleCase).filter((k) => !deja.has(k))] };
  });
  const r = await envoyerAttente();
  if (r) useTerritoires.setState({ dernier: { ...r, d } });
  return r;
}

type BrutCase = { q: number; r: number; proprio: string; prenom: string; coach: string; lien: Lien; bouclier: boolean };
type BrutRang = { rang: number; proprio: string; prenom: string; coach: string; cases: number; moi: boolean };

/** Cases possédées dans une zone de la carte (voir `bornes`). */
export async function chargerZone(b: { q0: number; q1: number; r0: number; r1: number }): Promise<CaseProprio[] | null> {
  if (!useCompte.getState().userId) return null;
  const { data, error } = await supabase.rpc('territoires_zone', { p_q0: b.q0, p_q1: b.q1, p_r0: b.r0, p_r1: b.r1 });
  if (error) {
    console.warn('Territoires :', error.message);
    return null;
  }
  return ((data as BrutCase[] | null) ?? []).map((c) => ({ ...c, prenom: c.prenom || 'Sans nom', coach: coachValide(c.coach) }));
}

/** Classement des propriétaires autour d'une case (rayon en cases). */
export async function chargerClassement(c: Case, rayon: number): Promise<Rang[] | null> {
  if (!useCompte.getState().userId) return null;
  const { data, error } = await supabase.rpc('territoires_classement', { p_q: c.q, p_r: c.r, p_rayon: rayon });
  if (error) {
    console.warn('Territoires :', error.message);
    return null;
  }
  return ((data as BrutRang[] | null) ?? []).map((x) => ({ ...x, prenom: x.prenom || 'Sans nom', coach: coachValide(x.coach) }));
}

// Connexion au compte : les cases gardées hors ligne partent.
useCompte.subscribe((s, avant) => {
  if (s.userId && s.userId !== avant.userId) void envoyerAttente();
});
