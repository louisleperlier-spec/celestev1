/**
 * Ligue en ligne : mon code ami, mes amis, mon équipe et le classement des équipes (voir supabase/ligue.sql).
 * Rien n'est sauvegardé sur l'appareil : tout est relu depuis le serveur.
 */
import { create } from 'zustand';

import { COACHES } from '@/data/coaches';
import type { CoachId } from '@/data/types';
import { lundiISO } from '@/lib/ligue';
import { supabase } from '@/lib/supabase';

export type Ami = { id: string; prenom: string; coach: CoachId; xp: number; xpSemaine: number };
export type Membre = Ami & { actif: boolean };
export type Equipe = { id: string; nom: string };
export type EquipeAmie = Equipe & { n: number };
export type EquipeClassee = Equipe & { xp: number; xpSemaine: number };

type Ligue = {
  code: string | null;
  amis: Ami[];
  equipe: Equipe | null;
  /** Mes coéquipiers (sans moi). */
  membres: Membre[];
  /** Équipes d'amis que je peux rejoindre. */
  equipesAmies: EquipeAmie[];
  classement: EquipeClassee[];
};

const vide = (): Ligue => ({ code: null, amis: [], equipe: null, membres: [], equipesAmies: [], classement: [] });

export const useLigue = create<Ligue>(vide);

export const viderLigue = () => useLigue.setState(vide());

/** Coéquipiers actifs cette semaine (pour le boost Équipe). */
const nbActifs = (s: Ligue) => s.membres.filter((m) => m.actif).length;
export const autresActifs = () => nbActifs(useLigue.getState());
export const useAutresActifs = () => useLigue(nbActifs);

type Brut = { id: string; prenom: string; coach: string; xp: number; xp_semaine: number; actif?: boolean; nom?: string; n?: number };

const coach = (c: string): CoachId => (COACHES.some((x) => x.id === c) ? (c as CoachId) : 'axel');
const ami = (r: Brut): Ami => ({ id: r.id, prenom: r.prenom || 'Sans nom', coach: coach(r.coach), xp: r.xp, xpSemaine: r.xp_semaine });

export type Resultat = { ok: true; prenom?: string } | { ok: false; erreur: string };

function message(e: { message: string }): string {
  const m = e.message;
  if (m.includes('Code inconnu')) return 'Aucun joueur avec ce code';
  if (m.includes("C'est ton code")) return "C'est ton propre code";
  if (m.includes('Équipe complète')) return 'Cette équipe est complète (5 membres)';
  if (m.includes('Déjà dans une équipe')) return 'Tu es déjà dans une équipe';
  if (m.includes('Nom vide')) return "Donne un nom à ton équipe";
  if (m.toLowerCase().includes('network') || m.toLowerCase().includes('fetch')) return 'Pas de connexion internet';
  return 'Une erreur est survenue, réessaie';
}

/** Met à jour mon joueur (prénom, coach, XP, semaine) ; le crée avec son code ami la première fois. */
export async function synchroJoueur(j: { prenom: string; coach: CoachId; xp: number; xpSemaine: number; actif: boolean }) {
  const { data, error } = await supabase.rpc('ligue_maj', {
    p_prenom: j.prenom,
    p_coach: j.coach,
    p_xp: j.xp,
    p_semaine: lundiISO(),
    p_xp_semaine: j.xpSemaine,
    p_actif: j.actif,
  });
  if (error) console.warn('Ligue :', error.message);
  else if (typeof data === 'string') useLigue.setState({ code: data });
}

/** Relit amis, équipe et classement. */
export async function chargerLigue() {
  const { data, error } = await supabase.rpc('ligue_etat', { p_lundi: lundiISO() });
  if (error || !data) {
    if (error) console.warn('Ligue :', error.message);
    return;
  }
  const d = data as { code: string | null; amis: Brut[]; equipe: Equipe | null; membres: Brut[]; equipes_amis: Brut[]; classement: Brut[] };
  useLigue.setState({
    code: d.code,
    amis: d.amis.map(ami),
    equipe: d.equipe,
    membres: d.membres.map((r) => ({ ...ami(r), actif: !!r.actif })),
    equipesAmies: d.equipes_amis.map((r) => ({ id: r.id, nom: r.nom ?? '', n: r.n ?? 0 })),
    classement: d.classement.map((r) => ({ id: r.id, nom: r.nom ?? '', xp: r.xp, xpSemaine: r.xp_semaine })),
  });
}

async function action(fn: string, args: Record<string, unknown>): Promise<Resultat> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) return { ok: false, erreur: message(error) };
  await chargerLigue();
  return { ok: true, prenom: typeof data === 'string' ? data : undefined };
}

/** Amitié mutuelle et immédiate avec le joueur de ce code. */
export const ajouterAmi = (code: string) => action('ajouter_ami', { p_code: code });
export const creerEquipe = (nom: string) => action('creer_equipe', { p_nom: nom });
/** Seulement l'équipe d'un ami, 5 membres au plus. */
export const rejoindreEquipe = (id: string) => action('rejoindre_equipe', { p_equipe: id });
export const quitterEquipe = () => action('quitter_equipe', {});
export const renommerEquipe = (nom: string) => action('renommer_equipe', { p_nom: nom });
