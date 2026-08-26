// Archétype quiz-reco — écran RÉSULTAT : la reco personnalisée de l'utilisateur.
// Lit le dernier résultat persisté et affiche l'`Outcome` correspondant (titre + description
// depuis l'i18n). Corps réutilisable monté par `app/result.tsx`.
//
// ADAPTER : c'est ici que la reco « prend vie ». Selon ton app, un bouton d'action peut mener
// vers le contenu recommandé (une routine, un pack, un plan…) plutôt que juste l'afficher.
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/ui/components/button';

import { OUTCOMES } from './questions';
import { useLatestResult } from './use-quiz-result';

export function ResultView({ onRetake }: { onRetake: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { data: result, isLoading } = useLatestResult();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  // Pas de résultat (ex. arrivée directe sur l'écran sans avoir répondu) → on renvoie au quiz.
  const outcome = result ? OUTCOMES.find((o) => o.id === result.outcome_id) : undefined;
  if (!outcome) {
    return (
      <View style={styles.center}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('quiz.noResult')}
        </ThemedText>
        <Button label={t('quiz.start')} onPress={onRetake} />
      </View>
    );
  }

  return (
    <View style={styles.content}>
      <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
        <SymbolView name="sparkles" size={40} tintColor={theme.accent} />
      </View>
      <ThemedText type="caption" themeColor="textMuted" style={styles.kicker}>
        {t('quiz.resultKicker')}
      </ThemedText>
      <ThemedText type="title" style={styles.title}>
        {t(outcome.titleKey)}
      </ThemedText>
      <ThemedText type="default" themeColor="textSecondary" style={styles.desc}>
        {t(outcome.descriptionKey)}
      </ThemedText>

      <View style={styles.actions}>
        {/* ADAPTER : remplace par l'action qui mène au contenu recommandé de ton app. */}
        <Button label={t('quiz.continue')} onPress={() => router.push('/')} />
        <Button label={t('quiz.retake')} variant="ghost" onPress={onRetake} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  badge: {
    width: 84,
    height: 84,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  kicker: { textTransform: 'uppercase', letterSpacing: 1 },
  title: { textAlign: 'center' },
  desc: { textAlign: 'center', maxWidth: 320, lineHeight: 24 },
  actions: { alignSelf: 'stretch', gap: Spacing.two, marginTop: Spacing.five },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
});
