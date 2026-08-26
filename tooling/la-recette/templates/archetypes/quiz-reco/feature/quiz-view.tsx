// Archétype quiz-reco — écran QUESTIONNAIRE : une question à la fois + barre de progression.
// C'est le « moment magique » : l'utilisateur répond pas-à-pas, puis reçoit SA reco.
// Corps réutilisable (pas une route) : monté par `app/(tabs)/quiz.tsx`.
//
// États : soit il a déjà une reco (on propose de la voir ou de recommencer), soit il fait
// le questionnaire. À la dernière réponse → on calcule (pur), on persiste, on va au résultat.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { Button } from '@/ui/components/button';

import { ProgressBar } from './progress-bar';
import { OUTCOMES, QUESTIONS } from './questions';
import { computeReco } from './reco';
import { useQuiz } from './use-quiz';
import { useLatestResult, useSaveResult } from './use-quiz-result';

export function QuizView() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const quiz = useQuiz();
  const { data: latest, isLoading } = useLatestResult();
  const save = useSaveResult();
  // Une fois qu'on a un résultat, on montre l'accueil « déjà répondu » — sauf si l'utilisateur
  // choisit de refaire le test (`retaking`), auquel cas on repasse dans le flux de questions.
  const [retaking, setRetaking] = useState(false);

  // « Recommencer » depuis l'écran résultat : il navigue vers ce tab avec un jeton `retake`
  // qui change à chaque fois → on réinitialise et on relance le questionnaire directement.
  const { retake } = useLocalSearchParams<{ retake?: string }>();
  const lastRetake = useRef<string | undefined>();
  useEffect(() => {
    if (retake && retake !== lastRetake.current) {
      lastRetake.current = retake;
      quiz.reset();
      setRetaking(true);
    }
  }, [retake, quiz]);

  function onSelect(choiceId: string) {
    haptics.tap();
    if (quiz.isLast) {
      // Dernière question : on fige les réponses, on calcule, on persiste, on affiche la reco.
      const answers = { ...quiz.answers, [quiz.current.id]: choiceId };
      const reco = computeReco(QUESTIONS, answers, OUTCOMES);
      save.mutate(
        { outcomeId: reco.id, answers },
        { onSuccess: () => router.push('/result') },
      );
      return;
    }
    quiz.select(choiceId);
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  // Accueil « tu as déjà une reco » : voir le résultat, ou recommencer.
  if (latest && !retaking) {
    return (
      <View style={styles.intro}>
        <SymbolView name="checkmark.seal.fill" size={44} tintColor={theme.accent} />
        <ThemedText type="title" style={styles.center}>
          {t('quiz.doneTitle')}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.introText}>
          {t('quiz.doneSubtitle')}
        </ThemedText>
        <Button label={t('quiz.seeResult')} onPress={() => router.push('/result')} />
        <Button
          label={t('quiz.retake')}
          variant="ghost"
          onPress={() => {
            quiz.reset();
            setRetaking(true);
          }}
        />
      </View>
    );
  }

  // Le questionnaire pas-à-pas.
  return (
    <View style={styles.flex}>
      <View style={styles.topBar}>
        {!quiz.isFirst ? (
          <Pressable hitSlop={10} onPress={quiz.back} accessibilityLabel={t('common.back')}>
            <SymbolView name="chevron.left" size={20} tintColor={theme.text} />
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
        <ThemedText type="caption" themeColor="textMuted">
          {t('quiz.progress', { current: quiz.step + 1, total: quiz.total })}
        </ThemedText>
      </View>

      <ProgressBar value={quiz.progress} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <ThemedText type="title" style={styles.prompt}>
          {t(quiz.current.promptKey)}
        </ThemedText>

        {quiz.current.choices.map((choice) => {
          const active = quiz.selectedChoiceId === choice.id;
          return (
            <Pressable
              key={choice.id}
              onPress={() => onSelect(choice.id)}
              disabled={save.isPending}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.choice,
                {
                  backgroundColor: active ? theme.accentSoft : theme.surface,
                  borderColor: active ? theme.accent : theme.border,
                },
                pressed && { opacity: 0.7 },
              ]}>
              <ThemedText type="smallBold" themeColor={active ? 'accent' : 'text'} style={styles.flex}>
                {t(choice.labelKey)}
              </ThemedText>
              <SymbolView
                name={active ? 'checkmark.circle.fill' : 'circle'}
                size={22}
                tintColor={active ? theme.accent : theme.textMuted}
              />
            </Pressable>
          );
        })}

        {save.isPending ? (
          <View style={styles.saving}>
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  backSpacer: { width: 20 },
  content: { gap: Spacing.three, paddingTop: Spacing.five, paddingBottom: Spacing.six },
  prompt: { marginBottom: Spacing.two },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    minHeight: 60,
  },
  saving: { paddingTop: Spacing.four, alignItems: 'center' },
  center: { textAlign: 'center' },
  intro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.four, padding: Spacing.four },
  introText: { textAlign: 'center', maxWidth: 300 },
});
