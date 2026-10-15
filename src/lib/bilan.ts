/**
 * « Ton bilan du jour » de l'Accueil (maquette de l'utilisateur, oct. 2026) : utile même sans Apple Watch.
 * Énergie, sommeil et courbatures viennent d'un check-in rapide (le ressenti) ; l'activité vient des séances
 * réellement enregistrées dans le journal de NÉA. Fonctions pures.
 */
import type { Log } from './xp';

/** Réponses du check-in : énergie 1 → 5, sommeil 1 → 4, courbatures 0 → 3. */
export type Ressenti = { d: string; t: number; energie: number; sommeil: number; courbatures: number };

export const ENERGIE = ['', 'Épuisé', 'Fatigué', 'Correct', 'En forme', 'Au top'] as const;
export const SOMMEIL = ['', 'Mauvais', 'Moyen', 'Bon', 'Très bon'] as const;
export const COURBATURES = ['Aucune', 'Légères', 'Modérées', 'Fortes'] as const;

/** Nombre de ressentis gardés (le plus récent en premier). */
export const RESSENTIS_MAX = 60;

/** Jour local AAAA-MM-JJ (le check-in du matin reste celui du jour jusqu'à minuit, heure du téléphone). */
export function jourLocal(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Ressenti d'aujourd'hui, s'il y en a un. */
export const ressentiDuJour = (liste: readonly Ressenti[] | undefined, now: Date = new Date()): Ressenti | null =>
  liste?.find((r) => r.d === jourLocal(now)) ?? null;

/** Ajoute (ou remplace) le ressenti de son jour. */
export const avecRessenti = (liste: readonly Ressenti[] | undefined, r: Ressenti): Ressenti[] =>
  [r, ...(liste ?? []).filter((x) => x.d !== r.d)].slice(0, RESSENTIS_MAX);

/** « 9 h 12 » */
export const heureCourte = (t: number) => {
  const d = new Date(t);
  return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
};

const lundi = (now: Date) => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

export type Activite = {
  /** Minutes et activités d'aujourd'hui. */
  min: number;
  n: number;
  /** Une activité d'aujourd'hui vient de l'Apple Watch. */
  montre: boolean;
  /** Minutes par jour, du lundi au dimanche de la semaine en cours, et rang d'aujourd'hui. */
  semaine: number[];
  auj: number;
};

/** Activité tirée du journal : aujourd'hui et la semaine en cours. */
export function activite(logs: readonly Log[], now: Date = new Date()): Activite {
  const debut = lundi(now);
  const semaine = [0, 0, 0, 0, 0, 0, 0];
  let n = 0;
  let montre = false;
  const auj = (now.getDay() + 6) % 7;
  for (const l of logs) {
    const d = new Date(l.d);
    const i = Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - debut.getTime()) / 864e5 + 0.5);
    if (i < 0 || i > 6) continue;
    semaine[i] += Math.max(0, Math.round(l.min));
    if (i === auj) {
      n++;
      if (l.src === 'montre') montre = true;
    }
  }
  return { min: semaine[auj], n, montre, semaine, auj };
}

/** « 1 séance terminée », « 2 activités terminées »… */
export function phraseActivite(a: Activite, types: readonly Log['type'][] = []): string {
  if (!a.n) return 'Rien d’enregistré aujourd’hui';
  const muscu = types.length > 0 && types.every((t) => t === 'muscu');
  const mot = muscu ? 'séance' : 'activité';
  return `${a.n} ${mot}${a.n > 1 ? 's' : ''} terminée${a.n > 1 ? 's' : ''}`;
}

/** Message du coach selon le bilan : check-in à faire, séance faite, journée à prendre en douceur, sinon le mot du jour. */
export function messageCoach(e: { ressenti: Ressenti | null; seanceFaite: boolean; motDuJour: string }): { titre: string; sous: string; checkin: boolean } {
  const r = e.ressenti;
  if (e.seanceFaite)
    return {
      titre: 'Bien joué pour ta séance !',
      sous: r ? 'Tu peux modifier ton ressenti à tout moment.' : 'Dis-moi comment tu te sens, en 10 secondes.',
      checkin: !r,
    };
  if (!r) return { titre: 'Comment tu te sens ?', sous: 'Réponds en 10 secondes pour remplir ton bilan du jour.', checkin: true };
  if (r.energie <= 2 || r.courbatures >= 2 || r.sommeil <= 1)
    return { titre: 'Vas-y en douceur aujourd’hui.', sous: 'Écoute ton corps : une séance plus légère ou des étirements, c’est très bien aussi.', checkin: false };
  return { titre: r.energie >= 4 ? 'Tu es en forme, profites-en !' : 'Un pas après l’autre.', sous: e.motDuJour, checkin: false };
}
