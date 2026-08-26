// Archétype timer-session — écran HISTORIQUE : la liste des séances terminées.
// Appui long sur une ligne = supprimer. Corps monté par `app/(tabs)/history.tsx`.
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { type Session } from './types';
import { useDeleteSession, useSessions } from './use-sessions';

export function HistoryView() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data, isLoading, isError, refetch } = useSessions();
  const remove = useDeleteSession();

  function minutesLabel(sec: number): string {
    return t('timer.minutes', { count: Math.round(sec / 60) });
  }

  function renderRow({ item }: { item: Session }) {
    const date = new Date(item.completed_at).toLocaleDateString();
    return (
      <Pressable
        onLongPress={() =>
          Alert.alert(t('history.deleteConfirm'), undefined, [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.delete'), style: 'destructive', onPress: () => remove.mutate(item.id) },
          ])
        }
        style={styles.row}>
        <View style={styles.rowText}>
          <ThemedText type="smallBold">{item.label?.trim() || t('history.session')}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {date}
          </ThemedText>
        </View>
        <ThemedText type="smallBold" themeColor="accent">
          {minutesLabel(item.duration_seconds)}
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <View style={styles.flex}>
      <ThemedText type="title" style={styles.title}>
        {t('history.title')}
      </ThemedText>

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
          keyExtractor={(s) => s.id}
          renderItem={renderRow}
          ItemSeparatorComponent={() => (
            <View style={[styles.sep, { backgroundColor: theme.border }]} />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                {t('history.empty')}
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
  title: { marginTop: Spacing.three, marginBottom: Spacing.three },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    minHeight: 56,
  },
  rowText: { flex: 1, gap: 2 },
  sep: { height: StyleSheet.hairlineWidth },
  center: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.six,
  },
  empty: { textAlign: 'center', maxWidth: 260 },
  listContent: { paddingBottom: Spacing.six, flexGrow: 1 },
});
