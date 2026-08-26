import { useLocalSearchParams } from 'expo-router';

import { BreathingPlayerView } from '@/features/meditate/breathing-player-view';
import { BREATHING_TECHNIQUES } from '@/lib/breathing';

export default function MeditationPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const technique = BREATHING_TECHNIQUES.find((t) => t.id === id) ?? BREATHING_TECHNIQUES[0];

  return <BreathingPlayerView technique={technique} />;
}
