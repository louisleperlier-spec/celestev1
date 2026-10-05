/**
 * Autres sports à noter à la main (hors cahier des charges, demandés par l'utilisateur, oct. 2026) : tennis, foot, natation, yoga…
 * `met` : dépense d'une intensité modérée (valeurs arrondies du Compendium of Physical Activities), `hk` : HKWorkoutActivityType.
 */

export type FamilleSport = 'raquette' | 'equipe' | 'combat' | 'eau' | 'glisse' | 'forme' | 'plein-air';

export type Sport = { id: string; nom: string; emoji: string; famille: FamilleSport; met: number; hk: number };

export const FAMILLES: Record<FamilleSport, string> = {
  raquette: 'Raquettes',
  equipe: "Sports d'équipe",
  combat: 'Combat',
  eau: 'Sports d’eau',
  glisse: 'Glisse',
  forme: 'Forme et bien-être',
  'plein-air': 'Plein air',
};

export const SPORTS: readonly Sport[] = [
  { id: 'tennis', nom: 'Tennis', emoji: '🎾', famille: 'raquette', met: 7.3, hk: 48 },
  { id: 'padel', nom: 'Padel', emoji: '🥎', famille: 'raquette', met: 6, hk: 34 },
  { id: 'badminton', nom: 'Badminton', emoji: '🏸', famille: 'raquette', met: 5.5, hk: 4 },
  { id: 'squash', nom: 'Squash', emoji: '🎾', famille: 'raquette', met: 7.3, hk: 43 },
  { id: 'ping-pong', nom: 'Tennis de table', emoji: '🏓', famille: 'raquette', met: 4, hk: 47 },
  { id: 'pickleball', nom: 'Pickleball', emoji: '🏓', famille: 'raquette', met: 4.5, hk: 79 },
  { id: 'football', nom: 'Soccer', emoji: '⚽', famille: 'equipe', met: 7, hk: 41 },
  { id: 'basketball', nom: 'Basketball', emoji: '🏀', famille: 'equipe', met: 6.5, hk: 6 },
  { id: 'volleyball', nom: 'Volleyball', emoji: '🏐', famille: 'equipe', met: 4, hk: 51 },
  { id: 'handball', nom: 'Handball', emoji: '🤾', famille: 'equipe', met: 8, hk: 23 },
  { id: 'hockey', nom: 'Hockey', emoji: '🏒', famille: 'equipe', met: 8, hk: 25 },
  { id: 'rugby', nom: 'Rugby', emoji: '🏉', famille: 'equipe', met: 8.3, hk: 36 },
  { id: 'baseball', nom: 'Baseball', emoji: '⚾', famille: 'equipe', met: 5, hk: 5 },
  { id: 'football-americain', nom: 'Football', emoji: '🏈', famille: 'equipe', met: 8, hk: 1 },
  { id: 'ultimate', nom: 'Ultimate frisbee', emoji: '🥏', famille: 'equipe', met: 8, hk: 75 },
  { id: 'boxe', nom: 'Boxe', emoji: '🥊', famille: 'combat', met: 7.8, hk: 8 },
  { id: 'kickboxing', nom: 'Kickboxing', emoji: '🥋', famille: 'combat', met: 7.3, hk: 65 },
  { id: 'arts-martiaux', nom: 'Arts martiaux', emoji: '🥋', famille: 'combat', met: 7, hk: 28 },
  { id: 'lutte', nom: 'Lutte', emoji: '🤼', famille: 'combat', met: 6, hk: 56 },
  { id: 'natation', nom: 'Natation', emoji: '🏊', famille: 'eau', met: 6, hk: 46 },
  { id: 'aquaforme', nom: 'Aquaforme', emoji: '💦', famille: 'eau', met: 5.5, hk: 53 },
  { id: 'kayak', nom: 'Kayak / canot', emoji: '🛶', famille: 'eau', met: 5, hk: 31 },
  { id: 'paddle', nom: 'Planche à pagaie', emoji: '🏄', famille: 'eau', met: 6, hk: 31 },
  { id: 'surf', nom: 'Surf', emoji: '🏄', famille: 'eau', met: 3, hk: 45 },
  { id: 'aviron', nom: 'Aviron', emoji: '🚣', famille: 'eau', met: 7, hk: 35 },
  { id: 'ski-alpin', nom: 'Ski alpin', emoji: '⛷️', famille: 'glisse', met: 5.3, hk: 61 },
  { id: 'ski-fond', nom: 'Ski de fond', emoji: '🎿', famille: 'glisse', met: 9, hk: 60 },
  { id: 'snowboard', nom: 'Planche à neige', emoji: '🏂', famille: 'glisse', met: 5.3, hk: 67 },
  { id: 'patin', nom: 'Patin', emoji: '⛸️', famille: 'glisse', met: 7, hk: 39 },
  { id: 'skate', nom: 'Planche à roulettes', emoji: '🛹', famille: 'glisse', met: 5, hk: 39 },
  { id: 'raquette-neige', nom: 'Raquette', emoji: '❄️', famille: 'glisse', met: 6.5, hk: 40 },
  { id: 'yoga', nom: 'Yoga', emoji: '🧘', famille: 'forme', met: 2.5, hk: 57 },
  { id: 'pilates', nom: 'Pilates', emoji: '🤸', famille: 'forme', met: 3, hk: 66 },
  { id: 'etirements', nom: 'Étirements', emoji: '🙆', famille: 'forme', met: 2.3, hk: 62 },
  { id: 'danse', nom: 'Danse', emoji: '💃', famille: 'forme', met: 5.5, hk: 78 },
  { id: 'zumba', nom: 'Zumba', emoji: '🪩', famille: 'forme', met: 6.5, hk: 77 },
  { id: 'hiit', nom: 'HIIT', emoji: '🔥', famille: 'forme', met: 8, hk: 63 },
  { id: 'crossfit', nom: 'CrossFit', emoji: '🏋️', famille: 'forme', met: 8, hk: 20 },
  { id: 'corde', nom: 'Corde à sauter', emoji: '🪢', famille: 'forme', met: 11, hk: 64 },
  { id: 'elliptique', nom: 'Elliptique', emoji: '🏃', famille: 'forme', met: 5, hk: 16 },
  { id: 'rameur', nom: 'Rameur', emoji: '🚣', famille: 'forme', met: 7, hk: 35 },
  { id: 'escaliers', nom: 'Escaliers', emoji: '🪜', famille: 'forme', met: 8, hk: 44 },
  { id: 'marche', nom: 'Marche', emoji: '🚶', famille: 'plein-air', met: 3.5, hk: 52 },
  { id: 'escalade', nom: 'Escalade', emoji: '🧗', famille: 'plein-air', met: 8, hk: 9 },
  { id: 'golf', nom: 'Golf', emoji: '⛳', famille: 'plein-air', met: 4.8, hk: 21 },
  { id: 'equitation', nom: 'Équitation', emoji: '🏇', famille: 'plein-air', met: 5.5, hk: 17 },
  { id: 'athletisme', nom: 'Athlétisme', emoji: '🏅', famille: 'plein-air', met: 8, hk: 49 },
];

export const sportParId = (id: string | undefined) => SPORTS.find((s) => s.id === id);

export type Intensite = 'legere' | 'moderee' | 'intense';
export const INTENSITES: Record<Intensite, { nom: string; facteur: number }> = {
  legere: { nom: 'Légère', facteur: 0.75 },
  moderee: { nom: 'Modérée', facteur: 1 },
  intense: { nom: 'Intense', facteur: 1.25 },
};

/** Calories : MET × poids (kg) × heures, corrigé par l'intensité ressentie. */
export const kcalSport = (met: number, poids: number, min: number, i: Intensite) => Math.round(met * INTENSITES[i].facteur * poids * (min / 60));

/** XP d'un sport noté : 20 + 1 par tranche de 3 min, 70 au plus. */
export const xpSport = (min: number) => Math.min(70, 20 + Math.round(min / 3));

/** Séance de musculation libre (séries notées à la main) : MET 5. */
export const MET_MUSCU_LIBRE = 5;

/** XP d'une séance libre : 30 + 2 par série, 70 au plus. */
export const xpMuscuLibre = (series: number) => Math.min(70, 30 + 2 * series);

export type SerieLibre = { reps: number; kg: number };

/** Volume soulevé (kg) : répétitions × charge ajoutée (0 au poids du corps). */
export const volumeLibre = (series: readonly SerieLibre[]) => Math.round(series.reduce((a, s) => a + s.reps * s.kg, 0));

/** Recherche sans accents ni majuscules. */
export const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
