/**
 * Le « déclic » de l'onboarding (audit du 6 nov. 2026, demandé par l'utilisateur) : ce qui a fait arrêter la personne avant,
 * la réponse de NÉA à chaque frein (uniquement des fonctions qui existent dans l'app), son profil à partager et le défi
 * qu'elle lance à ses amis. Fonctions pures, sans `@/data`.
 */

export type FreinId = 'temps' | 'quoi' | 'resultats' | 'motivation' | 'fatigue' | 'debut';

/** [id, ce que la personne répond, ce que NÉA change pour elle]. */
export const FREINS: readonly (readonly [FreinId, string, string])[] = [
  ['temps', 'Le manque de temps', 'Tes séances tiennent dans le temps que tu as choisi, et un jour chargé, tu fais ta séance à la maison.'],
  ['quoi', 'Je ne savais pas quoi faire', 'Chaque séance te dit tout : exercices illustrés, séries, charges et repos.'],
  ['resultats', 'Je ne voyais pas de résultats', 'Tes charges montent semaine après semaine, et tes records sont suivis.'],
  ['motivation', 'La motivation qui retombe', 'Ton coach te relance, ta série a des gels si tu rates un jour, et chaque séance te donne une carte.'],
  ['fatigue', 'La fatigue, les journées vides', 'Tu me dis comment tu te sens, et les jours sans énergie, je te propose une journée plus douce.'],
  ['debut', "C'est ma première fois", 'On commence simple, avec chaque mouvement expliqué pas à pas.'],
];

export const freinTexte = (id: FreinId) => FREINS.find(([k]) => k === id)?.[1] ?? '';
export const freinReponse = (id: FreinId) => FREINS.find(([k]) => k === id)?.[2] ?? '';

/** Ce que le coach répond après le choix des freins (2 réponses au plus pour rester court). */
export function reponseFreins(freins: readonly FreinId[], prenom: string): string[] {
  if (!freins.length) return [];
  if (freins.length === 1 && freins[0] === 'debut') return [`Bienvenue${prenom ? ', ' + prenom : ''} !`, freinReponse('debut')];
  const vrais = freins.filter((f) => f !== 'debut');
  return [
    `Ce n'est pas un manque de volonté${prenom ? ', ' + prenom : ''}.`,
    "Ton programme d'avant ne s'adaptait pas à toi. Le tien, si :",
    ...vrais.slice(0, 2).map(freinReponse),
  ];
}

/** Profil à partager, tiré du premier objectif (mots neutres, sans genre). */
const PROFILS: Record<string, string> = {
  masse: 'Force',
  poids: 'Affûtage',
  forme: 'Énergie',
  endu: 'Endurance',
  mental: 'Équilibre',
  disc: 'Discipline',
  conf: 'Renouveau',
};
export const profilAthlete = (goals: readonly string[]) => PROFILS[goals[0] ?? ''] ?? 'Énergie';

/** Le défi en chiffres, tirés du plan (aucune promesse de résultat). */
export function defiChiffres(days: number, dur: number, semaines: number) {
  const seances = days * semaines;
  return { seances, heures: Math.round((seances * dur) / 60), semaines };
}

export const LIEN_APP = 'https://apps.apple.com/app/id6816691008';

/** Message partagé : un défi lancé aux amis, avec le lien de l'app. */
export function messageDefi(o: { prenom: string; profil: string; programme: string; days: number; dur: number; semaines: number; coach: string }): string {
  return [
    `${o.prenom ? o.prenom + ' relève' : 'Je relève'} le défi NÉA 💪 Profil ${o.profil}.`,
    `${o.programme} : ${o.days} séances de ${o.dur} min par semaine pendant ${o.semaines} semaines, avec ${o.coach} comme coach.`,
    'Tu me suis ? On compare nos séries.',
    LIEN_APP,
  ].join('\n');
}
