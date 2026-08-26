// Archétype realtime-chat — hooks React Query pour la LISTE des conversations.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-context';

import * as repo from './chat-repository';

function useUid() {
  const { user } = useAuth();
  return user?.id ?? 'anon';
}

/** Mes conversations (triées par récence côté serveur). */
export function useConversations() {
  const uid = useUid();
  return useQuery({
    queryKey: ['conversations', uid],
    queryFn: repo.listConversations,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
  });
}

/** Démarre (ou retrouve) une conversation 1:1 avec un autre utilisateur, par email. */
export function useStartConversation() {
  const qc = useQueryClient();
  const uid = useUid();
  return useMutation({
    mutationFn: (email: string) => repo.startConversation(email),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations', uid] }),
  });
}
