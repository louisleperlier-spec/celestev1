/**
 * Accès NÉA Plus (isPremium, wkLocked, progLocked du prototype).
 * L'abonnement arrive à l'étape 11 (RevenueCat) : d'ici là, tout le monde est en version gratuite.
 */
import { PROGRAMMES } from '@/data/programmes';
import { SEANCES_GRATUITES } from '@/data/seances';
import type { CoachId, ProgrammeId, SeanceId } from '@/data/types';

export const isPremium = (): boolean => false;

/** Séance du catalogue réservée à NÉA Plus (3 sont gratuites). */
export const wkLocked = (id: SeanceId) => !isPremium() && !SEANCES_GRATUITES.includes(id);

/** Programme réservé à NÉA Plus (le premier de chaque coach est gratuit). */
export const progLocked = (coach: CoachId, id: ProgrammeId) => !isPremium() && PROGRAMMES[coach][0].id !== id;
