// Archétype realtime-chat — accès données (le SEUL endroit qui parle à Supabase).
// La souscription temps réel, elle, est câblée dans `use-messages.ts` (elle n'est pas une
// requête ponctuelle mais un canal ouvert).
import { supabase } from '@/services/supabase/client';

import { type ConversationSummary, type Message } from './types';

/** Mes conversations (autre participant + dernier message), via la RPC dédiée. */
export async function listConversations(): Promise<ConversationSummary[]> {
  const { data, error } = await supabase.rpc('list_my_conversations');
  if (error) throw error;
  return (data ?? []) as ConversationSummary[];
}

/** Trouve-ou-crée une conversation 1:1 avec un autre utilisateur (par email). Renvoie l'id.
 *  Erreurs métier possibles (message de l'exception SQL) : `user_not_found`,
 *  `cannot_message_self`. */
export async function startConversation(email: string): Promise<string> {
  const { data, error } = await supabase.rpc('start_conversation', { other_email: email.trim() });
  if (error) throw new Error(error.message);
  return data as string;
}

/** Les messages d'un fil, du plus ancien au plus récent (borné : on ne charge pas tout). */
export async function listMessages(conversationId: string, limit = 200): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Message[];
}

/** Envoie un message. `sender_id` est posé ici (jamais par le client à l'aveugle) : c'est ce
 *  que vérifie la policy RLS d'écriture. */
export async function sendMessage(conversationId: string, body: string): Promise<Message> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not_authenticated');

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: user.id, body: body.trim().slice(0, 4000) })
    .select('id, conversation_id, sender_id, body, created_at')
    .single();
  if (error) throw error;
  return data as Message;
}

/** Signale un message (modération Apple 1.2). */
export async function reportMessage(messageId: string, reason?: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not_authenticated');
  const { error } = await supabase
    .from('reports')
    .insert({ reporter_id: user.id, message_id: messageId, reason: reason ?? null });
  if (error) throw error;
}

/** Bloque un utilisateur : ses messages disparaissent (filtrés par la RLS de lecture). */
export async function blockUser(blockedId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not_authenticated');
  const { error } = await supabase
    .from('blocks')
    .upsert({ blocker_id: user.id, blocked_id: blockedId }, { onConflict: 'blocker_id,blocked_id' });
  if (error) throw error;
}
