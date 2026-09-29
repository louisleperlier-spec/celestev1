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

/**
 * Connexion avec Apple (iPhone seulement) : Apple renvoie un jeton d'identité que Supabase vérifie.
 * Le prénom n'est fourni qu'à la toute première connexion : il remplit le profil s'il est vide.
 */
export async function connecterApple(): Promise<Resultat | null> {
  let jeton: string | null = null;
  let prenom: string | null = null;
  try {
    const AppleAuthentication = await import('expo-apple-authentication');
    if (!(await AppleAuthentication.isAvailableAsync())) return { ok: false, erreur: 'Connexion Apple indisponible sur cet appareil' };
    const c = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });
    jeton = c.identityToken;
    prenom = c.fullName?.givenName ?? null;
  } catch (e) {
    // Fenêtre d'Apple fermée : rien à afficher.
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    return { ok: false, erreur: 'Connexion Apple impossible, réessaie' };
  }
  if (!jeton) return { ok: false, erreur: 'Connexion Apple impossible, réessaie' };
  const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: jeton });
  if (error) return { ok: false, erreur: message(error) };
  if (prenom && !useProfil.getState().name) useProfil.getState().set({ name: prenom });
  try {
    await recupererOuEnvoyer();
  } catch (e) {
    return { ok: false, erreur: message(e as Error) };
  }
  return { ok: true };
}

/**
 * Mot de passe oublié, en 2 temps et sans lien à ouvrir : Supabase envoie un code par email
 * (modèle « Reset Password » avec {{ .Token }}), puis le code connecte et on choisit le nouveau mot de passe.
 */
export async function envoyerCodeMotDePasse(email: string): Promise<Resultat> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  return error ? { ok: false, erreur: message(error) } : { ok: true };
}

export async function changerMotDePasse(email: string, code: string, motDePasse: string): Promise<Resultat> {
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
  if (error) {
    const m = error.message.toLowerCase();
    return { ok: false, erreur: m.includes('expired') || m.includes('invalid') ? 'Code incorrect ou expiré' : message(error) };
  }
  const r = await supabase.auth.updateUser({ password: motDePasse });
  if (r.error) return { ok: false, erreur: message(r.error) };
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
