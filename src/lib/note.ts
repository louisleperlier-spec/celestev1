/**
 * Demande de note App Store (demandée par l'utilisateur, oct. 2026) : la fenêtre native d'Apple, proposée après
 * la 3e activité terminée, puis au plus une fois tous les 4 mois (Apple l'affiche lui-même 3 fois par an au plus).
 * Fonctions pures.
 */
export const ACTIVITES_AVANT_NOTE = 3;
export const ECART_NOTE_JOURS = 120;

/** Lien « Écrire un avis » de la fiche App Store. */
export const LIEN_AVIS = 'https://apps.apple.com/app/id6816691008?action=write-review';

/** Faut-il proposer la note maintenant ? `demandes` = dates (ms) des demandes déjà faites. */
export function doitDemanderNote(nbActivites: number, demandes: readonly number[] | undefined, now: number = Date.now()): boolean {
  if (nbActivites < ACTIVITES_AVANT_NOTE) return false;
  const derniere = Math.max(0, ...(demandes ?? []));
  return now - derniere >= ECART_NOTE_JOURS * 864e5;
}
