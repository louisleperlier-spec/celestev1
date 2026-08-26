// Archétype quiz-reco — barre de progression (petit composant thémé, réutilisable).
// `value` va de 0 à 1. La piste utilise `accentSoft`, le remplissage `accent` → cohérent
// clair ET sombre via les tokens du thème (aucune couleur en dur).
import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ProgressBar({ value }: { value: number }) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View
      style={[styles.track, { backgroundColor: theme.accentSoft }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: theme.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: Radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.full },
});
