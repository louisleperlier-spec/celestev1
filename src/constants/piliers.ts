import type { Ionicons } from '@expo/vector-icons';
import type { PillarId } from '@/lib/types';

export type PillarMeta = {
  id: PillarId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const PILLARS: PillarMeta[] = [
  { id: 'physique', label: 'Physique', icon: 'barbell' },
  { id: 'apparence', label: 'Apparence', icon: 'sparkles' },
  { id: 'energie', label: 'Énergie', icon: 'flash' },
  { id: 'discipline', label: 'Discipline', icon: 'shield-checkmark' },
  { id: 'mental', label: 'Mental', icon: 'happy' },
];

export function getPillar(id: PillarId): PillarMeta {
  const found = PILLARS.find((p) => p.id === id);
  if (!found) throw new Error(`Pilier inconnu : ${id}`);
  return found;
}
