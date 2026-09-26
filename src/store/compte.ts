/**
 * Compte Supabase : inscription, connexion, déconnexion, suppression, et sauvegarde automatique
 * de l'état (profil, programme, séances, poids, XP) dans la table `etats` (voir supabase/schema.sql).
 */
import type { AuthError } from '@supabase/supabase-js';
import { create } from 'zustand';

import { actifSemaine, xpSemaine } from '@/lib/ligue';
import { supabase } from '@/lib/supabase';

import { chargerLigue, synchroJoueur, viderLigue } from './ligue';
import { chargerEtat, etatSauvegarde, useProfil, type EtatSauvegarde } from './profil';

type Compte = {
  /** Session lue au démarrage. */
  pret: boolean;
  userId: string | null;
  email: string | null;
};

export const useCompte = create<Compte>(() => ({ pret: false, userId: null, email: null }));

/** Adresse email valide (validEmail du prototype). */
export const emailValide = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

/** Force du mot de passe de 0 à 4 (pwScore du prototype). */
export function pwScore(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) s++;
  return s;
}

/** Message d'erreur en français. */
function message(e: AuthError | Error | { message: string }): string {
  const m = e.message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email ou mot de passe incorrect';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Un compte existe déjà avec cet email : connecte-toi';
  if (m.includes('email not confirmed')) return 'Confirme ton email avec le lien reçu, puis connecte-toi';
  if (m.includes('rate limit') || m.includes('security purposes')) return 'Trop de tentatives, réessaie dans une minute';
  if (m.includes('password')) return 'Mot de passe trop faible : 8 caractères, majuscule et chiffre';
  if (m.includes('network') || m.includes('fetch')) return 'Pas de connexion internet';
  return 'Une erreur est survenue, réessaie';
}

async function sauvegarder(etat: EtatSauvegarde) {
  const id = useCompte.getState().userId;
  if (!id) return;
  const { error } = await supabase.from('etats').upsert({ id, etat, maj: new Date().toISOString() });
  if (error) console.warn('Sauvegarde Supabase :', error.message);
  await synchroJoueur({ prenom: etat.name, coach: etat.coach, xp: etat.xp, xpSemaine: xpSemaine(etat.xpLog), actif: actifSemaine(etat.logs) });
}

/** Mon joueur à jour dans la Ligue, puis amis, équipe et classement. */
export async function rafraichirLigue() {
  if (!useCompte.getState().userId) return;
  const e = useProfil.getState();
  await synchroJoueur({ prenom: e.name, coach: e.coach, xp: e.xp, xpSemaine: xpSemaine(e.xpLog), actif: actifSemaine(e.logs) });
  await chargerLigue();
}

/** Récupère l'état du compte ; sinon y enregistre l'état de l'appareil (enterAccount du prototype). */
async function recupererOuEnvoyer() {
  const id = useCompte.getState().userId;
  if (!id) return;
  const { data, error } = await supabase.from('etats').select('etat').eq('id', id).maybeSingle();
  if (error) throw error;
  if (data?.etat) chargerEtat(data.etat as EtatSauvegarde);
  else await sauvegarder(etatSauvegarde(useProfil.getState()));
  await rafraichirLigue();
}

export type Resultat = { ok: true; confirmer?: boolean } | { ok: false; erreur: string };

/** Création de compte. `confirmer` : Supabase attend la confirmation de l'email avant la première connexion. */
export async function inscrire(email: string, motDePasse: string): Promise<Resultat> {
  const { data, error } = await supabase.auth.signUp({ email, password: motDePasse });
  if (error) return { ok: false, erreur: message(error) };
  // Email déjà utilisé : Supabase répond sans erreur mais sans identité (pour ne pas révéler les comptes).
  if (data.user && !data.user.identities?.length) return { ok: false, erreur: message({ message: 'already registered' }) };
  if (!data.session) return { ok: true, confirmer: true };
  await sauvegarder(etatSauvegarde(useProfil.getState()));
  await chargerLigue();
  return { ok: true };
}

export async function connecter(email: string, motDePasse: string): Promise<Resultat> {
  const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
  if (error) return { ok: false, erreur: message(error) };
  try {
    await recupererOuEnvoyer();
  } catch (e) {
    return { ok: false, erreur: message(e as Error) };
  }
  return { ok: true };
}

/** Déconnexion : les données restent sur le compte, l'appareil repart de zéro. */
export async function deconnecter() {
  await supabase.auth.signOut();
  useProfil.getState().reset();
  viderLigue();
}

/** Suppression définitive du compte et de toutes ses données sur le serveur, puis sur l'appareil. */
export async function supprimerCompte(): Promise<Resultat> {
  if (useCompte.getState().userId) {
    const { error } = await supabase.rpc('supprimer_mon_compte');
    if (error) return { ok: false, erreur: message(error) };
    await supabase.auth.signOut();
  }
  useProfil.getState().reset();
  viderLigue();
  return { ok: true };
}

let demarre = false;
/**
 * À appeler une fois au démarrage : lit la session, suit les connexions/déconnexions,
 * et sauvegarde l'état sur le compte 1,5 s après chaque changement.
 */
export function demarrerCompte() {
  if (demarre) return;
  demarre = true;
  supabase.auth.getSession().then(({ data }) => {
    const u = data.session?.user;
    useCompte.setState({ pret: true, userId: u?.id ?? null, email: u?.email ?? null });
    // Coéquipiers actifs dès le démarrage : ils comptent pour le boost Équipe.
    rafraichirLigue();
  });
  supabase.auth.onAuthStateChange((_evt, session) => {
    const u = session?.user;
    useCompte.setState({ pret: true, userId: u?.id ?? null, email: u?.email ?? null });
  });
  let t: ReturnType<typeof setTimeout> | null = null;
  useProfil.subscribe((s) => {
    if (!useCompte.getState().userId) return;
    if (t) clearTimeout(t);
    t = setTimeout(() => sauvegarder(etatSauvegarde(s)), 1500);
  });
}
