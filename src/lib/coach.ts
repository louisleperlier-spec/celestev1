/**
 * Coach IA : message d'accueil, réponses de secours, messages gratuits du jour, résumé du profil envoyé au serveur.
 * Portage du prototype (`vChat`, `FALLBACK`, `ask`, `chatLeft`). Le résumé ne contient jamais l'email.
 */
import { GOALS } from '@/data/referentiels';
import type { Coach } from '@/data/types';

import { exercice, type Plan } from './plan';
import { JOURS } from './semaine';
import { dayKey, type Log } from './xp';

export type MessageChat = { r: 'me' | 'bot'; t: string };
export type QuotaChat = { d: string; n: number };

/** Messages gratuits par jour sans NÉA Plus. */
export const CHAT_GRATUIT = 3;

/** Suggestions sous la conversation (.quick). */
export const QUESTIONS_RAPIDES = ['Adapte ma séance', 'Je suis fatigué', 'Conseil nutrition', 'Explique ma VFC'] as const;

/** Réponses du prototype quand le modèle n'est pas joignable. */
export const SECOURS: Record<string, string> = {
  'Adapte ma séance': "Si tu manques de temps, garde les 3 premiers exercices et enlève une série à chacun. Tu gardes l'essentiel.",
  'Je suis fatigué':
    "On baisse l'intensité aujourd'hui : échauffement, 2 séries légères et étirements. Si la fatigue dure plusieurs jours, repose-toi vraiment.",
  'Conseil nutrition': "Une source de protéines à chaque repas, de l'eau régulièrement et un vrai repas après ta séance.",
  'Explique ma VFC':
    'La VFC mesure la variation entre tes battements. Plus elle est haute au repos, mieux tu récupères. Si elle chute plusieurs jours, allège ta séance.',
};

/** Réponse de secours : celle de la question rapide, sinon un encouragement vers la prochaine séance. */
export const reponseSecours = (texte: string, prenom: string, prochaine: string) =>
  SECOURS[texte] ?? `Bien reçu ${prenom}. Ta prochaine séance : ${prochaine.toLowerCase()}. Donne tout sur chaque rep, je suis avec toi.`;

/** Premier message du coach (nouvelle conversation ou changement de coach). */
export const accueilCoach = (c: Coach, prenom: string): MessageChat => ({
  r: 'bot',
  t: `Salut ${prenom} ! Moi c'est ${c.nom}. ${c.quote} Ton programme ${c.style.toLowerCase()} est prêt. Qu'est-ce que je peux faire pour toi ?`,
});

/** Messages gratuits restants aujourd'hui (chatLeft). */
export function chatLeft(q: QuotaChat | null, premium: boolean, now: Date = new Date()): number {
  if (premium) return 99;
  const n = q && q.d === dayKey(now) ? q.n : 0;
  return Math.max(0, CHAT_GRATUIT - n);
}

/** Un message de plus aujourd'hui. */
export const compterMessage = (q: QuotaChat | null, now: Date = new Date()): QuotaChat => {
  const d = dayKey(now);
  return { d, n: (q && q.d === d ? q.n : 0) + 1 };
};

/** Moyenne des valeurs positives (avgOf). */
const avgOf = (logs: readonly Log[], k: 'hrAvg' | 'hrv') => {
  const v = logs.map((l) => l[k] ?? 0).filter((x) => x > 0);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
};

/** Profil et programme de la semaine, comme dans la consigne du prototype. */
export function resumeProfil(p: { name: string; age: number; weight: number; goals: readonly string[]; level: string; gear: string; logs: readonly Log[] }, plan: Plan): string {
  const objectifs = p.goals.map((g) => GOALS.find((x) => x[0] === g)?.[1]).filter(Boolean).join(', ');
  const semaine = plan.sessions.map((s) => JOURS[s.day] + ' ' + s.titre + ' (' + s.items.map((i) => exercice(i.id).nom).join(', ') + ')').join(' ; ');
  return `Profil : ${p.name}, ${p.age} ans, ${p.weight} kg, objectifs ${objectifs}, niveau ${p.level}, matériel ${p.gear}. FC moyenne ${avgOf(p.logs, 'hrAvg')} bpm, VFC moyenne ${avgOf(p.logs, 'hrv')} ms.
Programme de la semaine : ${semaine}`;
}
