import type { Ionicons } from '@expo/vector-icons';
import type { PillarId } from '@/lib/types';

export type MissionTemplate = {
  id: string;
  pillar: PillarId;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
};

/**
 * Une mission fixe par pilier, proposée chaque jour. Simple et prévisible pour le MVP —
 * personnalisation par objectif (perte de gras / prise de masse / discipline...) prévue en v1.1.
 */
export const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    id: 'mission-physique',
    pillar: 'physique',
    title: 'Entraînement',
    subtitle: 'Séance du jour',
    icon: 'barbell',
  },
  {
    id: 'mission-apparence',
    pillar: 'apparence',
    title: 'Routine soin',
    subtitle: 'Peau, cheveux, posture',
    icon: 'sparkles',
  },
  {
    id: 'mission-energie',
    pillar: 'energie',
    title: 'Nutrition & sommeil',
    subtitle: 'Repas propre, coucher à l’heure',
    icon: 'flash',
  },
  {
    id: 'mission-discipline',
    pillar: 'discipline',
    title: 'Zéro distraction',
    subtitle: 'Un bloc sans téléphone',
    icon: 'shield-checkmark',
  },
  {
    id: 'mission-mental',
    pillar: 'mental',
    title: 'Mental',
    subtitle: 'Respiration, gratitude ou lecture',
    icon: 'happy',
  },
];

export function getMission(id: string): MissionTemplate {
  const found = MISSION_TEMPLATES.find((m) => m.id === id);
  if (!found) throw new Error(`Mission inconnue : ${id}`);
  return found;
}
