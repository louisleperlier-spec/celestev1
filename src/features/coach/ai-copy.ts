import AsyncStorage from '@react-native-async-storage/async-storage';

import { DayStats } from '@/features/hydration/types';
import i18n from '@/lib/i18n';
import { todayKey } from '@/lib/date';

import { getAiProvider } from './ai-provider';
import { COACH_AI_SYSTEM_PROMPT } from './ai-system-prompt';
import { PriorityAction } from './rules-engine';

/**
 * Habillage IA du "pourquoi" de la priorité du jour — jamais le choix de l'action elle-même.
 * Générée au plus une fois par jour, mise en cache, avec repli déterministe si l'IA est
 * indisponible ou échoue. Voir ai-system-prompt.ts pour les garde-fous imposés au modèle.
 */

export interface CoachCopy {
  date: string;
  priorityExplanation: string;
  source: 'ai' | 'fallback';
}

const CACHE_KEY_PREFIX = 'lume.coach.copy.';

function fallbackPriorityText(action: PriorityAction): string {
  return i18n.t(`coach.fallback.${action.kind}`, {
    ml: action.targetMl ?? 0,
    hour: action.deadlineHour ?? 0,
  });
}

function buildUserPrompt(action: PriorityAction, today: DayStats): string {
  return [
    `Action déjà choisie par les règles (ne pas en proposer une autre) : ${action.kind}`,
    action.targetMl ? `Quantité visée : ${action.targetMl} ml` : null,
    action.deadlineHour ? `Avant : ${action.deadlineHour} h` : null,
    `Score du jour : ${today.globalScore}/100`,
    `Notes du jour — Volume: ${today.metrics.volume.grade}, Régularité: ${today.metrics.regularity.grade}, Timing: ${today.metrics.timing.grade}, Qualité: ${today.metrics.quality.grade}`,
    "Écris la phrase qui explique cette action à l'utilisateur, dans le rôle défini par le prompt système.",
  ]
    .filter(Boolean)
    .join('\n');
}

export async function getCoachCopy(action: PriorityAction, today: DayStats): Promise<CoachCopy> {
  const date = todayKey();
  const cacheKey = `${CACHE_KEY_PREFIX}${date}`;

  const cachedRaw = await AsyncStorage.getItem(cacheKey);
  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw) as CoachCopy;
      // Le cache ne vaut que pour la même action : si les règles ont changé d'avis
      // (nouvelle entrée loggée, journée avancée), on régénère plutôt que d'afficher un
      // texte qui ne correspond plus à ce qui est montré.
      if (cached.date === date && cachedActionMatches(cached, action)) return cached;
    } catch {
      // cache corrompu — on régénère
    }
  }

  const provider = getAiProvider();
  const aiText = await provider
    .generate({ systemPrompt: COACH_AI_SYSTEM_PROMPT, userPrompt: buildUserPrompt(action, today) })
    .catch(() => null);

  const copy: CoachCopy = aiText
    ? { date, priorityExplanation: aiText, source: 'ai' }
    : { date, priorityExplanation: fallbackPriorityText(action), source: 'fallback' };

  await AsyncStorage.setItem(cacheKey, JSON.stringify({ ...copy, kind: action.kind }));
  return copy;
}

function cachedActionMatches(cached: CoachCopy & { kind?: string }, action: PriorityAction): boolean {
  return cached.kind === action.kind;
}
