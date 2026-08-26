// Archétype realtime-chat — écran FIL de discussion : messages + composer, en temps réel.
// Bulles alignées (à droite = moi), envoi optimiste, appui long sur un message d'autrui pour
// SIGNALER ou BLOQUER (modération Apple 1.2). Corps monté par `app/chat/[id].tsx`.
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { TextField } from '@/ui/components/text-field';

import * as repo from './chat-repository';
import { type Message } from './types';
import { useMessages } from './use-messages';

export function ChatView({ conversationId, title, onBack }: { conversationId: string; title?: string; onBack: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();
  const uid = user?.id ?? 'anon';
  const { messages, isLoading, isError, refetch, send, retry, sending } = useMessages(conversationId);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  function submit() {
    const text = draft.trim();
    if (!text) return;
    send(text);
    setDraft('');
    // Laisse le temps à la bulle optimiste d'être posée avant de défiler.
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }

  // Modération : signaler le message ou bloquer son expéditeur (uniquement les messages d'autrui).
  function moderate(m: Message) {
    haptics.tap();
    Alert.alert(t('chat.moderateTitle'), undefined, [
      {
        text: t('chat.report'),
        onPress: async () => {
          await repo.reportMessage(m.id);
          Alert.alert(t('chat.reportedTitle'), t('chat.reportedBody'));
        },
      },
      {
        text: t('chat.block'),
        style: 'destructive',
        onPress: async () => {
          await repo.blockUser(m.sender_id);
          refetch(); // la RLS masque désormais ses messages
        },
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }

  function renderBubble({ item }: { item: Message }) {
    const mine = item.sender_id === uid;
    return (
      <Pressable
        onLongPress={mine ? undefined : () => moderate(item)}
        onPress={item.failed ? () => retry(item) : undefined}
        style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: mine ? theme.accent : theme.surface,
              borderColor: theme.border,
              borderWidth: mine ? 0 : 1,
            },
            item.pending && styles.pending,
          ]}>
          <ThemedText type="small" style={{ color: mine ? '#fff' : theme.text }}>
            {item.body}
          </ThemedText>
        </View>
        {item.failed ? (
          <ThemedText type="caption" themeColor="danger" style={styles.failed}>
            {t('chat.sendFailed')}
          </ThemedText>
        ) : null}
      </Pressable>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Pressable hitSlop={10} onPress={onBack} accessibilityLabel={t('common.back')}>
          <SymbolView name="chevron.left" size={22} tintColor={theme.text} />
        </Pressable>
        <ThemedText type="smallBold" numberOfLines={1} style={styles.headerTitle}>
          {title || t('chat.conversation')}
        </ThemedText>
        <View style={styles.headerSpacer} />
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
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderBubble}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.center}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                {t('chat.emptyThread')}
              </ThemedText>
            </View>
          }
        />
      )}

      <View style={[styles.composer, { borderTopColor: theme.border }]}>
        <TextField
          value={draft}
          onChangeText={setDraft}
          placeholder={t('chat.composerPlaceholder')}
          multiline
          style={styles.input}
        />
        <Pressable
          hitSlop={8}
          onPress={submit}
          disabled={!draft.trim() || sending}
          accessibilityRole="button"
          accessibilityLabel={t('chat.send')}>
          <SymbolView
            name="arrow.up.circle.fill"
            size={34}
            tintColor={draft.trim() ? theme.accent : theme.textMuted}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  headerTitle: { flex: 1 },
  headerSpacer: { width: 22 },
  listContent: { paddingVertical: Spacing.three, gap: Spacing.two, flexGrow: 1 },
  bubbleRow: { maxWidth: '82%' },
  rowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  rowTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Radius.lg },
  pending: { opacity: 0.55 },
  failed: { marginTop: 2 },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingTop: Spacing.six },
  empty: { textAlign: 'center', maxWidth: 260 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, maxHeight: 120 },
});
