// Archétype realtime-chat — LE cœur : le fil d'un message en TEMPS RÉEL.
// - charge l'historique (React Query),
// - ouvre un canal Supabase Realtime : chaque INSERT arrive tout seul (mien comme celui de
//   l'autre) → l'écran se met à jour sans rafraîchir,
// - envoi OPTIMISTE : la bulle apparaît instantanément, on réconcilie avec la ligne serveur
//   (et avec l'écho realtime) sans doublon ; rollback visuel (« échec ») si l'envoi rate.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { supabase } from '@/services/supabase/client';

import * as repo from './chat-repository';
import { type Message } from './types';

/** Tri stable par date (les timestamps ISO se comparent lexicographiquement). */
function byTime(list: Message[]): Message[] {
  return [...list].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function useMessages(conversationId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const uid = user?.id ?? 'anon';
  const key = ['messages', uid, conversationId];

  const query = useQuery({
    queryKey: key,
    queryFn: () => repo.listMessages(conversationId),
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
  });

  // ── Souscription temps réel ─────────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          // Clé reconstruite ici (et non capturée) pour des deps d'effet propres.
          qc.setQueryData<Message[]>(['messages', uid, conversationId], (prev = []) => {
            // Retire un éventuel optimiste équivalent (même expéditeur + même texte)…
            const cleaned = prev.filter(
              (m) => !(m.pending && m.sender_id === msg.sender_id && m.body === msg.body),
            );
            // …puis ajoute la vraie ligne si elle n'est pas déjà là (dédup par id).
            if (cleaned.some((m) => m.id === msg.id)) return byTime(cleaned);
            return byTime([...cleaned, msg]);
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // key dérive de (uid, conversationId) → deps suffisantes.
  }, [conversationId, uid, qc]);

  // ── Envoi optimiste ─────────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (body: string) => repo.sendMessage(conversationId, body),
    onMutate: async (body: string) => {
      const tempId = `optimistic-${Date.now()}`;
      const optimistic: Message = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: uid,
        body: body.trim(),
        created_at: new Date().toISOString(),
        pending: true,
      };
      qc.setQueryData<Message[]>(key, (prev = []) => byTime([...prev, optimistic]));
      return { tempId };
    },
    onSuccess: (saved, _body, ctx) => {
      // Remplace l'optimiste par la ligne serveur (sauf si le realtime l'a déjà posée).
      qc.setQueryData<Message[]>(key, (prev = []) => {
        const withoutTemp = prev.filter((m) => m.id !== ctx?.tempId);
        if (withoutTemp.some((m) => m.id === saved.id)) return byTime(withoutTemp);
        return byTime([...withoutTemp, saved]);
      });
    },
    onError: (_e, _body, ctx) => {
      // Marque l'optimiste comme échoué : la bulle propose de réessayer.
      qc.setQueryData<Message[]>(key, (prev = []) =>
        prev.map((m) => (m.id === ctx?.tempId ? { ...m, pending: false, failed: true } : m)),
      );
    },
  });

  const send = useCallback(
    (body: string) => {
      const text = body.trim();
      if (text) mutation.mutate(text);
    },
    [mutation],
  );

  /** Réessaie un message échoué : on retire la bulle en échec puis on renvoie son texte. */
  const retry = useCallback(
    (m: Message) => {
      qc.setQueryData<Message[]>(['messages', uid, conversationId], (prev = []) =>
        prev.filter((x) => x.id !== m.id),
      );
      mutation.mutate(m.body);
    },
    [mutation, qc, uid, conversationId],
  );

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    send,
    retry,
    sending: mutation.isPending,
  };
}
