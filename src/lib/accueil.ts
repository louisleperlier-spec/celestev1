/** Cartes de l'Accueil, à afficher ou masquer et à ordonner (« Mon écran d'accueil » du Profil). */
export type IdCarte = 'bilan' | 'journee' | 'coach' | 'seance' | 'plus' | 'reperes' | 'cercles' | 'ligue';

export type CarteAccueil = { id: IdCarte; on: boolean };

export const CARTES_ACCUEIL: Readonly<Record<IdCarte, { titre: string; sous: string }>> = {
  bilan: { titre: 'Ton bilan du jour', sous: 'Anneaux Récupération et Effort' },
  journee: { titre: 'Ta journée', sous: 'Les choses à faire aujourd’hui pour une bonne journée' },
  coach: { titre: 'Mot du coach', sous: 'Son message du jour' },
  seance: { titre: 'Ta prochaine séance', sous: 'Exercices et bouton Commencer' },
  plus: { titre: 'NÉA Plus', sous: "L'essai gratuit (version gratuite seulement)" },
  reperes: { titre: 'Sommeil et VFC', sous: 'Ta dernière nuit et ta dernière VFC' },
  cercles: { titre: 'Tes cercles de la semaine', sous: 'Bouger, Exercice, Sommeil, Récupération' },
  ligue: { titre: 'Ligue', sous: 'Niveau, quêtes du jour et classement' },
};

export const ACCUEIL_DEFAUT: readonly CarteAccueil[] = [
  { id: 'bilan', on: true },
  { id: 'coach', on: true },
  { id: 'seance', on: true },
  { id: 'reperes', on: true },
  { id: 'journee', on: true },
  { id: 'plus', on: true },
  { id: 'cercles', on: false },
  { id: 'ligue', on: false },
];

/** Liste sauvegardée remise d'aplomb : cartes inconnues retirées, nouvelles cartes ajoutées (masquées) à la fin. */
export function ordreAccueil(sauve: readonly CarteAccueil[] | undefined | null): CarteAccueil[] {
  if (!sauve?.length) return [...ACCUEIL_DEFAUT];
  const connues = sauve.filter((c, i) => c.id in CARTES_ACCUEIL && sauve.findIndex((x) => x.id === c.id) === i);
  // « Ta journée » (oct. 2026) : affichée pour tout le monde, après les repères (Sommeil / VFC), même avec un ordre déjà personnalisé.
  if (!connues.some((c) => c.id === 'journee')) {
    const i = Math.max(connues.findIndex((c) => c.id === 'reperes'), connues.findIndex((c) => c.id === 'bilan'));
    connues.splice(i + 1, 0, { id: 'journee', on: true });
  }
  const manquantes = ACCUEIL_DEFAUT.filter((d) => !connues.some((c) => c.id === d.id)).map((d) => ({ ...d, on: false }));
  return [...connues, ...manquantes];
}
