// Archétype timer-session — écran TIMER : choisir une durée, lancer, mettre en pause,
// et à la fin la séance est ENREGISTRÉE dans l'historique (le moment magique).
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { Button } from '@/ui/components/button';

import { useSaveSession } from './use-sessions';
import { useTimer } from './use-timer';

// Durées proposées, en secondes. ADAPTER : mets tes presets (ou une saisie libre).
const PRESETS = [60, 5 * 60, 10 * 60, 25 * 60];

function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function TimerView() {
  const { t } = useTranslation();
  const theme = useTheme();
  const save = useSaveSession();
  const [selected, setSelected] = useState(PRESETS[1]);

  const timer = useTimer((elapsed) => {
    haptics.tap();
    // La séance terminée est gardée dans l'historique.
    save.mutate({ duration_seconds: elapsed, label: null });
  });

  const shown = timer.status === 'idle' ? selected : timer.remaining;
  const showPresets = timer.status === 'idle';

  return (
    <View style={styles.content}>
      <ThemedText type="title" style={styles.title}>
        {t('timer.title')}
      </ThemedText>

      {showPresets ? (
        <View style={styles.presets}>
          {PRESETS.map((p) => (
            <Pressable
              key={p}
              onPress={() => {
                haptics.tap();
                setSelected(p);
              }}
              style={[
                styles.preset,
                {
                  borderColor: p === selected ? theme.accent : theme.border,
                  backgroundColor: p === selected ? theme.accentSoft : 'transparent',
                },
              ]}>
              <ThemedText type="smallBold" themeColor={p === selected ? 'accent' : 'text'}>
                {t('timer.minutes', { count: Math.round(p / 60) })}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.clockWrap}>
        <ThemedText style={[styles.clock, { color: theme.text }]}>{mmss(shown)}</ThemedText>
        {timer.status === 'done' ? (
          <ThemedText type="smallBold" themeColor="success">
            {t('timer.done')}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.actions}>
        {timer.status === 'idle' || timer.status === 'done' ? (
          <Button label={t('timer.start')} onPress={() => timer.start(selected)} />
        ) : timer.status === 'running' ? (
          <Button label={t('timer.pause')} variant="secondary" onPress={timer.pause} />
        ) : (
          <Button label={t('timer.resume')} onPress={timer.resume} />
        )}
        {timer.status !== 'idle' ? (
          <Button label={t('timer.reset')} variant="ghost" onPress={timer.reset} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', gap: Spacing.five, paddingTop: Spacing.five },
  title: { alignSelf: 'flex-start' },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, justifyContent: 'center' },
  preset: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  clockWrap: { alignItems: 'center', gap: Spacing.two },
  clock: { fontSize: 72, fontWeight: '200', fontVariant: ['tabular-nums'], letterSpacing: 1 },
  actions: { alignSelf: 'stretch', gap: Spacing.three },
});
