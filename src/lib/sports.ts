/**
 * Autres sports à noter à la main (hors cahier des charges, demandés par l'utilisateur, oct. 2026) : tennis, foot, natation, yoga…
 * `met` : dépense d'une intensité modérée (valeurs arrondies du Compendium of Physical Activities), `hk` : HKWorkoutActivityType.
 */

export type FamilleSport = 'raquette' | 'equipe' | 'combat' | 'eau' | 'glisse' | 'forme' | 'plein-air';

/** Icône au trait (`components/app/IconeSport.tsx`). */
export type GlypheSport =
  | 'aviron'
  | 'balle'
  | 'baseball'
  | 'basket'
  | 'ceinture'
  | 'corde'
  | 'course'
  | 'escalade'
  | 'escaliers'
  | 'etirement'
  | 'fer'
  | 'flamme'
  | 'flocon'
  | 'frisbee'
  | 'gant'
  | 'golf'
  | 'goutte'
  | 'hockey'
  | 'kettlebell'
  | 'lotus'
  | 'lutte'
  | 'marche'
  | 'medaille'
  | 'musique'
  | 'nage'
  | 'ovale'
  | 'padel'
  | 'pagaie'
  | 'patin'
  | 'pingpong'
  | 'planche'
  | 'raquette'
  | 'skate'
  | 'ski'
  | 'soccer'
  | 'surf'
  | 'volant'
  | 'volley';

export type Sport = { id: string; nom: string; icone: GlypheSport; famille: FamilleSport; met: number; hk: number };

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
  { id: 'tennis', nom: 'Tennis', icone: 'raquette', famille: 'raquette', met: 7.3, hk: 48 },
  { id: 'padel', nom: 'Padel', icone: 'padel', famille: 'raquette', met: 6, hk: 34 },
  { id: 'badminton', nom: 'Badminton', icone: 'volant', famille: 'raquette', met: 5.5, hk: 4 },
  { id: 'squash', nom: 'Squash', icone: 'raquette', famille: 'raquette', met: 7.3, hk: 43 },
  { id: 'ping-pong', nom: 'Tennis de table', icone: 'pingpong', famille: 'raquette', met: 4, hk: 47 },
  { id: 'pickleball', nom: 'Pickleball', icone: 'pingpong', famille: 'raquette', met: 4.5, hk: 79 },
  { id: 'football', nom: 'Soccer', icone: 'soccer', famille: 'equipe', met: 7, hk: 41 },
  { id: 'basketball', nom: 'Basketball', icone: 'basket', famille: 'equipe', met: 6.5, hk: 6 },
  { id: 'volleyball', nom: 'Volleyball', icone: 'volley', famille: 'equipe', met: 4, hk: 51 },
  { id: 'handball', nom: 'Handball', icone: 'balle', famille: 'equipe', met: 8, hk: 23 },
  { id: 'hockey', nom: 'Hockey', icone: 'hockey', famille: 'equipe', met: 8, hk: 25 },
  { id: 'rugby', nom: 'Rugby', icone: 'ovale', famille: 'equipe', met: 8.3, hk: 36 },
  { id: 'baseball', nom: 'Baseball', icone: 'baseball', famille: 'equipe', met: 5, hk: 5 },
  { id: 'football-americain', nom: 'Football', icone: 'ovale', famille: 'equipe', met: 8, hk: 1 },
  { id: 'ultimate', nom: 'Ultimate frisbee', icone: 'frisbee', famille: 'equipe', met: 8, hk: 75 },
  { id: 'boxe', nom: 'Boxe', icone: 'gant', famille: 'combat', met: 7.8, hk: 8 },
  { id: 'kickboxing', nom: 'Kickboxing', icone: 'gant', famille: 'combat', met: 7.3, hk: 65 },
  { id: 'arts-martiaux', nom: 'Arts martiaux', icone: 'ceinture', famille: 'combat', met: 7, hk: 28 },
  { id: 'lutte', nom: 'Lutte', icone: 'lutte', famille: 'combat', met: 6, hk: 56 },
  { id: 'natation', nom: 'Natation', icone: 'nage', famille: 'eau', met: 6, hk: 46 },
  { id: 'aquaforme', nom: 'Aquaforme', icone: 'goutte', famille: 'eau', met: 5.5, hk: 53 },
  { id: 'kayak', nom: 'Kayak / canot', icone: 'pagaie', famille: 'eau', met: 5, hk: 31 },
  { id: 'paddle', nom: 'Planche à pagaie', icone: 'pagaie', famille: 'eau', met: 6, hk: 31 },
  { id: 'surf', nom: 'Surf', icone: 'surf', famille: 'eau', met: 3, hk: 45 },
  { id: 'aviron', nom: 'Aviron', icone: 'aviron', famille: 'eau', met: 7, hk: 35 },
  { id: 'ski-alpin', nom: 'Ski alpin', icone: 'ski', famille: 'glisse', met: 5.3, hk: 61 },
  { id: 'ski-fond', nom: 'Ski de fond', icone: 'ski', famille: 'glisse', met: 9, hk: 60 },
  { id: 'snowboard', nom: 'Planche à neige', icone: 'planche', famille: 'glisse', met: 5.3, hk: 67 },
  { id: 'patin', nom: 'Patin', icone: 'patin', famille: 'glisse', met: 7, hk: 39 },
  { id: 'skate', nom: 'Planche à roulettes', icone: 'skate', famille: 'glisse', met: 5, hk: 39 },
  { id: 'raquette-neige', nom: 'Raquette', icone: 'flocon', famille: 'glisse', met: 6.5, hk: 40 },
  { id: 'yoga', nom: 'Yoga', icone: 'lotus', famille: 'forme', met: 2.5, hk: 57 },
  { id: 'pilates', nom: 'Pilates', icone: 'etirement', famille: 'forme', met: 3, hk: 66 },
  { id: 'etirements', nom: 'Étirements', icone: 'etirement', famille: 'forme', met: 2.3, hk: 62 },
  { id: 'danse', nom: 'Danse', icone: 'musique', famille: 'forme', met: 5.5, hk: 78 },
  { id: 'zumba', nom: 'Zumba', icone: 'musique', famille: 'forme', met: 6.5, hk: 77 },
  { id: 'hiit', nom: 'HIIT', icone: 'flamme', famille: 'forme', met: 8, hk: 63 },
  { id: 'crossfit', nom: 'CrossFit', icone: 'kettlebell', famille: 'forme', met: 8, hk: 20 },
  { id: 'corde', nom: 'Corde à sauter', icone: 'corde', famille: 'forme', met: 11, hk: 64 },
  { id: 'elliptique', nom: 'Elliptique', icone: 'course', famille: 'forme', met: 5, hk: 16 },
  { id: 'rameur', nom: 'Rameur', icone: 'aviron', famille: 'forme', met: 7, hk: 35 },
  { id: 'escaliers', nom: 'Escaliers', icone: 'escaliers', famille: 'forme', met: 8, hk: 44 },
  { id: 'marche', nom: 'Marche', icone: 'marche', famille: 'plein-air', met: 3.5, hk: 52 },
  { id: 'escalade', nom: 'Escalade', icone: 'escalade', famille: 'plein-air', met: 8, hk: 9 },
  { id: 'golf', nom: 'Golf', icone: 'golf', famille: 'plein-air', met: 4.8, hk: 21 },
  { id: 'equitation', nom: 'Équitation', icone: 'fer', famille: 'plein-air', met: 5.5, hk: 17 },
  { id: 'athletisme', nom: 'Athlétisme', icone: 'medaille', famille: 'plein-air', met: 8, hk: 49 },
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

/** Symbole SF de chaque sport pour l'Activité en direct (écran verrouillé, Dynamic Island) ; iOS 17. */
const SF: Record<string, string> = {
  tennis: 'figure.tennis', padel: 'figure.racquetball', badminton: 'figure.badminton', squash: 'figure.squash', 'ping-pong': 'figure.table.tennis',
  pickleball: 'figure.pickleball', football: 'soccerball', basketball: 'basketball.fill', volleyball: 'volleyball.fill', handball: 'figure.handball',
  hockey: 'figure.hockey', rugby: 'figure.rugby', baseball: 'figure.baseball', 'football-americain': 'football.fill', ultimate: 'figure.disc.sports',
  boxe: 'figure.boxing', kickboxing: 'figure.kickboxing', 'arts-martiaux': 'figure.martial.arts', lutte: 'figure.wrestling', natation: 'figure.pool.swim',
  aquaforme: 'figure.water.fitness', kayak: 'oar.2.crossed', paddle: 'oar.2.crossed', surf: 'figure.surfing', aviron: 'figure.rower',
  'ski-alpin': 'figure.skiing.downhill', 'ski-fond': 'figure.skiing.crosscountry', snowboard: 'figure.snowboarding', patin: 'figure.skating',
  skate: 'skateboard.fill', 'raquette-neige': 'snowflake', yoga: 'figure.yoga', pilates: 'figure.pilates', etirements: 'figure.flexibility',
  danse: 'figure.dance', zumba: 'figure.socialdance', hiit: 'flame.fill', crossfit: 'figure.cross.training', corde: 'figure.jumprope',
  elliptique: 'figure.elliptical', rameur: 'figure.rower', escaliers: 'figure.stair.stepper', marche: 'figure.walk', escalade: 'figure.climbing',
  golf: 'figure.golf', equitation: 'figure.equestrian.sports', athletisme: 'medal.fill',
};
export const symboleSport = (id: string) => SF[id] ?? 'figure.mixed.cardio';
