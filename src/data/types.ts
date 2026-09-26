// Généré depuis NEA-donnees-et-images.zip (identique aux constantes du prototype `prototype/nea-app.html`).
// Ne pas modifier à la main : corriger la source puis régénérer.

/** Les 6 coachs (`COACHES`). */
export type CoachId =
  | 'axel'
  | 'nova'
  | 'kai'
  | 'luna'
  | 'blaze'
  | 'rex';

/** Les 50 exercices (`EXL`). */
export type ExerciceId =
  | 'developpe_couche_halteres'
  | 'developpe_incline_halteres'
  | 'developpe_couche_barre'
  | 'ecarte_halteres'
  | 'pompes'
  | 'pompes_inclinees'
  | 'dips'
  | 'presse_pectoraux'
  | 'rowing_un_bras'
  | 'rowing_barre'
  | 'tirage_vertical'
  | 'tirage_horizontal'
  | 'tractions'
  | 'tractions_assistees'
  | 'face_pull'
  | 'souleve_terre'
  | 'developpe_epaules'
  | 'elevations_laterales'
  | 'elevations_frontales'
  | 'oiseau_halteres'
  | 'presse_epaules'
  | 'curl_biceps'
  | 'curl_marteau'
  | 'curl_pupitre'
  | 'curl_poulie'
  | 'extension_triceps_poulie'
  | 'extension_triceps_tete'
  | 'extension_triceps_couche'
  | 'squat_barre'
  | 'goblet_squat'
  | 'squat_poids_corps'
  | 'fentes_arriere'
  | 'fentes_marche'
  | 'squat_bulgare'
  | 'step_up'
  | 'presse_cuisses'
  | 'leg_extension'
  | 'leg_curl'
  | 'souleve_roumain'
  | 'hip_thrust'
  | 'pont_fessier'
  | 'mollets_debout'
  | 'planche'
  | 'planche_laterale'
  | 'dead_bug'
  | 'bird_dog'
  | 'crunch'
  | 'releve_genoux'
  | 'mountain_climbers'
  | 'velo_stationnaire';

/** Les 41 séances prêtes (`CAT`). */
export type SeanceId =
  | 'm_graisse'
  | 'm_circuit'
  | 'm_masse'
  | 'm_haut'
  | 'm_dos'
  | 'm_abdos'
  | 'm_jambes'
  | 's_machines'
  | 's_jambes'
  | 's_force'
  | 's_push'
  | 's_pull'
  | 's_brule'
  | 's_fessiers'
  | 'e_parc'
  | 'e_hiit'
  | 'e_street'
  | 'e_velo'
  | 'e_frac'
  | 'e_reveil'
  | 'e_jambes'
  | 'm_express'
  | 'm_bras'
  | 'm_epaules'
  | 'm_pecs'
  | 'm_matin'
  | 'm_hiit20'
  | 'm_lombaires'
  | 's_premiere'
  | 's_bras'
  | 's_dos'
  | 's_hautforce'
  | 's_basforce'
  | 's_cardio'
  | 's_full45'
  | 'e_banc'
  | 'e_coureurs'
  | 'e_velolong'
  | 'e_velorecup'
  | 'e_tabata'
  | 'e_abdos';

/** Identifiants de programme (uniques par coach, pas globalement). */
export type ProgrammeId =
  | 'masse'
  | 'bras'
  | 'seche'
  | 'doux'
  | 'dos'
  | 'zen'
  | 'base'
  | 'velo'
  | 'circuit'
  | 'hiit'
  | 'abdos'
  | 'express'
  | 'power'
  | 'athlete'
  | 'burn'
  | 'force';

/** Modèles de séance (`TPL`). */
export type TemplateId =
  | 'haut'
  | 'bas'
  | 'push'
  | 'pull'
  | 'jambes'
  | 'cardio'
  | 'doux_full'
  | 'doux_haut'
  | 'doux_bas'
  | 'circuit_full'
  | 'circuit_haut'
  | 'circuit_bas'
  | 'hiit_full'
  | 'hiit_bas'
  | 'hiit_haut'
  | 'hiit_abdos'
  | 'explo_haut'
  | 'explo_bas'
  | 'explo_full'
  | 'force_a'
  | 'force_b'
  | 'force_c'
  | 'bras'
  | 'seche'
  | 'doux_dos'
  | 'velo_jambes'
  | 'express'
  | 'abdos_ete'
  | 'athlete';

/** Groupes musculaires (`GRP`). */
export type GroupeId =
  | 'pecs'
  | 'dos'
  | 'epaules'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'ischios'
  | 'fessiers'
  | 'mollets'
  | 'abdos'
  | 'cardio';

/** Matériel (`EQN`). */
export type MaterielId =
  | 'pdc'
  | 'hal'
  | 'bar'
  | 'mac'
  | 'pou'
  | 'velo';

/** Lieux des séances (`LIEUX`). */
export type LieuId =
  | 'maison'
  | 'salle'
  | 'ext';

/** Lieu choisi à l'onboarding (`GEAR`). */
export type LieuOnboarding = 'maison' | 'salle' | 'deux';

/** Objectifs de l'onboarding (`GOALS`). */
export type GoalId =
  | 'masse'
  | 'poids'
  | 'forme'
  | 'endu'
  | 'mental'
  | 'disc'
  | 'conf';

/** Filtres par objectif du catalogue (`GOALF`). */
export type GoalFiltre =
  | 'Tous'
  | 'Prise de muscle'
  | 'Perte de graisse'
  | 'Tonification'
  | 'Force'
  | 'Endurance'
  | 'Posture';

/** Mouvements principaux de force (`SPECIAL`), référencés dans `TPL` par `@<id>`. */
export type SpecialId =
  | 'squat'
  | 'bench'
  | 'deadlift';

/** Niveau : 1 débutant, 2 intermédiaire, 3 avancé. */
export type Niveau = 1 | 2 | 3;

/** Nombre de séances par semaine (2 à 7). */
export type JoursParSemaine = '2' | '3' | '4' | '5' | '6' | '7';

export type Coach = {
  id: CoachId;
  nom: string;
  spec: string;
  /** Couleur du coach. */
  c: string;
  traits: readonly [string, string, string];
  style: string;
  quote: string;
  daily: string;
  prog: string;
  desc: string;
  /** Fourchette de répétitions [min, max]. */
  reps: readonly [number, number];
  /** Séries selon le niveau [débutant, intermédiaire, avancé]. */
  sets: readonly [number, number, number];
  /** Repos en secondes. */
  rest: number;
  tempo: string;
  /** Durée d'une répétition en secondes. */
  rep_s: number;
  /** Intensité. */
  int: number;
  /** Ton du coach (pour le coach IA). */
  voix: string;
  /** Exercices favoris, par ordre de préférence. */
  fav: readonly ExerciceId[];
  /** Découpage de la semaine selon le nombre de séances. */
  split: Readonly<Record<JoursParSemaine, readonly TemplateId[]>>;
  /** Pas d'exercice à la barre. */
  noBar?: boolean;
  /** Durée de travail en secondes (intervalles). */
  time?: number;
};

export type Exercice = {
  id: ExerciceId;
  nom: string;
  groupe: GroupeId;
  materiel: MaterielId;
  /** Ratio de charge par rapport au poids du corps. */
  ratioCharge: number;
  niveau: Niveau;
  met: number;
  type: 'reps' | 'time';
  muscles: string;
  /** Les 3 étapes « comment faire ». */
  etapes: readonly [string, string, string];
  erreur: string;
  /** Exercice qui se fait avec une seule haltère. */
  uneHaltere: boolean;
};

/**
 * Exercice d'une séance au format du prototype : `id:séries:reps:repos`.
 * Reps : `10`, `8-12`, `40s` (secondes) ou `45m` (minutes). Repos en secondes.
 */
export type SeanceExercice = `${ExerciceId}:${number}:${string}:${number}`;

export type Seance = {
  id: SeanceId;
  /** Titre. */
  t: string;
  lieu: LieuId;
  lvl: Niveau;
  goal: Exclude<GoalFiltre, 'Tous'>;
  coach: CoachId;
  desc: string;
  ex: readonly SeanceExercice[];
  /** Mise en avant (« À la une »). */
  feat?: 1;
  /** Sortie vélo : durée en minutes. */
  ride?: number;
};

export type Programme = {
  id: ProgrammeId;
  nom: string;
  /** Durée en semaines. */
  sem: number;
  desc: string;
  /** Modèles de séance propres au programme (sinon, découpage du coach). */
  tpls?: readonly TemplateId[];
  reps?: readonly [number, number];
  rest?: number;
  sets?: readonly [number, number, number];
  time?: number;
};

/** Modèle de séance : [titre, groupes musculaires (ou `@<mouvement>` de force)]. */
export type Template = readonly [string, readonly (GroupeId | `@${SpecialId}`)[]];

/** Objectif : [id, libellé, icône]. */
export type Goal = readonly [GoalId, string, string];

export type Plan = {
  id: 'an' | 'mois';
  nom: string;
  /** Prix en dollars canadiens. */
  prix: number;
  per: string;
  /** Jours d'essai gratuit. */
  trial?: number;
  badge?: string;
};

/** Quête du jour : [id, libellé, XP]. */
export type Quest = readonly ['seance' | 'velo' | 'coach' | 'poids', string, number];

/** Rang : [nom, couleur]. */
export type Rank = readonly [string, string];
