// Archétype realtime-chat — écran LISTE des conversations. Chaque ligne montre l'autre
// participant + un aperçu du dernier message. Le « + » démarre une conversation par email.
// Corps réutilisable monté par `app/(tabs)/chats.tsx`.
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/services/supabase/client';

import { type ConversationSummary } from './types';
import { useConversations, useStartConversation } from './use-conversations';

export function ConversationsView() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const uid = user?.id ?? 'anon';
  const { data, isLoading, isError, refetch } = useConversations();
  const start = useStartConversation();

  // Realtime léger : un nouveau message (dans n'importe laquelle de MES conversations, la RLS
  // filtre) rafraîchit la liste → l'aperçu et l'ordre restent à jour sans action.
  useEffect(() => {
    const channel = supabase
      .channel('conversations-overview')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        qc.invalidateQueries({ queryKey: ['conversations', uid] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, uid]);

  function onNew() {
    Alert.prompt?.(t('chat.newTitle'), t('chat.newSubtitle'), (email?: string) => {
      const value = email?.trim();
      if (!value) return;
      start.mutate(value, {
        onSuccess: (conversationId) =>
          router.push({ pathname: '/chat/[id]', params: { id: conversationId, title: value } }),
        onError: (e) =>
          Alert.alert(t('chat.errorTitle'), t(`chat.error.${(e as Error).message}`, t('chat.error.generic'))),
      });
    });
  }

  function renderRow({ item }: { item: ConversationSummary }) {
    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/chat/[id]',
            params: { id: item.conversation_id, title: item.other_email ?? '' },
          })
        }
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.5 }]}>
        <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
          <SymbolView name="person.fill" size={20} tintColor={theme.accent} />
        </View>
        <View style={styles.rowText}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {item.other_email ?? t('chat.unknownUser')}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            {item.last_body ?? t('chat.noMessages')}
          </ThemedText>
        </View>
        <SymbolView name="chevron.right" size={13} tintColor={theme.textMuted} />
      </Pressable>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <ThemedText type="title" numberOfLines={1} style={styles.flex}>
          {t('chat.title')}
        </ThemedText>
        <Pressable hitSlop={10} onPress={onNew} accessibilityRole="button" accessibilityLabel={t('chat.newTitle')}>
          <SymbolView name="square.and.pencil" size={26} tintColor={theme.accent} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : isError ? (
        <Pressable onPress={() => refetch()} style={styles.center} accessibilityRole="button">
          <ThemedText type="small" themeColor="danger">
            {t('common.loadError')}
          </ThemedText>
          <ThemedText type="smallBold" themeColor="accent">
            {t('common.retry')}
          </ThemedText>
        </Pressable>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(c) => c.conversation_id}
          renderItem={renderRow}
          ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: theme.border }]} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                {t('chat.empty')}
              </ThemedText>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three, minHeight: 64 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 44 + Spacing.three },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingTop: Spacing.six },
  empty: { textAlign: 'center', maxWidth: 260 },
  listContent: { paddingBottom: Spacing.six, flexGrow: 1 },
});
