/** Techniques de respiration guidée — le cœur réel des "méditations" (pas de fichier audio requis). */

export type BreathingStep = { phase: 'inspire' | 'retiens' | 'expire' | 'retiens2'; seconds: number };

export type BreathingTechnique = {
  id: string;
  title: string;
  subtitle: string;
  durationLabel: string;
  steps: BreathingStep[];
  cycles: number;
};

export const BREATHING_TECHNIQUES: BreathingTechnique[] = [
  {
    id: '4-7-8',
    title: 'Respiration 4-7-8',
    subtitle: 'Calme le système nerveux avant de dormir',
    durationLabel: '5 min · guidée',
    cycles: 6,
    steps: [
      { phase: 'inspire', seconds: 4 },
      { phase: 'retiens', seconds: 7 },
      { phase: 'expire', seconds: 8 },
    ],
  },
  {
    id: 'coherence',
    title: 'Cohérence cardiaque',
    subtitle: 'Rééquilibre en 5 minutes, matin ou soir',
    durationLabel: '5 min · guidée',
    cycles: 15,
    steps: [
      { phase: 'inspire', seconds: 5 },
      { phase: 'expire', seconds: 5 },
    ],
  },
  {
    id: 'box',
    title: 'Respiration carrée',
    subtitle: 'Recentre-toi avant un moment important',
    durationLabel: '4 min · guidée',
    cycles: 8,
    steps: [
      { phase: 'inspire', seconds: 4 },
      { phase: 'retiens', seconds: 4 },
      { phase: 'expire', seconds: 4 },
      { phase: 'retiens2', seconds: 4 },
    ],
  },
];

export const PHASE_LABEL: Record<BreathingStep['phase'], string> = {
  inspire: 'Inspire…',
  retiens: 'Retiens',
  expire: 'Expire…',
  retiens2: 'Retiens',
};
