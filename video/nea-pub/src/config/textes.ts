/** Tous les textes affichés, au même endroit (français, accents exacts). */
export const TEXTES = {
  accroche: { ligne1: 'Tu arrives à la salle…', ligne2Avant: 'sans savoir ', ligne2Orange: 'quoi faire ?' },
  /** Petites cartes qui se dispersent dans l'accroche (pas des captures de l'app). */
  cartesEnVrac: ['Squat ?', 'Combien de séries ?', 'Et après ?'],
  solution: { ligne1: 'Prépare ta séance.', ligne2: 'Avec NÉA.' },
  etapes: ['Programme', 'Séance', 'Progrès'] as const,
  etape1: '1. Ouvre ton programme.',
  etape2: '2. Retrouve tes exercices.',
  etape3: '3. Consulte tes progrès.',
  synthese: { ligne1: 'Moins d’impro.', ligne2: 'Plus de suivi.', coches: ['Programme', 'Séance', 'Progrès'] },
  conclusion: { logo: 'NÉA', ligne1: 'Ton coach.', ligne2: 'Ton rythme.', bouton: 'Découvre NÉA', site: 'neacoach.xyz' },
} as const;

/**
 * Voix off, une ligne par scène (dans l'ordre de `SCENES`). Les sous-titres en reprennent les mots
 * (`mots.json`) par petits groupes ; `cles` = mots mis en orange.
 */
export const VOIX: readonly { texte: string; groupes: number[]; cles: string[] }[] = [
  { texte: 'Tu arrives à la salle sans savoir quoi faire ?', groupes: [5, 4], cles: ['quoi', 'faire'] },
  { texte: 'Avec NÉA, retrouve ton programme et passe à ta séance.', groupes: [2, 3, 5], cles: ['NÉA', 'séance'] },
  { texte: 'Un : ouvre ton programme. Tu retrouves ce qui est prévu.', groupes: [4, 6], cles: ['programme', 'prévu'] },
  { texte: 'Deux : retrouve tes exercices, tes séries et tes répétitions.', groupes: [4, 5], cles: ['exercices', 'séries', 'répétitions'] },
  { texte: 'Trois : consulte tes progrès et garde le fil de ton parcours.', groupes: [4, 7], cles: ['progrès', 'parcours'] },
  { texte: 'Ton programme, tes séances, tes progrès. Au même endroit.', groupes: [2, 2, 2, 3], cles: ['programme', 'séances', 'progrès', 'même'] },
  { texte: 'Découvre NÉA sur neacoach point x y z.', groupes: [2, 6], cles: ['NÉA', 'neacoach.xyz'] },
];

/** Ce que la voix dit et ce que le sous-titre écrit (le site s'écrit comme il s'affiche). */
export const SOUS_TITRE_REMPLACE: Readonly<Record<string, string>> = { neacoach: 'neacoach.xyz', point: '', x: '', y: '', z: '' };
