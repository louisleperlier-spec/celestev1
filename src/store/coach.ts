/**
 * Envoi d'un message au coach IA (ask du prototype) : fonction Edge `coach` pour un compte connecté,
 * réponse de secours du prototype sinon (sans compte, hors ligne, modèle indisponible).
 */
import { create } from 'zustand';

import { ouvrirPlus } from '@/components/app/ouvrirPlus';
import { accueilCoach, chatLeft, compterMessage, CHAT_GRATUIT, reponseSecours, resumeProfil, type MessageChat } from '@/lib/coach';
import { buildPlan, coachById } from '@/lib/plan';
import { isPremium } from '@/lib/premium';
import { nextSession } from '@/lib/semaine';
import { supabase } from '@/lib/supabase';

import { useCompte } from './compte';
import { selectProfil, useProfil } from './profil';

/** Le coach écrit (… animé), non sauvegardé. */
export const useCoachEcrit = create<{ ecrit: boolean }>(() => ({ ecrit: false }));

/** Nouvelle conversation si elle est vide ou si le coach a changé (vChat). */
export function ouvrirChat() {
  const st = useProfil.getState();
  if (!st.chat.length || st.chatCoach !== st.coach) st.set({ chat: [accueilCoach(coachById(st.coach), st.name)], chatCoach: st.coach });
}

async function demanderAuServeur(messages: MessageChat[]): Promise<string | null> {
  const st = useProfil.getState();
  const c = coachById(st.coach);
  const { data, error } = await supabase.functions.invoke<{ texte?: string; reste?: number }>('coach', {
    body: { coach: { nom: c.nom, style: c.style, voix: c.voix }, profil: resumeProfil(st, buildPlan(selectProfil(st))), messages: messages.slice(-10) },
  });
  if (error) {
    // Limite du jour atteinte côté serveur (autre appareil…) : le compteur local s'aligne.
    const ctx = (error as { context?: Response }).context;
    if (ctx?.status === 429) useProfil.getState().set({ chatQ: { d: new Date().toISOString().slice(0, 10), n: CHAT_GRATUIT } });
    return null;
  }
  return data?.texte?.trim() || null;
}

/** Envoie un message ; sans message gratuit restant, ouvre NÉA Plus. */
export async function envoyer(texte: string) {
  const t = texte.trim();
  if (!t || useCoachEcrit.getState().ecrit) return;
  const st = useProfil.getState();
  if (chatLeft(st.chatQ, isPremium()) <= 0) {
    ouvrirPlus();
    return;
  }
  const chat = [...st.chat, { r: 'me' as const, t }];
  st.set({ chat, chatQ: compterMessage(st.chatQ) });
  st.quest('coach');
  useCoachEcrit.setState({ ecrit: true });
  let reponse: string | null = null;
  if (useCompte.getState().userId) {
    try {
      reponse = await demanderAuServeur(chat);
    } catch {
      reponse = null;
    }
  }
  if (!reponse) {
    const apres = useProfil.getState();
    reponse = reponseSecours(t, apres.name, nextSession({ plan: buildPlan(selectProfil(apres)), weight: apres.weight, added: apres.added, wkMod: apres.wkMod }).s.titre);
  }
  const fin = useProfil.getState();
  fin.set({ chat: [...fin.chat, { r: 'bot', t: reponse }] });
  useCoachEcrit.setState({ ecrit: false });
}
